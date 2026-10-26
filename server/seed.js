const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const ServiceCentre = require('./models/ServiceCentre');
const Service = require('./models/Service');
const Counter = require('./models/Counter');
const Token = require('./models/Token');
const ServiceRecord = require('./models/ServiceRecord');
const { recalculateQueueForServiceCentre } = require('./services/queueEstimationService');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dynamic_queue';
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await ServiceCentre.deleteMany({});
    await Service.deleteMany({});
    await Counter.deleteMany({});
    await Token.deleteMany({});
    await ServiceRecord.deleteMany({});

    console.log('Creating Service Centre...');
    const centre = await ServiceCentre.create({
      name: 'City Service Centre',
      code: 'CSC',
      address: '123 Main Civic Plaza, City Centre',
      status: 'ACTIVE'
    });

    console.log('Creating Services...');
    const generalService = await Service.create({
      name: 'General Consultation',
      code: 'A',
      description: 'General inquiry, basic guidance and consultation',
      defaultDurationMinutes: 10,
      serviceCentreId: centre._id,
      status: 'ACTIVE'
    });

    const docService = await Service.create({
      name: 'Document Verification',
      code: 'B',
      description: 'Official document verification and stamp approval',
      defaultDurationMinutes: 15,
      serviceCentreId: centre._id,
      status: 'ACTIVE'
    });

    const supportService = await Service.create({
      name: 'Customer Support',
      code: 'C',
      description: 'Complex customer issues and complaint resolution',
      defaultDurationMinutes: 12,
      serviceCentreId: centre._id,
      status: 'ACTIVE'
    });

    console.log('Creating Counters...');
    const counter1 = await Counter.create({
      counterNumber: 'Counter 1',
      serviceCentreId: centre._id,
      supportedServices: [generalService._id, docService._id, supportService._id],
      status: 'ACTIVE'
    });

    const counter2 = await Counter.create({
      counterNumber: 'Counter 2',
      serviceCentreId: centre._id,
      supportedServices: [generalService._id, docService._id, supportService._id],
      status: 'ACTIVE'
    });

    const counter3 = await Counter.create({
      counterNumber: 'Counter 3',
      serviceCentreId: centre._id,
      supportedServices: [generalService._id, docService._id, supportService._id],
      status: 'ACTIVE'
    });

    console.log('Creating Users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@queue.com',
      password: hashedPassword,
      role: 'ADMIN',
      serviceCentreId: centre._id
    });

    const staff1 = await User.create({
      name: 'Sarah Connor (Staff)',
      email: 'staff1@queue.com',
      password: hashedPassword,
      role: 'STAFF',
      serviceCentreId: centre._id,
      counterId: counter1._id
    });

    const staff2 = await User.create({
      name: 'James Wright (Staff)',
      email: 'staff2@queue.com',
      password: hashedPassword,
      role: 'STAFF',
      serviceCentreId: centre._id,
      counterId: counter2._id
    });

    counter1.currentStaffId = staff1._id;
    await counter1.save();
    counter2.currentStaffId = staff2._id;
    await counter2.save();

    const customerUser = await User.create({
      name: 'Alex Johnson',
      email: 'customer@queue.com',
      password: hashedPassword,
      role: 'CUSTOMER'
    });

    console.log('Creating Historical Service Records (8, 10, 12, 9, 11 min)...');
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

    console.log('Creating Currently Serving & Waiting Tokens...');

    // Serving Token A104 on Counter 1
    const servingToken = await Token.create({
      tokenNumber: 'A104',
      customerId: customerUser._id,
      customerName: 'Alice Smith',
      serviceId: generalService._id,
      serviceCentreId: centre._id,
      counterId: counter1._id,
      status: 'SERVING',
      serviceStartTime: new Date(Date.now() - 4 * 60 * 1000) // started 4 minutes ago
    });

    counter1.currentTokenId = servingToken._id;
    await counter1.save();

    // Waiting Tokens A105, A106, A107
    const token105 = await Token.create({
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

    console.log('Running initial dynamic queue calculation...');
    await recalculateQueueForServiceCentre(centre._id);

    console.log('\n======================================================');
    console.log(' SEED COMPLETE! DEMO DATA READY');
    console.log(' Service Centre: City Service Centre (CSC)');
    console.log(' Admin Login:    admin@queue.com / password123');
    console.log(' Staff 1 Login:  staff1@queue.com / password123 (Counter 1)');
    console.log(' Staff 2 Login:  staff2@queue.com / password123 (Counter 2)');
    console.log(' Customer Login: customer@queue.com / password123');
    console.log(` Primary Demo Token: A105 (ID: ${token105._id})`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
