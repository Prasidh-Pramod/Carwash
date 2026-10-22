import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all dealers
router.get('/', (req, res) => {
  try {
    const dealers = db.prepare('SELECT * FROM dealers ORDER BY name ASC').all();
    res.json(dealers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single dealer by ID
router.get('/:id', (req, res) => {
  try {
    const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(req.params.id);
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    // Also get active wash stats
    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'QUEUED' THEN 1 END) as queued,
        COUNT(CASE WHEN status = 'IN_WASH' THEN 1 END) as in_wash,
        COUNT(CASE WHEN status = 'QUALITY_CHECK' THEN 1 END) as quality_check,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(*) as total_active_today
      FROM washes 
      WHERE dealer_id = ?
    `).get(req.params.id);

    const revenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total_revenue
      FROM invoices
      WHERE dealer_id = ? AND status = 'PAID'
    `).get(req.params.id);

    res.json({
      ...dealer,
      stats: {
        ...stats,
        revenue: revenue.total_revenue
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update dealer settings (e.g. toggle 4th wash promo, update contact info)
router.put('/:id', (req, res) => {
  try {
    const { name, phone, email, address, city, currency, whatsapp_phone, has_fourth_wash_promo, promo_title, promo_description } = req.body;
    
    db.prepare(`
      UPDATE dealers 
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          currency = COALESCE(?, currency),
          whatsapp_phone = COALESCE(?, whatsapp_phone),
          has_fourth_wash_promo = COALESCE(?, has_fourth_wash_promo),
          promo_title = COALESCE(?, promo_title),
          promo_description = COALESCE(?, promo_description)
      WHERE id = ?
    `).run(
      name, phone, email, address, city, currency, whatsapp_phone, 
      has_fourth_wash_promo !== undefined ? (has_fourth_wash_promo ? 1 : 0) : null,
      promo_title, promo_description, req.params.id
    );

    const updated = db.prepare('SELECT * FROM dealers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dealer services
router.get('/:id/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE dealer_id = ? ORDER BY base_price ASC').all(req.params.id);
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
