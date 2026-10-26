# DYNAMIC TOKEN AND QUEUE MANAGEMENT SYSTEM

A real-time queue management system for high-traffic service centres (hospitals, banks, government offices). Built with Node.js, Express, MongoDB, Socket.IO, React + Vite (Staff & Admin Web App), and Expo React Native (Customer Mobile App).

---

## 🌟 Core Value Proposition

> **Do NOT confuse this with a simple static token generator.**

The token number (e.g. `A105`) remains **fixed and immutable**. The system continuously updates:
- **Estimated Waiting Time** (recalculated dynamically using actual historical service duration data, elapsed service time on active counters, and multi-counter availability algorithms).
- **Queue Position & People Ahead**
- **Service Status** (`WAITING`, `CALLED`, `SERVING`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
- **Assigned Counter** (e.g., `Counter 2`)

Whenever actual service progress changes (`START SERVICE`, `COMPLETE SERVICE`, token cancellation, or counter status change), the estimation engine recalculates waiting times for all affected waiting tokens in real-time over **Socket.IO**.

---

## 📂 Monorepo Architecture

```
dynamic-token-queue/
│
├── server/                     # Node.js + Express + MongoDB REST API & Socket.IO server
│   ├── config/                 # Database connection (db.js)
│   ├── controllers/            # auth, token, queue, staff, admin controllers
│   ├── models/                 # User, ServiceCentre, Service, Counter, Token, ServiceRecord
│   ├── routes/                 # Express API routes
│   ├── services/               # queueEstimationService.js (CORE Estimation Engine)
│   ├── sockets/                # socketHandler.js (Real-time room management)
│   ├── seed.js                 # Realistic seed demo data generator
│   └── server.js               # Entry point
│
├── client-web/                 # Staff Operations, Admin Portal & Public Signage (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/Login.jsx
│   │   │   ├── staff/StaffDashboard.jsx   # Staff Live Timer, Call Next, Start/Complete
│   │   │   ├── admin/AdminDashboard.jsx   # Analytics, Centres, Services, Counters, Staff
│   │   │   ├── display/DisplayBoard.jsx   # Public Waiting Room Signage Screen
│   │   │   └── kiosk/Kiosk.jsx            # Self-Service Printed Token Kiosk
│   │   ├── context/                       # AuthContext, SocketContext
│   │   └── services/                      # Axios API client
│
├── client-mobile/              # Customer App (Expo React Native)
│   ├── src/
│   │   ├── screens/                       # Login, Register, Home, SelectCentre, SelectService, LiveQueue, History, Profile
│   │   ├── services/                      # API & Socket.IO mobile listeners
│   │   └── context/                       # AuthContext
│   └── App.js
│
├── .env.example
└── README.md
```

---

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on `mongodb://127.0.0.1:27017` or Atlas URI)
- npm

### 1. Install Dependencies

**Server Backend:**
```bash
cd server
npm install
```

**Client Web (Staff/Admin/Display):**
```bash
cd ../client-web
npm install
```

**Client Mobile (Expo Customer App):**
```bash
cd ../client-mobile
npm install
```

---

## 🎲 Seed Demo Data

To populate realistic demo data (Service Centre, Counters, Staff accounts, historical service durations, active tokens):

```bash
cd server
npm run seed
```

---

## 🏃 Running the Application

### Step 1: Start Backend Server
```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

### Step 2: Start Staff & Admin Web Application
```bash
cd client-web
npm run dev
# Web App runs at http://localhost:5173
```

### Step 3: Start Customer Expo Mobile Application
```bash
cd client-mobile
npx expo start
# Mobile App runs via Expo Go or Web preview
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access / Function |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@queue.com` | `password123` | Full system analytics, CRUD for centres, services, counters, staff |
| **Staff (Counter 1)** | `staff1@queue.com` | `password123` | Call Next, Live Service Timer, Start & Complete Service |
| **Staff (Counter 2)** | `staff2@queue.com` | `password123` | Call Next, Live Service Timer, Start & Complete Service |
| **Customer** | `customer@queue.com` | `password123` | Mobile token generation & real-time queue tracking |

---

## 📺 Public Display & Kiosk URLs

- **Public Waiting Room Signage**: `http://localhost:5173/display/demo`
- **Self-Service Kiosk Station**: `http://localhost:5173/kiosk`

---

## 💡 Dynamic Estimation Formula

$$\text{Estimated Wait Time} = t_{\text{min, counter}} + (P \times D_{\text{avg}})$$

1. **$D_{\text{avg}}$**: Mean actual service duration computed from recent completed `ServiceRecord` entries.
2. **Remaining Service Time ($R_k$)**:
   $$R_k = \max(0, D_{\text{avg}} - (\text{now} - \text{serviceStartTime}_k))$$
3. **Multi-Counter Scheduling**: Earliest counter availability simulation continuously recalculates waiting time across all active counters.

---

## 🔌 API Summary

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - User profile

### Token Operations
- `POST /api/tokens` - Generate new token
- `GET /api/tokens/:id` - Get token details & status
- `GET /api/tokens/customer/me` - Get customer token history
- `DELETE /api/tokens/:id` - Cancel token

### Staff Desk Actions
- `GET /api/staff/queue-state` - Current counter queue state
- `POST /api/staff/call-next` - Call next waiting token
- `POST /api/staff/service/start` - Record service start timestamp
- `POST /api/staff/service/complete` - Record complete timestamp, save `actualServiceDuration`, & trigger recalculation
- `POST /api/staff/tokens/:id/no-show` - Mark no-show
- `POST /api/staff/tokens/:id/skip` - Skip token

### Admin & Analytics
- `GET /api/admin/analytics` - System analytics summary
- `POST /api/admin/service-centres` - Create service centre
- `POST /api/admin/services` - Create service
- `POST /api/admin/counters` - Create counter
- `POST /api/admin/staff` - Create staff account
