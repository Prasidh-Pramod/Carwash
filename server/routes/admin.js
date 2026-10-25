import express from 'express';
import db from '../db.js';
import { superAdminMiddleware, signToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require SuperAdmin role or prasidh25@gmail.com
router.use(superAdminMiddleware);

// 1. Get Platform-Wide KPI Metrics
router.get('/stats', (req, res) => {
  try {
    const totalFacilities = db.prepare('SELECT count(*) as count FROM dealers').get().count;
    const activeSubscribers = db.prepare("SELECT count(*) as count FROM dealers WHERE subscription_status = 'ACTIVE'").get().count;
    const trialFacilities = db.prepare("SELECT count(*) as count FROM dealers WHERE subscription_status = 'TRIAL'").get().count;
    const suspendedFacilities = db.prepare("SELECT count(*) as count FROM dealers WHERE subscription_status = 'SUSPENDED' OR subscription_status = 'EXPIRED'").get().count;
    const totalWashes = db.prepare('SELECT count(*) as count FROM washes').get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status = 'PAID'").get().total;

    res.json({
      totalFacilities,
      activeSubscribers,
      trialFacilities,
      suspendedFacilities,
      totalWashes,
      totalRevenue: Number(totalRevenue).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Registered Facilities & Owners
router.get('/facilities', (req, res) => {
  try {
    const dealers = db.prepare(`
      SELECT d.*, 
             u.id as owner_id, u.name as owner_name, u.email as owner_email, u.created_at as owner_registered_at,
             (SELECT count(*) FROM washes w WHERE w.dealer_id = d.id) as wash_count,
             (SELECT count(*) FROM customers c WHERE c.dealer_id = d.id) as customer_count,
             (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.dealer_id = d.id AND i.status = 'PAID') as revenue_collected
      FROM dealers d
      LEFT JOIN users u ON u.dealer_id = d.id AND (u.role = 'OWNER' OR u.role = 'SUPERADMIN')
      ORDER BY d.created_at DESC
    `).all();

    const formatted = dealers.map(d => {
      let daysRemaining = null;
      if (d.trial_ends_at) {
        const diffMs = new Date(d.trial_ends_at) - new Date();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        ...d,
        days_remaining_trial: daysRemaining,
        revenue_collected: Number(d.revenue_collected || 0).toFixed(2)
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Facility Subscription (Activate / Suspend / Extend Trial)
router.patch('/facilities/:id/subscription', (req, res) => {
  try {
    const { id } = req.params;
    const { status, plan, extend_days } = req.body;

    const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(id);
    if (!dealer) return res.status(404).json({ error: 'Facility not found' });

    let updatedTrialEnds = dealer.trial_ends_at;
    if (extend_days && Number(extend_days) > 0) {
      const currentExpiry = dealer.trial_ends_at ? new Date(dealer.trial_ends_at) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      updatedTrialEnds = new Date(baseDate.getTime() + Number(extend_days) * 24 * 60 * 60 * 1000).toISOString();
    }

    db.prepare(`
      UPDATE dealers 
      SET subscription_status = COALESCE(?, subscription_status),
          subscription_plan = COALESCE(?, subscription_plan),
          trial_ends_at = ?,
          is_active = CASE WHEN ? = 'SUSPENDED' THEN 0 ELSE 1 END
      WHERE id = ?
    `).run(
      status || null,
      plan || null,
      updatedTrialEnds,
      status || dealer.subscription_status,
      id
    );

    const updated = db.prepare('SELECT * FROM dealers WHERE id = ?').get(id);
    res.json({ message: 'Facility subscription updated successfully', dealer: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Impersonate Facility (Switch into Dealer Dashboard)
router.post('/impersonate/:dealerId', (req, res) => {
  try {
    const { dealerId } = req.params;
    const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(dealerId);
    if (!dealer) return res.status(404).json({ error: 'Dealer facility not found' });

    const ownerUser = db.prepare('SELECT * FROM users WHERE dealer_id = ? ORDER BY created_at ASC').get(dealerId);
    if (!ownerUser) return res.status(404).json({ error: 'No owner found for this facility' });

    // Sign a temporary switch token maintaining superadmin role flag
    const token = signToken({
      id: ownerUser.id,
      dealer_id: dealer.id,
      email: ownerUser.email,
      role: req.user.role // Preserve SUPERADMIN
    });

    res.json({
      message: `Now viewing ${dealer.name}`,
      token,
      carwash: dealer,
      user: {
        ...ownerUser,
        role: req.user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Spam / Test Facility
router.delete('/facilities/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM washes WHERE dealer_id = ?').run(id);
    db.prepare('DELETE FROM invoices WHERE dealer_id = ?').run(id);
    db.prepare('DELETE FROM vehicles WHERE dealer_id = ?').run(id);
    db.prepare('DELETE FROM customers WHERE dealer_id = ?').run(id);
    db.prepare('DELETE FROM services WHERE dealer_id = ?').run(id);
    db.prepare('DELETE FROM whatsapp_logs WHERE dealer_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE dealer_id = ?').run(id);
    db.prepare('DELETE FROM dealers WHERE id = ?').run(id);

    res.json({ message: 'Facility and associated test data removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
