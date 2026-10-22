# 🫧 WashFlow - Real-Time Single Carwash Owner Platform & WhatsApp Automation

A production-grade, real-time Web App and REST API designed for **Car Wash Owners**. Each car wash owner has their own secure login, with their bays, customer profiles, invoices, and promotion settings completely isolated and updated in **real time** across devices via **Socket.io**.

---

## 🔐 Authentication & Single Carwash Owner Model

- **No Public Switchers**: Each car wash owner logs into their private portal using secure **JWT Bearer Token** authentication and **bcrypt** password encryption.
- **Data Isolation**: All wash bay queues, registered customers, invoices, and settings belong strictly to the authenticated car wash owner.
- **One-Click Demo Owner Accounts**:
  1. **SparkleWash Pro Hub** (Alex Parker): `sparkle@carwash.com` / `Password123!`
     - *Has the 4th Wash Free for 2+ Vehicles loyalty rule active!*
  2. **Apex Executive Auto Spa** (Elena Vance): `apex@carwash.com` / `Password123!`
     - *Standard car wash dealership operations.*
  3. **EcoClean Hydro Express** (Sam Green): `ecoclean@carwash.com` / `Password123!`
     - *Eco touchless car wash.*

---

## ⚡ Real-Time Socket.io Synchronization

- **Live Bay Updates**: When bay staff advance a car from *Queued* $\to$ *In-Wash* $\to$ *Quality Check* $\to$ *Ready for Pickup*, all screens (cashier, manager, tablet in bay) update instantly without refreshing.
- **Live Customer Tracker**: The customer viewing `/track/:washId` sees their progress bar jump in real time the moment foam washing or detailing starts.
- **Live Invoices & Intake**: Checking in a car or paying an invoice broadcasts updates across all connected devices.

---

## 🎁 Dealer-Specific Promo: 4th Wash FREE for 2+ Vehicles

- Enabled specifically for **SparkleWash Pro Hub** (and toggleable for any registered owner in Settings).
- **Rule Criteria**:
  $$\text{Free Wash} \iff (\text{Subscribed} = \text{true}) \land (\text{Vehicles} \ge 2) \land ((\text{Total Washes} + 1) \pmod 4 = 0)$$
- Triggers 100% discount on check-in, fires confetti celebration, notes the discount on the invoice, and informs the customer via WhatsApp!

---

## 🚀 Deployment & Hosting Guide

### Recommended Stack:
- **Frontend**: [Vercel](https://vercel.com) (Free tier, edge CDN, instant deploys)
- **Backend & WebSockets**: [Railway](https://railway.app) or [Render](https://render.com) (Native persistent WebSockets & Node.js)
- **Database**: [Turso](https://turso.tech) (Serverless SQLite over libSQL with 9GB free tier) or Render/Railway persistent volume

### Step 1: Deploy Backend to Railway or Render
1. Push repository to GitHub.
2. In Railway or Render, select **"Deploy from GitHub"**, set root directory to `server`.
3. Build command: `npm install`, Start command: `node server.js`.
4. Add environment variables:
   - `JWT_SECRET = your_production_jwt_secret`
   - `CLIENT_URL = https://your-frontend.vercel.app`

### Step 2: Deploy Frontend to Vercel
1. In Vercel, select **"Import Git Repository"**, set root directory to `client`.
2. Framework: **Vite**.
3. Environment variables:
   - `VITE_API_URL = https://your-backend.up.railway.app`
4. Click **Deploy**.

---

## 🏃 Running Locally

```powershell
# Backend (Port 5000)
cd server
npm install
node server.js

# Frontend (Port 3000)
cd client
npm install
npm run dev
```

Open **`http://localhost:3000`** to log in or register your car wash!
