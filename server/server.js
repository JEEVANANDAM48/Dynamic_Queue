const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSockets } = require('./sockets/socketHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSockets(server);

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));
app.use('/api/queues', require('./routes/queueRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'DYNAMIC TOKEN AND QUEUE MANAGEMENT SYSTEM',
    timestamp: new Date()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` DYNAMIC QUEUE MANAGEMENT SYSTEM SERVER RUNNING        `);
  console.log(` Port: ${PORT}                                          `);
  console.log(` REST API: http://localhost:${PORT}/api                  `);
  console.log(` WebSocket: ws://localhost:${PORT}                      `);
  console.log(`=======================================================`);
});
