import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();
console.log('[Mobile Socket Base URL]', SOCKET_URL);

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Mobile Client Connected]', socket.id);
    });
  }
  return socket;
};

export const getSocket = () => socket || initSocket();

export const subscribeToToken = (tokenId) => {
  const s = getSocket();
  if (s && tokenId) {
    s.emit('joinTokenRoom', tokenId);
  }
};

export const subscribeToUser = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('joinUserRoom', userId);
  }
};
