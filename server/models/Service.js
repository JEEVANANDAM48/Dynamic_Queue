const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true }, // e.g. "A", "B", "C" for token prefix
    description: { type: String, default: '' },
    defaultDurationMinutes: { type: Number, default: 10, min: 1 },
    serviceCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCentre',
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
