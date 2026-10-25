import express from 'express';
import db from '../db.js';

const router = express.Router();

const DEFAULT_BAYS = [
  "Bay #1 - Foam Cannon & High Pressure",
  "Bay #2 - Touchless Hydro Express",
  "Bay #3 - Ceramic & Detailing Bay",
  "Bay #4 - Interior Vacuum & Shampoo"
];

const DEFAULT_TECHNICIANS = [
  "Carlos R.",
  "David K.",
  "Alex P.",
  "Elena V."
];

function formatDealer(dealer) {
  if (!dealer) return dealer;
  let bays = DEFAULT_BAYS;
  let technicians = DEFAULT_TECHNICIANS;
  try {
    if (dealer.bays_json) {
      const parsed = JSON.parse(dealer.bays_json);
      if (Array.isArray(parsed) && parsed.length > 0) bays = parsed;
    }
  } catch (e) {}
  try {
    if (dealer.technicians_json) {
      const parsed = JSON.parse(dealer.technicians_json);
      if (Array.isArray(parsed) && parsed.length > 0) technicians = parsed;
    }
  } catch (e) {}
  return {
    ...dealer,
    bays,
    technicians
  };
}

// Get all dealers
router.get('/', (req, res) => {
  try {
    const dealers = db.prepare('SELECT * FROM dealers ORDER BY name ASC').all();
    res.json(dealers.map(formatDealer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single dealer by ID
router.get('/:id', (req, res) => {
  try {
    const rawDealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(req.params.id);
    if (!rawDealer) return res.status(404).json({ error: 'Dealer not found' });
    const dealer = formatDealer(rawDealer);

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

// Update dealer settings (e.g. toggle 4th wash promo, update contact info, currency, bays, technicians)
router.put('/:id', (req, res) => {
  try {
    const { 
      name, phone, email, address, city, currency, whatsapp_phone, 
      has_fourth_wash_promo, promo_title, promo_description,
      bays, technicians 
    } = req.body;
    
    const baysJson = bays !== undefined ? (typeof bays === 'string' ? bays : JSON.stringify(bays)) : null;
    const techniciansJson = technicians !== undefined ? (typeof technicians === 'string' ? technicians : JSON.stringify(technicians)) : null;

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
          promo_description = COALESCE(?, promo_description),
          bays_json = COALESCE(?, bays_json),
          technicians_json = COALESCE(?, technicians_json)
      WHERE id = ?
    `).run(
      name, phone, email, address, city, currency, whatsapp_phone, 
      has_fourth_wash_promo !== undefined ? (has_fourth_wash_promo ? 1 : 0) : null,
      promo_title, promo_description,
      baysJson, techniciansJson,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM dealers WHERE id = ?').get(req.params.id);
    res.json(formatDealer(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dealer services
router.get('/:id/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE dealer_id = ? ORDER BY category DESC, base_price ASC').all(req.params.id);
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new service (package or addon)
router.post('/:id/services', (req, res) => {
  try {
    const { name, description, base_price, duration_mins, category } = req.body;
    if (!name || base_price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const id = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cat = category === 'Addon' ? 'Addon' : 'Package';
    const duration = parseInt(duration_mins, 10) || (cat === 'Addon' ? 15 : 30);
    const price = parseFloat(base_price) || 0;

    db.prepare(`
      INSERT INTO services (id, dealer_id, name, description, base_price, duration_mins, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, name.trim(), description || '', price, duration, cat);

    const created = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update service
router.put('/:id/services/:serviceId', (req, res) => {
  try {
    const { name, description, base_price, duration_mins, category } = req.body;
    const { id: dealerId, serviceId } = req.params;

    const existing = db.prepare('SELECT * FROM services WHERE id = ? AND dealer_id = ?').get(serviceId, dealerId);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    db.prepare(`
      UPDATE services
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          base_price = COALESCE(?, base_price),
          duration_mins = COALESCE(?, duration_mins),
          category = COALESCE(?, category)
      WHERE id = ? AND dealer_id = ?
    `).run(
      name !== undefined ? name.trim() : null,
      description !== undefined ? description : null,
      base_price !== undefined ? parseFloat(base_price) : null,
      duration_mins !== undefined ? parseInt(duration_mins, 10) : null,
      category !== undefined ? category : null,
      serviceId,
      dealerId
    );

    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete service
router.delete('/:id/services/:serviceId', (req, res) => {
  try {
    const { id: dealerId, serviceId } = req.params;
    db.prepare('DELETE FROM services WHERE id = ? AND dealer_id = ?').run(serviceId, dealerId);
    res.json({ message: 'Service deleted successfully', id: serviceId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
