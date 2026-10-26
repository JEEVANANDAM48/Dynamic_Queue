const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getDatabaseStatus } = require('./config/db');
const { corsOptions } = require('./config/corsConfig');
const { initSockets } = require('./sockets/socketHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSockets(server);

// Connect to Database
connectDB();

// CORS Middleware with origin validation
app.use(cors(corsOptions));
app.use(express.json());

// API Info / Index Routes (Prevents 404 on base URL visits)
const getApiDirectory = () => ({
  success: true,
  system: 'Dynamic Token and Queue Management System API',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'production',
  health: '/health',
  endpoints: {
    health: 'GET /health or GET /api/health',
    auth: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me'
    },
    tokens: {
      create: 'POST /api/tokens',
      myTokens: 'GET /api/tokens/customer/me',
      getById: 'GET /api/tokens/:id',
      cancel: 'DELETE /api/tokens/:id'
    },
    queues: {
      activeQueue: 'GET /api/queues/:serviceCentreId',
      serviceQueue: 'GET /api/queues/:serviceCentreId/:serviceId',
      displayBoard: 'GET /api/queues/display/:serviceCentreId'
    },
    staff: {
      queueState: 'GET /api/staff/queue-state',
      callNext: 'POST /api/staff/call-next',
      startService: 'POST /api/staff/service/start',
      completeService: 'POST /api/staff/service/complete',
      noShow: 'POST /api/staff/tokens/:id/no-show',
      skip: 'POST /api/staff/tokens/:id/skip',
      recall: 'POST /api/staff/tokens/:id/recall'
    },
    admin: {
      serviceCentres: 'GET /api/admin/service-centres',
      services: 'GET /api/admin/services',
      counters: 'GET /api/admin/counters',
      analytics: 'GET /api/admin/analytics',
      users: 'GET /api/admin/users',
      serviceRecords: 'GET /api/admin/service-records'
    }
  }
});

app.get('/', (req, res) => {
  res.json(getApiDirectory());
});

app.get('/api', (req, res) => {
  res.json(getApiDirectory());
});

// Health check handler (supports /health and /api/health)
const healthHandler = (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isHealthy = dbStatus.connected;

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    server: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus.status,
      connected: dbStatus.connected
    }
  };

  // Return 200 if DB is connected, 503 if disconnected
  res.status(isHealthy ? 200 : 503).json(payload);
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Route modules
const authRoutes = require('./routes/authRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const queueRoutes = require('./routes/queueRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Primary /api route mounts
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// Root fallback mounts (prevents 404 if client makes requests without /api prefix)
app.use('/auth', authRoutes);
app.use('/tokens', tokenRoutes);
app.use('/queues', queueRoutes);
app.use('/staff', staffRoutes);
app.use('/admin', adminRoutes);

// 404 Handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.name || 'Error', err.message);

  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` DYNAMIC QUEUE MANAGEMENT SYSTEM SERVER RUNNING        `);
    console.log(` Port: ${PORT}                                          `);
    console.log(` REST API Base: http://localhost:${PORT}/api            `);
    console.log(` Health Check:  http://localhost:${PORT}/health         `);
    console.log(`=======================================================`);
  });
}

module.exports = { app, server };
