import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'carwash_secret_jwt_key_2026_super_secure';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const user = db.prepare(`
      SELECT u.id, u.dealer_id, u.name, u.email, u.role,
             d.name as carwash_name, d.phone as carwash_phone, d.city as carwash_city,
             d.has_fourth_wash_promo, d.promo_title, d.currency
      FROM users u
      JOIN dealers d ON d.id = u.dealer_id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = user;
    req.dealerId = user.dealer_id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}
