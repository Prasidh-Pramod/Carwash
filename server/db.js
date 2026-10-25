import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'carwash.db');
const db = new DatabaseSync(dbPath);

// Initialize Tables
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dealers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      currency TEXT DEFAULT '$',
      whatsapp_phone TEXT,
      has_fourth_wash_promo INTEGER DEFAULT 0,
      promo_title TEXT,
      promo_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      dealer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'OWNER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dealer_id) REFERENCES dealers(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      dealer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      is_subscribed INTEGER DEFAULT 0,
      subscription_plan TEXT DEFAULT 'None',
      subscription_started_at DATETIME,
      total_washes INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dealer_id) REFERENCES dealers(id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      dealer_id TEXT NOT NULL,
      license_plate TEXT NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      color TEXT,
      vehicle_type TEXT DEFAULT 'Sedan',
      wash_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (dealer_id) REFERENCES dealers(id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      dealer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      base_price REAL NOT NULL,
      duration_mins INTEGER DEFAULT 30,
      category TEXT DEFAULT 'Package',
      FOREIGN KEY (dealer_id) REFERENCES dealers(id)
    );

    CREATE TABLE IF NOT EXISTS washes (
      id TEXT PRIMARY KEY,
      wash_code TEXT NOT NULL,
      dealer_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      addons_json TEXT DEFAULT '[]',
      bay_number INTEGER DEFAULT 1,
      washer_staff TEXT,
      status TEXT NOT NULL DEFAULT 'QUEUED',
      queue_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      in_wash_time DATETIME,
      quality_check_time DATETIME,
      completed_time DATETIME,
      delivered_time DATETIME,
      before_photo TEXT,
      after_photo TEXT,
      notes TEXT,
      wash_sequence_for_customer INTEGER DEFAULT 1,
      is_free_wash INTEGER DEFAULT 0,
      free_wash_reason TEXT,
      FOREIGN KEY (dealer_id) REFERENCES dealers(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      dealer_id TEXT NOT NULL,
      wash_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT DEFAULT 'PENDING',
      payment_method TEXT DEFAULT 'Pending',
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      whatsapp_sent INTEGER DEFAULT 0,
      whatsapp_sent_at DATETIME,
      FOREIGN KEY (dealer_id) REFERENCES dealers(id),
      FOREIGN KEY (wash_id) REFERENCES washes(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id TEXT PRIMARY KEY,
      dealer_id TEXT NOT NULL,
      customer_id TEXT,
      wash_id TEXT,
      recipient_name TEXT,
      recipient_phone TEXT NOT NULL,
      message_type TEXT NOT NULL,
      message_body TEXT NOT NULL,
      status TEXT DEFAULT 'SENT',
      direct_wa_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run schema migrations for facility subscription management
  try {
    db.exec(`ALTER TABLE dealers ADD COLUMN subscription_status TEXT DEFAULT 'ACTIVE'`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE dealers ADD COLUMN subscription_plan TEXT DEFAULT 'Pro Unlimited ($99/mo)'`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE dealers ADD COLUMN trial_ends_at DATETIME`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE dealers ADD COLUMN subscription_ends_at DATETIME`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE dealers ADD COLUMN is_active INTEGER DEFAULT 1`);
  } catch (e) {}

  // Elevate platform owner to SUPERADMIN
  try {
    db.prepare(`UPDATE users SET role = 'SUPERADMIN' WHERE LOWER(email) = 'prasidh25@gmail.com'`).run();
  } catch (e) {}

  seedData();
}

function seedData() {
  const existingUsers = db.prepare('SELECT count(*) as count FROM users').get();
  if (existingUsers.count > 0) return;

  console.log('Seeding initial carwash owners, customers, services, and washes...');

  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Dealer: SparkleWash Pro Hub (Has 4th wash free promo enabled)
  const existingSparkle = db.prepare('SELECT id FROM dealers WHERE id = ?').get('dealer_sparkle');
  if (!existingSparkle) {
    db.prepare(`
      INSERT INTO dealers (id, name, phone, email, address, city, currency, whatsapp_phone, has_fourth_wash_promo, promo_title, promo_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dealer_sparkle',
      'SparkleWash Pro Hub',
      '+1 (555) 789-0123',
      'owner@sparklewashpro.com',
      '742 Evergreen Blvd, Bay Area',
      'San Francisco, CA',
      '$',
      '+15557890123',
      1,
      '4th Wash Free Loyalty Pass',
      'Subscribed members with 2 or more registered vehicles receive every 4th wash 100% FREE!'
    );
  }

  // Insert SparkleWash Owner User
  db.prepare(`
    INSERT INTO users (id, dealer_id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'usr_sparkle_owner',
    'dealer_sparkle',
    'Alex Parker',
    'sparkle@carwash.com',
    defaultPasswordHash,
    'OWNER'
  );

  // 2. Dealer: Apex Executive Auto Spa (Standard Car Wash)
  const existingApex = db.prepare('SELECT id FROM dealers WHERE id = ?').get('dealer_apex');
  if (!existingApex) {
    db.prepare(`
      INSERT INTO dealers (id, name, phone, email, address, city, currency, whatsapp_phone, has_fourth_wash_promo, promo_title, promo_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dealer_apex',
      'Apex Executive Auto Spa',
      '+1 (555) 456-1122',
      'concierge@apexautospa.com',
      '1200 Ocean Drive',
      'Miami, FL',
      '$',
      '+15554561122',
      0,
      'Standard Member Rewards',
      'Standard dealership wash packages and priority bay access.'
    );
  }

  // Insert Apex Owner User
  db.prepare(`
    INSERT INTO users (id, dealer_id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'usr_apex_owner',
    'dealer_apex',
    'Elena Vance',
    'apex@carwash.com',
    defaultPasswordHash,
    'OWNER'
  );

  // 3. Dealer: EcoClean Hydro Express
  const existingEco = db.prepare('SELECT id FROM dealers WHERE id = ?').get('dealer_ecoclean');
  if (!existingEco) {
    db.prepare(`
      INSERT INTO dealers (id, name, phone, email, address, city, currency, whatsapp_phone, has_fourth_wash_promo, promo_title, promo_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dealer_ecoclean',
      'EcoClean Hydro Express',
      '+1 (555) 998-3344',
      'contact@ecocleanexpress.com',
      '45 Greenline Parkway',
      'Austin, TX',
      '$',
      '+15559983344',
      0,
      'Eco Points Program',
      'Eco-friendly water-recycling touchless vehicle washes.'
    );
  }

  // Insert EcoClean Owner User
  db.prepare(`
    INSERT INTO users (id, dealer_id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'usr_ecoclean_owner',
    'dealer_ecoclean',
    'Sam Green',
    'ecoclean@carwash.com',
    defaultPasswordHash,
    'OWNER'
  );

  // Check if services are seeded
  const serviceCount = db.prepare('SELECT count(*) as count FROM services').get();
  if (serviceCount.count === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (id, dealer_id, name, description, base_price, duration_mins, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const services = [
      { id: 'srv_express', dealer: 'dealer_sparkle', name: 'Express Exterior Wash', desc: 'Touchless high-pressure rinse, foam cannon, wheel clean & spot-free dry', price: 25.00, duration: 15, cat: 'Package' },
      { id: 'srv_deluxe', dealer: 'dealer_sparkle', name: 'Deluxe Interior & Exterior', desc: 'Express wash + interior vacuum, dashboard wipe, window polish & door jambs', price: 50.00, duration: 35, cat: 'Package' },
      { id: 'srv_ceramic', dealer: 'dealer_sparkle', name: 'Ceramic Shield & Detail', desc: 'Full deluxe wash + clay bar, ceramic sealant coating & leather conditioning', price: 95.00, duration: 60, cat: 'Package' },
      { id: 'srv_wax', dealer: 'dealer_sparkle', name: 'Carnuba Hand Wax Shield', desc: 'Deep gloss protective wax coating by hand', price: 20.00, duration: 15, cat: 'Addon' },
      { id: 'srv_tire', dealer: 'dealer_sparkle', name: 'Tire Armor & Wheel Detail', desc: 'Brake dust removal & high-gloss UV tire dressing', price: 15.00, duration: 10, cat: 'Addon' },
      { id: 'srv_odor', dealer: 'dealer_sparkle', name: 'Ozone Cabin Sanitization', desc: 'Antibacterial ozone air treatment for interior smells', price: 25.00, duration: 15, cat: 'Addon' },
    ];

    for (const s of services) {
      insertService.run(s.id, s.dealer, s.name, s.desc, s.price, s.duration, s.cat);
      insertService.run(`${s.id}_apex`, 'dealer_apex', s.name, s.desc, s.price * 1.2, s.duration, s.cat);
      insertService.run(`${s.id}_eco`, 'dealer_ecoclean', s.name, s.desc, s.price * 0.9, s.duration, s.cat);
    }
  }

  console.log('Database users & car wash owners seeded successfully!');
}

export default db;
