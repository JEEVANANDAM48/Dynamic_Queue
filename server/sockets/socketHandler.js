const socketIo = require('socket.io');

let io;

const initSockets = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join Service Centre room for live display & queue updates
    socket.on('joinServiceCentre', (serviceCentreId) => {
      if (serviceCentreId) {
        const roomName = `serviceCentre:${serviceCentreId}`;
        socket.join(roomName);
        console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Join individual token room for live customer updates
    socket.on('joinTokenRoom', (tokenId) => {
      if (tokenId) {
        const roomName = `token:${tokenId}`;
        socket.join(roomName);
        console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Join user room
    socket.on('joinUserRoom', (userId) => {
      if (userId) {
        const roomName = `user:${userId}`;
        socket.join(roomName);
        console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSockets, getIO };
