import express from 'express';
import db from '../db.js';

const router = express.Router();

// Core notification generator
export async function sendWhatsAppNotification({
  dealerId,
  dealerName,
  dealerPhone,
  customerId,
  customerName,
  customerPhone,
  washId,
  washCode,
  licensePlate,
  carModel,
  serviceName,
  bayNumber,
  invoiceNumber,
  totalAmount,
  status = 'SENT',
  messageType,
  isFreeWash = false,
  freeReason = '',
  afterPhoto = null
}) {
  const hostUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const trackUrl = `${hostUrl}/track/${washId || washCode}`;
  const invoiceUrl = `${hostUrl}/invoice/${washId}`;

  let messageBody = '';

  switch (messageType) {
    case 'CHECKED_IN':
      messageBody = `🚗 *Car Wash Intake Confirmation*\n` +
        `------------------------------------\n` +
        `Hello *${customerName}*,\n` +
        `Your *${carModel}* [${licensePlate}] has been checked in for *${serviceName}* at *${dealerName}*.\n\n` +
        `🔢 Wash Ticket: *${washCode}*\n` +
        `📍 Assigned Bay: *Bay #${bayNumber || 1}*\n` +
        (isFreeWash ? `🎉 *SPECIAL PERK*: ${freeReason || '4th Wash FREE!'} (Total: $0.00)\n` : '') +
        `\n📲 *Track your wash progress in real-time:* \n${trackUrl}\n\n` +
        `We will notify you the moment your wash is completed!`;
      break;

    case 'IN_WASH':
      messageBody = `🫧 *Wash In Progress!*\n` +
        `------------------------------------\n` +
        `Hello *${customerName}*,\n` +
        `Your vehicle *${carModel}* [${licensePlate}] has entered the wash bay at *${dealerName}*!\n\n` +
        `🧼 Wash Stage: High Pressure Foam & Active Suds\n` +
        `📍 Location: Bay #${bayNumber || 1}\n` +
        `⏱ Estimated finish: 15-20 minutes\n\n` +
        `📲 Follow live stage updates: ${trackUrl}`;
      break;

    case 'COMPLETED':
      messageBody = `✨ *Your Car is Clean & Ready for Pickup!* ✨\n` +
        `------------------------------------\n` +
        `Hello *${customerName}*,\n` +
        `Good news! The wash for your *${carModel}* [${licensePlate}] is *COMPLETED* at *${dealerName}*!\n\n` +
        `🌟 Finish: Spot-free, hand dried & inspected\n` +
        `📍 Pickup Location: Bay #${bayNumber || 1} Exit Lane\n` +
        (afterPhoto ? `📸 View finished shine photo: ${afterPhoto}\n` : '') +
        `\n📄 *View / Download Your Invoice:* \n${invoiceUrl}\n\n` +
        `Thank you for trusting *${dealerName}*! Drive safely! 🚗💨`;
      break;

    case 'INVOICE':
      messageBody = `🧾 *Official Tax Invoice - ${invoiceNumber || 'INV'}*\n` +
        `------------------------------------\n` +
        `Dear *${customerName}*,\n` +
        `Thank you for your visit to *${dealerName}*.\n\n` +
        `• Vehicle: *${carModel}* [${licensePlate}]\n` +
        `• Service: *${serviceName}*\n` +
        `• Total Amount: *$${Number(totalAmount || 0).toFixed(2)}*\n` +
        (isFreeWash ? `• Discount: 100% Loyalty Free Wash Applied! 🎁\n` : '') +
        `\n📄 *Download or print your itemized receipt here:* \n${invoiceUrl}\n\n` +
        `Questions? Call us at ${dealerPhone || 'our service desk'}.`;
      break;

    default:
      messageBody = `Hello ${customerName}, update from ${dealerName}: Your wash status is ${messageType}. View details: ${trackUrl}`;
  }

  // Clean phone number for wa.me link (digits only)
  const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(messageBody);
  const directWaLink = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  // Log to database
  const logId = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  try {
    db.prepare(`
      INSERT INTO whatsapp_logs (id, dealer_id, customer_id, wash_id, recipient_name, recipient_phone, message_type, message_body, status, direct_wa_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      dealerId,
      customerId,
      washId,
      customerName,
      customerPhone,
      messageType,
      messageBody,
      status,
      directWaLink
    );
  } catch (err) {
    console.error('Failed to log WhatsApp message:', err);
  }

  return {
    id: logId,
    messageType,
    recipient: customerPhone,
    recipientName: customerName,
    messageBody,
    directWaLink,
    status,
    sentAt: new Date().toISOString()
  };
}

// Get recent WhatsApp message logs for a dealer
router.get('/logs', (req, res) => {
  try {
    const dealerId = req.query.dealer_id || 'dealer_sparkle';
    const logs = db.prepare(`
      SELECT * FROM whatsapp_logs 
      WHERE dealer_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(dealerId);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send custom or manual WhatsApp message
router.post('/send', async (req, res) => {
  try {
    const {
      dealer_id,
      customer_id,
      wash_id,
      customer_name,
      customer_phone,
      message_type,
      custom_text
    } = req.body;

    if (!dealer_id || !customer_phone) {
      return res.status(400).json({ error: 'dealer_id and customer_phone are required' });
    }

    const dealer = db.prepare('SELECT * FROM dealers WHERE id = ?').get(dealer_id) || { name: 'Car Wash Dealer', phone: '' };
    
    let wash = null;
    if (wash_id) {
      wash = db.prepare(`
        SELECT w.*, v.license_plate, v.make, v.model, i.invoice_number, i.total
        FROM washes w
        JOIN vehicles v ON v.id = w.vehicle_id
        LEFT JOIN invoices i ON i.wash_id = w.id
        WHERE w.id = ?
      `).get(wash_id);
    }

    const result = await sendWhatsAppNotification({
      dealerId: dealer_id,
      dealerName: dealer.name,
      dealerPhone: dealer.phone,
      customerId: customer_id || (wash ? wash.customer_id : null),
      customerName: customer_name || (wash ? 'Valued Customer' : 'Customer'),
      customerPhone: customer_phone,
      washId: wash_id || null,
      washCode: wash ? wash.wash_code : 'WSH',
      licensePlate: wash ? wash.license_plate : 'N/A',
      carModel: wash ? `${wash.make} ${wash.model}` : 'Vehicle',
      serviceName: wash ? wash.service_name : 'Wash Service',
      bayNumber: wash ? wash.bay_number : 1,
      invoiceNumber: wash ? wash.invoice_number : 'INV',
      totalAmount: wash ? wash.total : 0,
      messageType: message_type || 'CUSTOM',
      isFreeWash: wash ? Boolean(wash.is_free_wash) : false,
      freeReason: wash ? wash.free_wash_reason : ''
    });

    res.json({
      message: 'WhatsApp notification processed successfully',
      data: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
