const socketIo = require('socket.io');
const { isOriginAllowed } = require('../config/corsConfig');

let io;

const initSockets = (server) => {
  io = socketIo(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS blocked origin: ${origin}`));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    // Join Service Centre room for live display & queue updates
    socket.on('joinServiceCentre', (serviceCentreId) => {
      if (serviceCentreId) {
        const roomName = `serviceCentre:${serviceCentreId}`;
        socket.join(roomName);
      }
    });

    // Join individual token room for live customer updates
    socket.on('joinTokenRoom', (tokenId) => {
      if (tokenId) {
        const roomName = `token:${tokenId}`;
        socket.join(roomName);
      }
    });

    // Join user room for personal notifications
    socket.on('joinUserRoom', (userId) => {
      if (userId) {
        const roomName = `user:${userId}`;
        socket.join(roomName);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
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
