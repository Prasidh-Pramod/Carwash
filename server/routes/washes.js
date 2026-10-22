import express from 'express';
import db from '../db.js';
import { checkCustomerLoyaltyStatus } from './customers.js';
import { sendWhatsAppNotification } from './whatsapp.js';
import { broadcastToCarwash, broadcastToTracker } from '../server.js';

const router = express.Router();

// Helper to generate Wash Code
function generateWashCode(dealerId) {
  const count = db.prepare('SELECT count(*) as count FROM washes WHERE dealer_id = ?').get(dealerId);
  const num = (count.count + 1).toString().padStart(4, '0');
  return `WSH-${num}`;
}

// Helper to generate Invoice Number
function generateInvoiceNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${new Date().getFullYear()}-${rand}`;
}

// Get all washes for a dealer
router.get('/', (req, res) => {
  try {
    const dealerId = req.query.dealer_id || 'dealer_sparkle';
    const status = req.query.status;

    let query = `
      SELECT 
        w.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.is_subscribed as customer_subscribed,
        c.subscription_plan,
        v.license_plate,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.color as vehicle_color,
        v.vehicle_type,
        i.id as invoice_id,
        i.invoice_number,
        i.total as invoice_total,
        i.discount as invoice_discount,
        i.status as invoice_status,
        i.whatsapp_sent as invoice_wa_sent
      FROM washes w
      JOIN customers c ON c.id = w.customer_id
      JOIN vehicles v ON v.id = w.vehicle_id
      LEFT JOIN invoices i ON i.wash_id = w.id
      WHERE w.dealer_id = ?
    `;

    const params = [dealerId];
    if (status) {
      query += ` AND w.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY w.queue_time DESC`;

    const washes = db.prepare(query).all(...params);

    const parsed = washes.map(w => ({
      ...w,
      addons: JSON.parse(w.addons_json || '[]')
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single wash by ID (or public tracking code)
router.get('/:id', (req, res) => {
  try {
    const wash = db.prepare(`
      SELECT 
        w.*,
        d.name as dealer_name,
        d.phone as dealer_phone,
        d.address as dealer_address,
        d.city as dealer_city,
        d.currency as dealer_currency,
        c.name as customer_name,
        c.phone as customer_phone,
        c.is_subscribed as customer_subscribed,
        v.license_plate,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.color as vehicle_color,
        i.id as invoice_id,
        i.invoice_number,
        i.subtotal,
        i.discount,
        i.tax,
        i.total,
        i.status as invoice_status,
        i.payment_method
      FROM washes w
      JOIN dealers d ON d.id = w.dealer_id
      JOIN customers c ON c.id = w.customer_id
      JOIN vehicles v ON v.id = w.vehicle_id
      LEFT JOIN invoices i ON i.wash_id = w.id
      WHERE w.id = ? OR w.wash_code = ?
    `).get(req.params.id, req.params.id);

    if (!wash) return res.status(404).json({ error: 'Wash record not found' });

    res.json({
      ...wash,
      addons: JSON.parse(wash.addons_json || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check-in a new car for wash
router.post('/checkin', async (req, res) => {
  try {
    const {
      dealer_id,
      customer_id,
      vehicle_id,
      service_id,
      addons = [],
      bay_number = 1,
      washer_staff = 'Bay Attendant',
      before_photo = null,
      notes = '',
      send_whatsapp = true
    } = req.body;

    if (!dealer_id || !customer_id || !vehicle_id || !service_id) {
      return res.status(400).json({ error: 'dealer_id, customer_id, vehicle_id, and service_id are required' });
    }

    const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(dealer_id);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);

    if (!dealer || !customer || !vehicle || !service) {
      return res.status(404).json({ error: 'Invalid dealer, customer, vehicle or service' });
    }

    // Check loyalty rule for this dealer & customer
    const loyalty = checkCustomerLoyaltyStatus(dealer_id, customer_id);
    const isFree = loyalty.eligible;
    const washSequence = loyalty.nextWashNumber;
    const freeReason = isFree ? loyalty.reason : null;

    // Calculate Financials
    const basePrice = service.base_price;
    const addonsTotal = addons.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const subtotal = basePrice + addonsTotal;
    
    // If free wash: 100% discount on base package (or entire wash)
    const discount = isFree ? basePrice : 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * 0.08).toFixed(2));
    const total = Number((taxableAmount + tax).toFixed(2));

    const washId = `wsh_${Date.now()}`;
    const washCode = generateWashCode(dealer_id);
    const invoiceId = `inv_${Date.now()}`;
    const invoiceNumber = generateInvoiceNumber();

    // Insert Wash Record
    db.prepare(`
      INSERT INTO washes (
        id, wash_code, dealer_id, customer_id, vehicle_id, service_id, service_name,
        addons_json, bay_number, washer_staff, status, queue_time, before_photo, notes,
        wash_sequence_for_customer, is_free_wash, free_wash_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
    `).run(
      washId,
      washCode,
      dealer_id,
      customer_id,
      vehicle_id,
      service_id,
      service.name,
      JSON.stringify(addons),
      bay_number,
      washer_staff,
      before_photo,
      notes,
      washSequence,
      isFree ? 1 : 0,
      freeReason
    );

    // Insert Invoice
    db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, dealer_id, wash_id, customer_id, subtotal, discount, tax, total, status, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId,
      invoiceNumber,
      dealer_id,
      washId,
      customer_id,
      subtotal,
      discount,
      tax,
      total,
      isFree && total === 0 ? 'PAID' : 'PENDING',
      isFree ? '100% Loyalty Free' : 'Pending'
    );

    // Fetch created wash
    const createdWash = db.prepare(`
      SELECT w.*, c.name as customer_name, c.phone as customer_phone, v.license_plate, v.make, v.model,
             i.id as invoice_id, i.invoice_number, i.total as invoice_total
      FROM washes w
      JOIN customers c ON c.id = w.customer_id
      JOIN vehicles v ON v.id = w.vehicle_id
      JOIN invoices i ON i.wash_id = w.id
      WHERE w.id = ?
    `).get(washId);

    // Send WhatsApp Intake Notification if requested
    let waResult = null;
    if (send_whatsapp) {
      waResult = await sendWhatsAppNotification({
        dealerId: dealer.id,
        dealerName: dealer.name,
        dealerPhone: dealer.phone,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        washId,
        washCode,
        licensePlate: vehicle.license_plate,
        carModel: `${vehicle.make} ${vehicle.model}`,
        serviceName: service.name,
        bayNumber: bay_number,
        messageType: 'CHECKED_IN',
        isFreeWash: isFree,
        freeReason: freeReason
      });
    }

    // Broadcast real-time event to car wash dashboard
    broadcastToCarwash(dealer.id, 'wash:created', {
      wash: {
        ...createdWash,
        addons
      }
    });

    res.status(201).json({
      message: 'Vehicle checked in successfully!',
      wash: {
        ...createdWash,
        addons
      },
      loyalty,
      whatsapp: waResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Wash Status (Live Kanban transitions)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, after_photo } = req.body;
    const washId = req.params.id;

    const wash = db.prepare(`
      SELECT w.*, d.name as dealer_name, d.phone as dealer_phone,
             c.name as customer_name, c.phone as customer_phone,
             v.license_plate, v.make, v.model,
             i.id as invoice_id, i.invoice_number, i.total as invoice_total
      FROM washes w
      JOIN dealers d ON d.id = w.dealer_id
      JOIN customers c ON c.id = w.customer_id
      JOIN vehicles v ON v.id = w.vehicle_id
      LEFT JOIN invoices i ON i.wash_id = w.id
      WHERE w.id = ?
    `).get(washId);

    if (!wash) return res.status(404).json({ error: 'Wash not found' });

    let timeColumnUpdate = '';
    let waType = null;

    if (status === 'IN_WASH') {
      timeColumnUpdate = ', in_wash_time = CURRENT_TIMESTAMP';
      waType = 'IN_WASH';
    } else if (status === 'QUALITY_CHECK') {
      timeColumnUpdate = ', quality_check_time = CURRENT_TIMESTAMP';
    } else if (status === 'COMPLETED') {
      timeColumnUpdate = ', completed_time = CURRENT_TIMESTAMP';
      waType = 'COMPLETED';
    } else if (status === 'DELIVERED') {
      timeColumnUpdate = ', delivered_time = CURRENT_TIMESTAMP';
      
      // Update customer total washes tally and vehicle wash count
      db.prepare('UPDATE customers SET total_washes = total_washes + 1 WHERE id = ?').run(wash.customer_id);
      db.prepare('UPDATE vehicles SET wash_count = wash_count + 1 WHERE id = ?').run(wash.vehicle_id);

      // If pending and free wash, mark invoice as PAID
      if (wash.is_free_wash) {
        db.prepare("UPDATE invoices SET status = 'PAID', paid_at = CURRENT_TIMESTAMP WHERE wash_id = ?").run(wash.id);
      }
    }

    db.prepare(`
      UPDATE washes 
      SET status = ?,
          after_photo = COALESCE(?, after_photo)
          ${timeColumnUpdate}
      WHERE id = ?
    `).run(status, after_photo || null, washId);

    // Send WhatsApp notification automatically on IN_WASH or COMPLETED
    let waResult = null;
    if (waType) {
      waResult = await sendWhatsAppNotification({
        dealerId: wash.dealer_id,
        dealerName: wash.dealer_name,
        dealerPhone: wash.dealer_phone,
        customerId: wash.customer_id,
        customerName: wash.customer_name,
        customerPhone: wash.customer_phone,
        washId: wash.id,
        washCode: wash.wash_code,
        licensePlate: wash.license_plate,
        carModel: `${wash.make} ${wash.model}`,
        serviceName: wash.service_name,
        bayNumber: wash.bay_number,
        invoiceNumber: wash.invoice_number,
        totalAmount: wash.invoice_total,
        messageType: waType,
        afterPhoto: after_photo || wash.after_photo
      });
    }

    const updated = db.prepare('SELECT * FROM washes WHERE id = ?').get(washId);

    // Broadcast real-time status update to car wash bays and public tracker
    broadcastToCarwash(wash.dealer_id, 'wash:updated', { wash: updated });
    broadcastToTracker(washId, 'tracker:status_changed', { wash: updated, status });

    res.json({
      message: `Status updated to ${status}`,
      wash: updated,
      whatsapp: waResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update photos / inspection notes
router.patch('/:id/inspection', (req, res) => {
  try {
    const { before_photo, after_photo, notes } = req.body;
    db.prepare(`
      UPDATE washes 
      SET before_photo = COALESCE(?, before_photo),
          after_photo = COALESCE(?, after_photo),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(before_photo, after_photo, notes, req.params.id);

    const updated = db.prepare('SELECT * FROM washes WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
