const Token = require('../models/Token');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const ServiceRecord = require('../models/ServiceRecord');
const Notification = require('../models/Notification');

/**
 * Calculates historical average service duration (in minutes) for a service.
 * Uses recent completed ServiceRecord entries.
 * Fallback to defaultDurationMinutes if no historical data exists.
 */
const calculateHistoricalAverage = async (serviceId) => {
  const service = await Service.findById(serviceId);
  const fallbackDuration = service ? service.defaultDurationMinutes || 10 : 10;

  // Filter out outlier records (only include realistic service durations between 0.5 and 60 minutes)
  const records = await ServiceRecord.find({
    serviceId,
    actualDurationMinutes: { $gte: 0.5, $lte: 60 }
  })
    .sort({ createdAt: -1 })
    .limit(50);

  if (records && records.length > 0) {
    const sum = records.reduce((acc, curr) => acc + curr.actualDurationMinutes, 0);
    const avg = sum / records.length;
    return Math.max(1, Math.min(60, Math.round(avg * 10) / 10));
  }

  return fallbackDuration;
};

/**
 * CORE RECALCULATION ENGINE
 * Recalculates estimated wait times, queue positions, and people ahead
 * for all WAITING tokens in a given Service Centre.
 * Broadcasts updates via Socket.IO.
 */
const recalculateQueueForServiceCentre = async (serviceCentreId, io = null) => {
  try {
    // 1. Fetch all services and their historical averages
    const services = await Service.find({ serviceCentreId, status: 'ACTIVE' });
    const serviceAvgMap = {};
    for (const service of services) {
      serviceAvgMap[service._id.toString()] = await calculateHistoricalAverage(service._id);
    }

    // 2. Fetch all ACTIVE counters for this service centre
    const rawCounters = await Counter.find({ serviceCentreId, status: 'ACTIVE' });

    // Check which counters currently have tokens in SERVING or CALLED
    const activeCountersList = [];
    for (const c of rawCounters) {
      if (c.currentTokenId) {
        const servingToken = await Token.findById(c.currentTokenId);
        if (servingToken && (servingToken.status === 'SERVING' || servingToken.status === 'CALLED')) {
          activeCountersList.push({ counter: c, servingToken });
        }
      }
    }

    // Build counter simulation states:
    // If some counters are currently active with tokens, prioritize those counters
    // so unmanned counters do not falsely zero out waiting times.
    const countersToSimulate = activeCountersList.length > 0
      ? activeCountersList
      : rawCounters.map(c => ({ counter: c, servingToken: null }));

    const counterStates = [];
    for (const { counter: c, servingToken } of countersToSimulate) {
      let initialRemaining = 1; // Minimum 1 minute for ready counters
      if (servingToken) {
        const sId = servingToken.serviceId ? servingToken.serviceId.toString() : null;
        const avgDur = (sId && serviceAvgMap[sId]) ? serviceAvgMap[sId] : 10;
        if (servingToken.status === 'SERVING' && servingToken.serviceStartTime) {
          const elapsed = (new Date() - new Date(servingToken.serviceStartTime)) / (1000 * 60);
          initialRemaining = Math.max(1, Math.round(avgDur - elapsed));
        } else if (servingToken.status === 'CALLED') {
          initialRemaining = Math.max(1, Math.round(avgDur));
        }
      }

      counterStates.push({
        counterId: c._id,
        supportedServices: c.supportedServices.map(s => s.toString()),
        availableTime: initialRemaining
      });
    }

    // Fallback if no active counters configured
    if (counterStates.length === 0) {
      counterStates.push({
        counterId: null,
        supportedServices: services.map(s => s._id.toString()),
        availableTime: 1
      });
    }

    // 3. Fetch all WAITING tokens ordered by creation time across the entire service centre
    const waitingTokens = await Token.find({
      serviceCentreId,
      status: 'WAITING'
    }).sort({ createdAt: 1 });

    // 4. Chronological multi-counter queue simulation
    for (let i = 0; i < waitingTokens.length; i++) {
      const token = waitingTokens[i];
      const tokenServiceIdStr = token.serviceId.toString();
      const avgDuration = serviceAvgMap[tokenServiceIdStr] || 10;

      // Find counters that can handle this token's service
      let eligibleCounters = counterStates.filter(c =>
        c.supportedServices.includes(tokenServiceIdStr)
      );

      if (eligibleCounters.length === 0) {
        eligibleCounters = counterStates;
      }

      // Find the earliest available counter
      let earliestCounter = eligibleCounters[0];
      for (let c = 1; c < eligibleCounters.length; c++) {
        if (eligibleCounters[c].availableTime < earliestCounter.availableTime) {
          earliestCounter = eligibleCounters[c];
        }
      }

      // Calculate people waiting ahead who share eligible counters
      const earlierTokens = waitingTokens.slice(0, i);
      const peopleAhead = earlierTokens.filter(et => {
        const etServiceIdStr = et.serviceId.toString();
        return eligibleCounters.some(c => c.supportedServices.includes(etServiceIdStr));
      }).length;

      // Estimated wait time is at least 1 minute for any waiting token
      const newEstimatedWait = Math.max(1, Math.round(earliestCounter.availableTime));

      const newQueuePosition = peopleAhead + 1;
      const waitTimeChanged = token.estimatedWaitMinutes !== newEstimatedWait;

      token.estimatedWaitMinutes = newEstimatedWait;
      token.peopleAhead = peopleAhead;
      token.queuePosition = newQueuePosition;
      await token.save();

      // Allocate this counter for this token: add service duration
      earliestCounter.availableTime += avgDuration;

      // Create in-app notification if wait time changed significantly
      if (waitTimeChanged && io) {
        try {
          await Notification.create({
            userId: token.customerId,
            tokenId: token._id,
            title: 'Queue Update',
            message: `Your token ${token.tokenNumber} estimated wait time is now ${newEstimatedWait} mins (${peopleAhead} people ahead).`,
            type: 'WAIT_UPDATE'
          });
        } catch (nErr) {}
      }

      // Emit individual token update socket event
      if (io) {
        io.to(`token:${token._id}`).emit('tokenUpdated', {
          tokenId: token._id,
          tokenNumber: token.tokenNumber,
          status: token.status,
          queuePosition: newQueuePosition,
          peopleAhead: peopleAhead,
          estimatedWaitMinutes: newEstimatedWait,
          counterId: token.counterId
        });
        io.to(`user:${token.customerId}`).emit('userTokenUpdated', {
          tokenId: token._id,
          tokenNumber: token.tokenNumber,
          estimatedWaitMinutes: newEstimatedWait,
          peopleAhead: peopleAhead,
          status: token.status
        });
      }
    }

    // Broadcast global queue updated event to Service Centre room
    if (io) {
      io.to(`serviceCentre:${serviceCentreId}`).emit('queueUpdated', {
        serviceCentreId,
        timestamp: new Date()
      });
    }

    return { success: true, message: 'Queue recalculated successfully' };
  } catch (error) {
    console.error('[Queue Estimation Service Error]', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  calculateHistoricalAverage,
  recalculateQueueForServiceCentre
};
