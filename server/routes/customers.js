import express from 'express';
import db from '../db.js';

const router = express.Router();

// Helper to check loyalty eligibility
export function checkCustomerLoyaltyStatus(dealerId, customerId) {
  const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(dealerId);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(customerId);

  if (!dealer || !customer) return { eligible: false, reason: 'Customer or Dealer not found' };

  const hasFourthWashPromo = Number(dealer.has_fourth_wash_promo) === 1;
  const isSubscribed = Number(customer.is_subscribed) === 1;
  const vehicleCount = vehicles.length;
  const currentWashCount = Number(customer.total_washes || 0);
  const nextWashNumber = currentWashCount + 1;
  const isFourthWashMultiple = (nextWashNumber % 4 === 0);

  if (!hasFourthWashPromo) {
    return {
      eligible: false,
      dealerPromoActive: false,
      isSubscribed,
      vehicleCount,
      currentWashCount,
      nextWashNumber,
      reason: 'This dealer does not have the 4th-wash-free multi-vehicle promo enabled.'
    };
  }

  // Dealer has promo enabled
  let eligible = false;
  let reason = '';
  let missingRequirement = null;

  if (!isSubscribed) {
    reason = 'Customer is not subscribed to an active membership plan.';
    missingRequirement = 'subscription';
  } else if (vehicleCount < 2) {
    reason = `Customer has only ${vehicleCount} vehicle registered (Requires 2 or more vehicles).`;
    missingRequirement = 'vehicles';
  } else if (!isFourthWashMultiple) {
    const washesUntilNextFree = 4 - (nextWashNumber % 4);
    reason = `Next wash is wash #${nextWashNumber}. Customer needs ${washesUntilNextFree} more wash(es) for the free 4th wash perk.`;
    missingRequirement = 'wash_count';
  } else {
    eligible = true;
    reason = `🎉 Congratulations! Wash #${nextWashNumber} qualifies for 100% FREE wash (Subscribed + 2+ Vehicles)!`;
  }

  return {
    eligible,
    dealerPromoActive: true,
    isSubscribed,
    vehicleCount,
    currentWashCount,
    nextWashNumber,
    isFourthWashMultiple,
    reason,
    missingRequirement,
    perkSummary: 'Subscribed + 2+ Vehicles = Every 4th Wash Free'
  };
}

