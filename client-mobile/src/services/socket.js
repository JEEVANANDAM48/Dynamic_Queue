import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Normalizes and resolves the Socket.IO URL for Expo Customer App
 */
const resolveSocketUrl = () => {
  let envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;

  if (!envUrl) {
    if (__DEV__ && Platform.OS !== 'web') {
      const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoClient?.hostUri;
      if (hostUri) {
        const ip = hostUri.split(':')[0];
        envUrl = `http://${ip}:5000`;
      }
    }
  }

  // Deployed production default
  if (!envUrl || (!__DEV__ && envUrl.includes('localhost'))) {
    envUrl = 'https://dynamic-queue-r6bt.onrender.com';
  }

  return envUrl.replace(/\/+$/, '');
};

const SOCKET_URL = resolveSocketUrl();
console.log('[Mobile Socket Base URL]', SOCKET_URL);

let socket = null;
const activeRooms = new Set();

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Mobile Client Connected]', socket.id);
      // Re-join all active rooms after reconnection
      activeRooms.forEach((roomName) => {
        if (roomName.startsWith('token:')) {
          socket.emit('joinTokenRoom', roomName.replace('token:', ''));
        } else if (roomName.startsWith('serviceCentre:')) {
          socket.emit('joinServiceCentre', roomName.replace('serviceCentre:', ''));
        } else if (roomName.startsWith('user:')) {
          socket.emit('joinUserRoom', roomName.replace('user:', ''));
        }
      });
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO Connection Warning]', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO Mobile Client Disconnected]', reason);
    });
  }
  return socket;
};

export const getSocket = () => socket || initSocket();

export const subscribeToToken = (tokenId) => {
  if (!tokenId) return;
  activeRooms.add(`token:${tokenId}`);
  const s = getSocket();
  if (s && s.connected) {
    s.emit('joinTokenRoom', tokenId);
  }
};

export const unsubscribeFromToken = (tokenId) => {
  if (!tokenId) return;
  activeRooms.delete(`token:${tokenId}`);
};

export const subscribeToServiceCentre = (centreId) => {
  if (!centreId) return;
  activeRooms.add(`serviceCentre:${centreId}`);
  const s = getSocket();
  if (s && s.connected) {
    s.emit('joinServiceCentre', centreId);
  }
};

export const unsubscribeFromServiceCentre = (centreId) => {
  if (!centreId) return;
  activeRooms.delete(`serviceCentre:${centreId}`);
};

export const subscribeToUser = (userId) => {
  if (!userId) return;
  activeRooms.add(`user:${userId}`);
  const s = getSocket();
  if (s && s.connected) {
    s.emit('joinUserRoom', userId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    activeRooms.clear();
  }
};
