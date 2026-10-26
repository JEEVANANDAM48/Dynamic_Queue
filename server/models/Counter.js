const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    counterNumber: { type: String, required: true, trim: true }, // e.g. "Counter 1", "Counter 2"
    serviceCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCentre',
      required: true
    },
    supportedServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    currentStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    currentTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Counter', counterSchema);
