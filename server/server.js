import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db.js';

import authRouter from './routes/auth.js';
import dealersRouter from './routes/dealers.js';
import customersRouter from './routes/customers.js';
import washesRouter from './routes/washes.js';
import invoicesRouter from './routes/invoices.js';
import whatsappRouter from './routes/whatsapp.js';
import adminRouter from './routes/admin.js';

dotenv.config();

// Initialize SQLite database
initDB();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup Socket.io for bidirectional real-time push
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT']
  }
});

io.on('connection', (socket) => {
  // Car wash owner joins their dedicated real-time room
  socket.on('join:carwash', (dealerId) => {
    if (dealerId) {
      socket.join(`carwash_${dealerId}`);
    }
  });

  // Customer tracking page joins the wash ticket room
  socket.on('join:tracker', (washId) => {
    if (washId) {
      socket.join(`tracker_${washId}`);
    }
  });
});

// Helper for broadcasting real-time events
export function broadcastToCarwash(dealerId, event, payload) {
  if (io && dealerId) {
    io.to(`carwash_${dealerId}`).emit(event, payload);
  }
}

export function broadcastToTracker(washId, event, payload) {
  if (io && washId) {
    io.to(`tracker_${washId}`).emit(event, payload);
  }
}

app.use(cors());
app.use(express.json());

// Handle malformed JSON body errors without crashing the server
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload received' });
  }
  next(err);
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/dealers', dealersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/washes', washesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WashFlow Single-Owner Carwash & WhatsApp Engine',
    realtime: 'Socket.io active',
    version: '2.0.0'
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WashFlow Backend Server is running on http://localhost:${PORT} with Socket.io Real-Time active`);
});
