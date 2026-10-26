const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['CUSTOMER', 'STAFF', 'ADMIN'],
      default: 'CUSTOMER',
      required: true
    },
    serviceCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCentre',
      default: null
    },
    counterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
