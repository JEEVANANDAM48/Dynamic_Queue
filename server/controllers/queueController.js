const Token = require('../models/Token');
const ServiceCentre = require('../models/ServiceCentre');
const Counter = require('../models/Counter');
const Service = require('../models/Service');
const { calculateHistoricalAverage } = require('../services/queueEstimationService');

// @desc    Get active queue for a service centre
// @route   GET /api/queues/:serviceCentreId
// @access  Public
const getActiveQueue = async (req, res) => {
  try {
    const { serviceCentreId } = req.params;

    const waiting = await Token.find({
      serviceCentreId,
      status: 'WAITING'
    })
      .sort({ createdAt: 1 })
      .populate('serviceId', 'name code')
      .populate('customerId', 'name');

    const serving = await Token.find({
      serviceCentreId,
      status: { $in: ['CALLED', 'SERVING'] }
    })
      .populate('serviceId', 'name code')
      .populate('counterId', 'counterNumber')
      .populate('customerId', 'name');

    res.json({
      success: true,
      data: {
        waiting,
        serving,
        waitingCount: waiting.length,
        servingCount: serving.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active queue for a specific service at a service centre
// @route   GET /api/queues/:serviceCentreId/:serviceId
// @access  Public
const getQueueByService = async (req, res) => {
  try {
    const { serviceCentreId, serviceId } = req.params;

    const waiting = await Token.find({
      serviceCentreId,
      serviceId,
      status: 'WAITING'
    }).sort({ createdAt: 1 });

    const avgDuration = await calculateHistoricalAverage(serviceId);

    res.json({
      success: true,
      data: {
        serviceId,
        waitingTokens: waiting,
        count: waiting.length,
        averageServiceDurationMinutes: avgDuration
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public display screen data
// @route   GET /api/queues/display/:serviceCentreId
// @access  Public
const getDisplayBoard = async (req, res) => {
  try {
    const { serviceCentreId } = req.params;

    const serviceCentre = await ServiceCentre.findById(serviceCentreId);
    if (!serviceCentre) {
      return res.status(404).json({ success: false, message: 'Service Centre not found' });
    }

    const counters = await Counter.find({ serviceCentreId, status: 'ACTIVE' })
      .populate({
        path: 'currentTokenId',
        populate: { path: 'serviceId', select: 'name code' }
      });

    const servingTokens = await Token.find({
      serviceCentreId,
      status: { $in: ['CALLED', 'SERVING'] }
    })
      .sort({ updatedAt: -1 })
      .populate('counterId', 'counterNumber')
      .populate('serviceId', 'name code');

    const upcomingTokens = await Token.find({
      serviceCentreId,
      status: 'WAITING'
    })
      .sort({ createdAt: 1 })
      .limit(10)
      .populate('serviceId', 'name code');

    res.json({
      success: true,
      data: {
        serviceCentre,
        counters,
        servingTokens,
        upcomingTokens
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveQueue,
  getQueueByService,
  getDisplayBoard
};
