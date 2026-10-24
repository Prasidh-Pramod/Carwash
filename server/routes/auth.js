import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Helper to seed default services for newly registered car wash
function seedDefaultServicesForCarwash(dealerId) {
  const insertService = db.prepare(`
    INSERT INTO services (id, dealer_id, name, description, base_price, duration_mins, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const defaults = [
    { id: `srv_${Date.now()}_1`, name: 'Express Exterior Wash', desc: 'Touchless high-pressure rinse, foam cannon & spot-free dry', price: 25.00, duration: 15, cat: 'Package' },
    { id: `srv_${Date.now()}_2`, name: 'Deluxe Interior & Exterior', desc: 'Express wash + interior vacuum, window polish & door jambs', price: 50.00, duration: 35, cat: 'Package' },
    { id: `srv_${Date.now()}_3`, name: 'Ceramic Shield & Detail', desc: 'Full deluxe wash + clay bar & ceramic sealant coating', price: 95.00, duration: 60, cat: 'Package' },
    { id: `srv_${Date.now()}_4`, name: 'Carnuba Hand Wax', desc: 'Deep gloss protective hand wax', price: 20.00, duration: 15, cat: 'Addon' },
    { id: `srv_${Date.now()}_5`, name: 'Tire Armor & Wheel Detail', desc: 'Brake dust removal & UV tire dressing', price: 15.00, duration: 10, cat: 'Addon' },
  ];

  for (const s of defaults) {
    insertService.run(s.id, dealerId, s.name, s.desc, s.price, s.duration, s.cat);
  }
}

// Helper to decode masked password payload from client
function decodePasswordPayload(payload) {
  if (!payload || typeof payload !== 'string') return payload;
  try {
    const raw = Buffer.from(payload, 'base64');
    const key = [0x57, 0x61, 0x73, 0x68, 0x46, 0x6c, 0x6f, 0x77];
    const unmasked = Buffer.from(raw.map((b, i) => b ^ key[i % key.length])).toString('utf-8');
    return unmasked || payload;
  } catch (e) {
    return payload;
  }
}

// 1. Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const unmasked = decodePasswordPayload(password);

    // Support both masked payload, direct raw password, and legacy hashes
    let isMatch = bcrypt.compareSync(unmasked, user.password_hash) || 
                  bcrypt.compareSync(password, user.password_hash);
    
    // Fallback for default seed accounts
    if (!isMatch) {
      const shaDefault = crypto.createHash('sha256').update('Password123!').digest('hex');
      if ((password === shaDefault || unmasked === shaDefault) && bcrypt.compareSync('Password123!', user.password_hash)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(user.dealer_id);

    const token = signToken({
      id: user.id,
      dealer_id: user.dealer_id,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dealer_id: user.dealer_id
      },
      carwash: dealer
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Register New Car Wash Owner & Business
router.post('/register', (req, res) => {
  try {
    const { 
      name, 
      carwash_name, 
      email, 
      password, 
      phone, 
      address, 
      city, 
      currency = '$',
      has_fourth_wash_promo = false 
    } = req.body;

    if (!name || !carwash_name || !email || !password) {
      return res.status(400).json({ error: 'Owner Name, Car Wash Name, Email, and Password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const unmasked = decodePasswordPayload(password);
    const passwordHash = bcrypt.hashSync(unmasked, 10);

    const dealerId = `dealer_${Date.now()}`;

    // Create Carwash Dealership record
    db.prepare(`
      INSERT INTO dealers (id, name, phone, email, address, city, currency, whatsapp_phone, has_fourth_wash_promo, promo_title, promo_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dealerId,
      carwash_name,
      phone || '',
      cleanEmail,
      address || '',
      city || '',
      currency,
      phone || '',
      has_fourth_wash_promo ? 1 : 0,
      '4th Wash Free Loyalty Pass',
      'Subscribed members with 2 or more registered vehicles receive every 4th wash 100% FREE!'
    );

    // Create Owner User
    db.prepare(`
      INSERT INTO users (id, dealer_id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      dealerId,
      name,
      cleanEmail,
      passwordHash,
      'OWNER'
    );

    // Seed default packages for this new car wash
    seedDefaultServicesForCarwash(dealerId);

    const createdDealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(dealerId);
    const token = signToken({
      id: userId,
      dealer_id: dealerId,
      email: cleanEmail,
      role: 'OWNER'
    });

    res.status(201).json({
      message: 'Car Wash Owner Account registered successfully',
      token,
      user: {
        id: userId,
        name,
        email: cleanEmail,
        role: 'OWNER',
        dealer_id: dealerId
      },
      carwash: createdDealer
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Current Authenticated Profile
router.get('/me', authMiddleware, (req, res) => {
  try {
    const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(req.user.dealer_id);
    res.json({
      user: req.user,
      carwash: dealer
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Demo Accounts helper (for quick 1-click testing)
router.get('/demo-accounts', (req, res) => {
  res.json([
    {
      label: 'SparkleWash Pro Hub (Alex Parker)',
      email: 'sparkle@carwash.com',
      password: 'Password123!',
      carwash: 'SparkleWash Pro Hub',
      specialFeature: '🔥 4th Wash Free for 2+ Vehicles Active'
    },
    {
      label: 'Apex Executive Auto Spa (Elena Vance)',
      email: 'apex@carwash.com',
      password: 'Password123!',
      carwash: 'Apex Executive Auto Spa',
      specialFeature: 'Standard Loyalty Tiers'
    },
    {
      label: 'EcoClean Hydro Express (Sam Green)',
      email: 'ecoclean@carwash.com',
      password: 'Password123!',
      carwash: 'EcoClean Hydro Express',
      specialFeature: 'Touchless Eco Wash'
    }
  ]);
});

export default router;
