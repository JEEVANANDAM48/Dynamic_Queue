const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamic_queue');
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
    // Optional fallback or retry process.exit(1);
    console.log('[MongoDB] Running with connection warning. Ensure MongoDB service is running.');
  }
};

module.exports = connectDB;
