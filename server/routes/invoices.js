import express from 'express';
import db from '../db.js';
import { sendWhatsAppNotification } from './whatsapp.js';
import { broadcastToCarwash } from '../server.js';

const router = express.Router();

// Get all invoices for a dealer
router.get('/', (req, res) => {
  try {
    const dealerId = req.query.dealer_id || 'dealer_sparkle';
    const status = req.query.status;

    let query = `
      SELECT 
        i.*,
        w.wash_code,
        w.service_name,
        w.addons_json,
        w.is_free_wash,
        w.free_wash_reason,
        w.queue_time as check_in_time,
        w.queue_time as check_in_time,
        w.queue_time,
        w.completed_time,
        w.bay_number,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.is_subscribed as customer_subscribed,
        v.license_plate,
        v.make as vehicle_make,
        v.model as vehicle_model,
        d.currency as dealer_currency,
        d.name as dealer_name,
        d.phone as dealer_phone,
        d.email as dealer_email,
        d.address as dealer_address,
        d.city as dealer_city
      FROM invoices i
      JOIN washes w ON w.id = i.wash_id
      JOIN customers c ON c.id = i.customer_id
      JOIN vehicles v ON v.id = w.vehicle_id
      JOIN dealers d ON d.id = i.dealer_id
      WHERE i.dealer_id = ?
    `;

    const params = [dealerId];
    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY i.issued_at DESC`;

    const invoices = db.prepare(query).all(...params);

    const parsed = invoices.map(inv => ({
      ...inv,
      addons: JSON.parse(inv.addons_json || '[]')
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invoice by ID
router.get('/:id', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT 
        i.*,
        w.wash_code,
        w.service_name,
        w.addons_json,
        w.is_free_wash,
        w.free_wash_reason,
        w.queue_time as check_in_time,
        w.queue_time,
        w.completed_time,
        w.bay_number,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.is_subscribed as customer_subscribed,
        c.subscription_plan,
        v.license_plate,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.color as vehicle_color,
        v.vehicle_type,
        d.name as dealer_name,
        d.phone as dealer_phone,
        d.email as dealer_email,
        d.address as dealer_address,
        d.city as dealer_city,
        d.currency as dealer_currency
      FROM invoices i
      JOIN washes w ON w.id = i.wash_id
      JOIN customers c ON c.id = i.customer_id
      JOIN vehicles v ON v.id = w.vehicle_id
      JOIN dealers d ON d.id = i.dealer_id
      WHERE i.id = ? OR i.wash_id = ? OR i.invoice_number = ?
    `).get(req.params.id, req.params.id, req.params.id);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json({
      ...invoice,
      addons: JSON.parse(invoice.addons_json || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark invoice as paid
router.patch('/:id/pay', (req, res) => {
  try {
    const { payment_method = 'Card' } = req.body;
    const invoiceId = req.params.id;

    db.prepare(`
      UPDATE invoices 
      SET status = 'PAID',
          payment_method = ?,
          paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payment_method, invoiceId);

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    broadcastToCarwash(updated.dealer_id, 'invoice:updated', { invoice: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send invoice via WhatsApp
router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT 
        i.*,
        w.wash_code,
        w.service_name,
        w.is_free_wash,
        w.free_wash_reason,
        c.id as customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        v.license_plate,
        v.make as vehicle_make,
        v.model as vehicle_model,
        d.id as dealer_id,
        d.name as dealer_name,
        d.phone as dealer_phone
      FROM invoices i
      JOIN washes w ON w.id = i.wash_id
      JOIN customers c ON c.id = i.customer_id
      JOIN vehicles v ON v.id = w.vehicle_id
      JOIN dealers d ON d.id = i.dealer_id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const waResult = await sendWhatsAppNotification({
      dealerId: invoice.dealer_id,
      dealerName: invoice.dealer_name,
      dealerPhone: invoice.dealer_phone,
      customerId: invoice.customer_id,
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone,
      washId: invoice.wash_id,
      washCode: invoice.wash_code,
      licensePlate: invoice.license_plate,
      carModel: `${invoice.vehicle_make} ${invoice.vehicle_model}`,
      serviceName: invoice.service_name,
      invoiceNumber: invoice.invoice_number,
      totalAmount: invoice.total,
      messageType: 'INVOICE',
      isFreeWash: Boolean(invoice.is_free_wash),
      freeReason: invoice.free_wash_reason
    });

    // Mark invoice whatsapp_sent = 1
    db.prepare(`
      UPDATE invoices 
      SET whatsapp_sent = 1,
          whatsapp_sent_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(invoice.id);

    res.json({
      message: 'Invoice sent via WhatsApp successfully!',
      whatsapp: waResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