// Get all customers for a dealer
router.get('/', (req, res) => {
  try {
    const dealerId = req.query.dealer_id || 'dealer_sparkle';
    const customers = db.prepare(`
      SELECT c.*, 
             COUNT(v.id) as vehicle_count
      FROM customers c
      LEFT JOIN vehicles v ON v.customer_id = c.id
      WHERE c.dealer_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all(dealerId);

    // Attach loyalty calculation
    const enriched = customers.map(cust => {
      const vehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(cust.id);
      const loyalty = checkCustomerLoyaltyStatus(dealerId, cust.id);
      return {
        ...cust,
        vehicles,
        loyalty
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search customer by phone or license plate
router.get('/lookup', (req, res) => {
  try {
    const { dealer_id, query } = req.query;
    if (!query) return res.json([]);

    const cleanQuery = `%${query.trim()}%`;
    const rows = db.prepare(`
      SELECT DISTINCT c.*, COUNT(v2.id) as vehicle_count
      FROM customers c
      LEFT JOIN vehicles v ON v.customer_id = c.id
      LEFT JOIN vehicles v2 ON v2.customer_id = c.id
      WHERE (c.dealer_id = ? OR ? IS NULL)
        AND (c.name LIKE ? OR c.phone LIKE ? OR v.license_plate LIKE ?)
      GROUP BY c.id
      LIMIT 10
    `).all(dealer_id || null, dealer_id || null, cleanQuery, cleanQuery, cleanQuery);

    const enriched = rows.map(cust => {
      const vehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(cust.id);
      const loyalty = checkCustomerLoyaltyStatus(cust.dealer_id, cust.id);
      return {
        ...cust,
        vehicles,
        loyalty
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single customer
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const vehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(customer.id);
    const washes = db.prepare(`
      SELECT w.*, i.total as invoice_total, i.status as invoice_status 
      FROM washes w
      LEFT JOIN invoices i ON i.wash_id = w.id
      WHERE w.customer_id = ?
      ORDER BY w.queue_time DESC
    `).all(customer.id);

    const loyalty = checkCustomerLoyaltyStatus(customer.dealer_id, customer.id);

    res.json({
      ...customer,
      vehicles,
      washes,
      loyalty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new customer
router.post('/', (req, res) => {
  try {
    const { dealer_id, name, phone, email, is_subscribed, subscription_plan, notes, vehicles } = req.body;
    if (!dealer_id || !name || !phone) {
      return res.status(400).json({ error: 'Dealer, name, and phone are required.' });
    }

    const customerId = `cust_${Date.now()}`;
    db.prepare(`
      INSERT INTO customers (id, dealer_id, name, phone, email, is_subscribed, subscription_plan, subscription_started_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      dealer_id,
      name,
      phone,
      email || '',
      is_subscribed ? 1 : 0,
      subscription_plan || (is_subscribed ? 'Standard Membership' : 'None'),
      is_subscribed ? new Date().toISOString() : null,
      notes || ''
    );

    // If vehicles were passed, insert them
    if (Array.isArray(vehicles)) {
      const insertVehicle = db.prepare(`
        INSERT INTO vehicles (id, customer_id, dealer_id, license_plate, make, model, color, vehicle_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      vehicles.forEach(v => {
        if (v.license_plate && v.make) {
          insertVehicle.run(
            `veh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            customerId,
            dealer_id,
            v.license_plate.toUpperCase().trim(),
            v.make,
            v.model || 'Model',
            v.color || 'Unknown',
            v.vehicle_type || 'Sedan'
          );
        }
      });
    }

    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    const createdVehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(customerId);
    const loyalty = checkCustomerLoyaltyStatus(dealer_id, customerId);

    res.status(201).json({
      ...created,
      vehicles: createdVehicles,
      loyalty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add vehicle to customer (critical for activating 4th wash free promo when reaching >= 2 vehicles!)
router.post('/:id/vehicles', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { license_plate, make, model, color, vehicle_type } = req.body;
    if (!license_plate || !make) {
      return res.status(400).json({ error: 'License plate and make are required' });
    }

    const vehicleId = `veh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    db.prepare(`
      INSERT INTO vehicles (id, customer_id, dealer_id, license_plate, make, model, color, vehicle_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vehicleId,
      customer.id,
      customer.dealer_id,
      license_plate.toUpperCase().trim(),
      make,
      model || 'Standard',
      color || 'Black',
      vehicle_type || 'Sedan'
    );

    const allVehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(customer.id);
    const loyalty = checkCustomerLoyaltyStatus(customer.dealer_id, customer.id);

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicles: allVehicles,
      loyalty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle or update subscription plan
router.patch('/:id/subscription', (req, res) => {
  try {
    const { is_subscribed, subscription_plan } = req.body;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    db.prepare(`
      UPDATE customers 
      SET is_subscribed = ?,
          subscription_plan = ?,
          subscription_started_at = CASE WHEN ? = 1 AND subscription_started_at IS NULL THEN CURRENT_TIMESTAMP ELSE subscription_started_at END
      WHERE id = ?
    `).run(
      is_subscribed ? 1 : 0,
      subscription_plan || (is_subscribed ? 'Monthly Gold' : 'None'),
      is_subscribed ? 1 : 0,
      customer.id
    );

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
    const vehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(customer.id);
    const loyalty = checkCustomerLoyaltyStatus(customer.dealer_id, customer.id);

    res.json({
      ...updated,
      vehicles,
      loyalty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
