/**
 * Centralized CORS Configuration
 * Manages allowed origins for Express HTTP requests and Socket.IO connections.
 */

const getAllowedOrigins = () => {
  const envOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_WEB_URL,
    process.env.FRONTEND_URL,
    process.env.CLIENT_MOBILE_URL
  ].filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  return [...new Set([...envOrigins, ...defaultOrigins])];
};

const isOriginAllowed = (origin) => {
  // Allow requests without origin (like mobile apps, curl, server-to-server)
  if (!origin) return true;

  const allowedOrigins = getAllowedOrigins();

  // Exact match
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return true;
  }

  // Allow trusted domain patterns (Vercel deployments & Render hosting)
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.vercel.app') || url.hostname.endsWith('.onrender.com')) {
      return true;
    }
  } catch (e) {
    // Malformed origin
    return false;
  }

  // In non-production, permit local development network origins (e.g. Expo LAN IPs)
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
  corsOptions
};
