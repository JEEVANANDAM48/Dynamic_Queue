const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: { type: String, required: true, trim: true }, // e.g., "A105"
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customerName: { type: String, default: 'Customer' },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    serviceCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCentre',
      required: true
    },
    counterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null
    },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'WAITING',
      required: true
    },
    queuePosition: { type: Number, default: 0 },
    peopleAhead: { type: Number, default: 0 },
    estimatedWaitMinutes: { type: Number, default: 0 },
    calledAt: { type: Date, default: null },
    serviceStartTime: { type: Date, default: null },
    serviceEndTime: { type: Date, default: null },
    actualServiceDuration: { type: Number, default: null }, // In minutes
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Token', tokenSchema);
