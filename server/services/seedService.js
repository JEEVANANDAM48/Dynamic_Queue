const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ServiceCentre = require('../models/ServiceCentre');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Token = require('../models/Token');
const ServiceRecord = require('../models/ServiceRecord');
const { recalculateQueueForServiceCentre } = require('./queueEstimationService');

/**
 * Idempotent demo data seeder.
 * Ensures demo accounts and initial queue configuration exist without corrupting production data.
 */
const seedDemoData = async (forceReset = false) => {
  if (forceReset) {
    await Token.deleteMany({});
    await ServiceRecord.deleteMany({});
    await Counter.deleteMany({});
    await Service.deleteMany({});
    await ServiceCentre.deleteMany({});
    await User.deleteMany({});
  }

  // 1. Service Centre
  let centre = await ServiceCentre.findOne({ code: 'CSC' });
  if (!centre) {
    centre = await ServiceCentre.create({
      name: 'City Service Centre',
      code: 'CSC',
      address: '123 Main Civic Plaza, City Centre',
      status: 'ACTIVE'
    });
  }

  // 2. Services
  let generalService = await Service.findOne({ serviceCentreId: centre._id, code: 'A' });
  if (!generalService) {
    generalService = await Service.create({
      name: 'General Consultation',
      code: 'A',
      description: 'General inquiry, basic guidance and consultation',
      defaultDurationMinutes: 10,
      serviceCentreId: centre._id,
      status: 'ACTIVE'
    });
  }

  let docService = await Service.findOne({ serviceCentreId: centre._id, code: 'B' });
  if (!docService) {
    docService = await Service.create({
      name: 'Document Verification',
      code: 'B',
      description: 'Official document verification and stamp approval',
      defaultDurationMinutes: 15,
      serviceCentreId: centre._id,
      status: 'ACTIVE'
    });
  }

  let supportService = await Service.findOne({ serviceCentreId: centre._id, code: 'C' });
  if (!supportService) {
    supportService = await Service.create({
      name: 'Customer Support',
      code: 'C',
      description: 'Complex customer issues and complaint resolution',
      defaultDurationMinutes: 12,
      serviceCentreId: centre._id,
      status: 'ACTIVE'
    });
  }

  // 3. Counters
  const allServices = [generalService._id, docService._id, supportService._id];

  let counter1 = await Counter.findOne({ serviceCentreId: centre._id, counterNumber: 'Counter 1' });
  if (!counter1) {
    counter1 = await Counter.create({
      counterNumber: 'Counter 1',
      serviceCentreId: centre._id,
      supportedServices: allServices,
      status: 'ACTIVE'
    });
  }

  let counter2 = await Counter.findOne({ serviceCentreId: centre._id, counterNumber: 'Counter 2' });
  if (!counter2) {
    counter2 = await Counter.create({
      counterNumber: 'Counter 2',
      serviceCentreId: centre._id,
      supportedServices: allServices,
      status: 'ACTIVE'
    });
  }

  let counter3 = await Counter.findOne({ serviceCentreId: centre._id, counterNumber: 'Counter 3' });
  if (!counter3) {
    counter3 = await Counter.create({
      counterNumber: 'Counter 3',
      serviceCentreId: centre._id,
      supportedServices: allServices,
      status: 'ACTIVE'
    });
  }

  // 4. Users (Secure bcrypt hash with 10 rounds)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  let adminUser = await User.findOne({ email: 'admin@queue.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@queue.com',
      password: hashedPassword,
      role: 'ADMIN',
      serviceCentreId: centre._id
    });
  } else if (!adminUser.serviceCentreId) {
    adminUser.serviceCentreId = centre._id;
    await adminUser.save();
  }

  let staff1 = await User.findOne({ email: 'staff1@queue.com' });
  if (!staff1) {
    staff1 = await User.create({
      name: 'Sarah Connor (Staff)',
      email: 'staff1@queue.com',
      password: hashedPassword,
      role: 'STAFF',
      serviceCentreId: centre._id,
      counterId: counter1._id
    });
  } else if (!staff1.counterId) {
    staff1.counterId = counter1._id;
    staff1.serviceCentreId = centre._id;
    await staff1.save();
  }

  let staff2 = await User.findOne({ email: 'staff2@queue.com' });
  if (!staff2) {
    staff2 = await User.create({
      name: 'James Wright (Staff)',
      email: 'staff2@queue.com',
      password: hashedPassword,
      role: 'STAFF',
      serviceCentreId: centre._id,
      counterId: counter2._id
    });
  } else if (!staff2.counterId) {
    staff2.counterId = counter2._id;
    staff2.serviceCentreId = centre._id;
    await staff2.save();
  }

  let customerUser = await User.findOne({ email: 'customer@queue.com' });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Alex Johnson',
      email: 'customer@queue.com',
      password: hashedPassword,
      role: 'CUSTOMER'
    });
  }

  // Link counters to current staff
  counter1.currentStaffId = staff1._id;
  await counter1.save();
  counter2.currentStaffId = staff2._id;
  await counter2.save();

  // 5. Seed historical ServiceRecords for wait time engine if empty
  const recordCount = await ServiceRecord.countDocuments({ serviceCentreId: centre._id });
  if (recordCount === 0) {
    const durations = [8, 10, 12, 9, 11];
    for (let i = 0; i < durations.length; i++) {
      const pastStart = new Date(Date.now() - (durations.length - i) * 30 * 60 * 1000);
      const pastEnd = new Date(pastStart.getTime() + durations[i] * 60 * 1000);

      const pastToken = await Token.create({
        tokenNumber: `A10${i}`,
        customerId: customerUser._id,
        customerName: 'Historical Customer',
        serviceId: generalService._id,
        serviceCentreId: centre._id,
        counterId: counter1._id,
        status: 'COMPLETED',
        serviceStartTime: pastStart,
        serviceEndTime: pastEnd,
        actualServiceDuration: durations[i]
      });

      await ServiceRecord.create({
        tokenId: pastToken._id,
        serviceId: generalService._id,
        counterId: counter1._id,
        serviceCentreId: centre._id,
        startTime: pastStart,
        endTime: pastEnd,
        actualDurationMinutes: durations[i]
      });
    }
  }

  // 6. Seed active waiting tokens if queue is empty
  const activeWaiting = await Token.countDocuments({ serviceCentreId: centre._id, status: 'WAITING' });
  if (activeWaiting === 0) {
    await Token.create({
      tokenNumber: 'A105',
      customerId: customerUser._id,
      customerName: 'Alex Johnson',
      serviceId: generalService._id,
      serviceCentreId: centre._id,
      status: 'WAITING'
    });

    await Token.create({
      tokenNumber: 'A106',
      customerId: customerUser._id,
      customerName: 'Bob Vance',
      serviceId: generalService._id,
      serviceCentreId: centre._id,
      status: 'WAITING'
    });

    await Token.create({
      tokenNumber: 'A107',
      customerId: customerUser._id,
      customerName: 'Carol Danvers',
      serviceId: generalService._id,
      serviceCentreId: centre._id,
      status: 'WAITING'
    });
  }

  // Run queue estimation
  await recalculateQueueForServiceCentre(centre._id);

  return {
    success: true,
    message: 'Demo dataset successfully verified and initialized',
    summary: {
      centre: centre.name,
      centreId: centre._id,
      servicesCount: 3,
      countersCount: 3,
      accounts: [
        { email: 'admin@queue.com', role: 'ADMIN' },
        { email: 'staff1@queue.com', role: 'STAFF', counter: 'Counter 1' },
        { email: 'staff2@queue.com', role: 'STAFF', counter: 'Counter 2' },
        { email: 'customer@queue.com', role: 'CUSTOMER' }
      ]
    }
  };
};

module.exports = { seedDemoData };
