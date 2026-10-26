import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const resolveSocketUrl = () => {
  let envUrl = import.meta.env.VITE_SOCKET_URL;
  const isBrowser = typeof window !== 'undefined';
  const isDeployedHost = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (!envUrl || (isDeployedHost && envUrl.includes('localhost'))) {
    envUrl = 'https://dynamic-queue-r6bt.onrender.com';
  }

  return envUrl.replace(/\/+$/, '');
};

const SOCKET_URL = resolveSocketUrl();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO Web Client Connected]', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO Web Client Disconnected]');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinServiceCentreRoom = (serviceCentreId) => {
    if (socket && serviceCentreId) {
      socket.emit('joinServiceCentre', serviceCentreId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinServiceCentreRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
