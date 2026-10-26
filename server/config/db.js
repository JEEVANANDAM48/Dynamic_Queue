const mongoose = require('mongoose');

/**
 * Safely masks database URI for logging (replaces password with ****)
 */
const maskMongoURI = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/:([^@:]+)@/, ':****@');
  } catch (e) {
    return '[Protected URI]';
  }
};

/**
 * Validates and checks URI for common formatting pitfalls without leaking secrets
 */
const validateMongoURI = (uri) => {
  if (!uri) {
    return {
      valid: false,
      message: 'No MONGODB_URI or MONGO_URI configured. Defaulting to local instance.'
    };
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return {
      valid: false,
      message: 'Invalid protocol: Connection string must start with mongodb:// or mongodb+srv://'
    };
  }

  // Check for unencoded '@' in password portion (before the host)
  const credentialsMatch = uri.match(/:\/\/(.*?)(@)/);
  if (credentialsMatch && credentialsMatch[1]) {
    const userPass = credentialsMatch[1];
    const firstColon = userPass.indexOf(':');
    if (firstColon !== -1) {
      const password = userPass.slice(firstColon + 1);
      if (password.includes('#') || password.includes('?') || password.includes('/') || password.includes('[')) {
        console.warn('[MongoDB Warning] Password may contain unencoded special characters. Consider URL-encoding them (e.g. encodeURIComponent).');
      }
    }
  }

  return { valid: true };
};

/**
 * Get current database connection status
 */
const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  const stateNames = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state,
    status: stateNames[state] || 'unknown',
    connected: state === 1,
    host: state === 1 ? mongoose.connection.host : null
  };
};

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  const configuredUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const finalUri = configuredUri || 'mongodb://127.0.0.1:27017/dynamic_queue';

  const validation = validateMongoURI(configuredUri);
  if (!validation.valid) {
    console.log(`[MongoDB Config] ${validation.message}`);
  }

  try {
    const maskedUri = maskMongoURI(finalUri);
    console.log(`[MongoDB] Initializing connection to ${maskedUri}...`);

    const conn = await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });

    console.log(`[MongoDB] Connected successfully (Host: ${conn.connection.host})`);
    return conn;
  } catch (error) {
    // Log safe error without exposing connection string
    console.error(`[MongoDB Error] Connection failed: ${error.name} - ${error.message}`);
    console.log('[MongoDB] Running with connection warning. Service will continue running.');
    return null;
  }
};

module.exports = {
  connectDB,
  getDatabaseStatus,
  maskMongoURI
};
