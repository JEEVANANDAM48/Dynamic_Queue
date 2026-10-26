import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
