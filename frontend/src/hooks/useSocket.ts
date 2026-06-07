"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('ROOM_STATE_UPDATE', (data) => {
      setRoom(data.room);
      setTimeLeft(data.room.timeLeft);
    });

    socketRef.current.on('TIMER_TICK', (data) => {
      setTimeLeft(data.timeLeft);
    });

    socketRef.current.on('MATCH_ENDED', (data) => {
      console.log('Match Ended!', data);
      setRoom((prev: any) => ({ ...prev, status: 'ENDED' }));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const createRoom = (durationMinutes: number, streamerLogin: string, twitchId: string, accessToken: string) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('CREATE_ROOM', { durationMinutes, streamerLogin, twitchId, accessToken }, (response: any) => {
        if (response.success) {
          setRoom(response.room);
        }
        resolve(response);
      });
    });
  };

  const joinRoom = (roomId: string, streamerLogin: string, twitchId: string, accessToken: string) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('JOIN_ROOM', { roomId, streamerLogin, twitchId, accessToken }, (response: any) => {
        if (response.success) {
          setRoom(response.room);
        }
        resolve(response);
      });
    });
  };

  const startMatch = (roomId: string) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('START_MATCH', { roomId }, (response: any) => {
        resolve(response);
      });
    });
  };

  const cancelRoom = (roomId: string, twitchId: string) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('CANCEL_MATCH', { roomId, twitchId }, (response: any) => {
        resolve(response);
      });
    });
  };

  const spectateRoom = (roomId: string) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('SPECTATE_ROOM', { roomId }, (response: any) => {
        if (response.success) {
          setRoom(response.room);
          setTimeLeft(response.room.timeLeft);
        }
        resolve(response);
      });
    });
  };

  const [adminAlert, setAdminAlert] = useState<string | null>(null);

  useEffect(() => {
    // Listen for admin corrections
    if (socketRef.current) {
      socketRef.current.on('ADMIN_CORRECTION', (data: { message: string }) => {
        setAdminAlert(data.message);
        setTimeout(() => setAdminAlert(null), 3000);
      });
    }

    return () => {
      socketRef.current?.off('ADMIN_CORRECTION');
    };
  }, [isConnected]);

  const manualScoreUpdate = (roomId: string, streamerLogin: string, delta: number, twitchId: string) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('MANUAL_SCORE_UPDATE', { roomId, streamerLogin, delta, twitchId }, (response: any) => {
        resolve(response);
      });
    });
  };

  const addTime = (roomId: string, seconds: number, twitchId: string) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('ADD_TIME', { roomId, seconds, twitchId }, (response: any) => {
        resolve(response);
      });
    });
  };

  return {
    socket: socketRef.current,
    isConnected,
    room,
    timeLeft,
    adminAlert,
    createRoom,
    joinRoom,
    startMatch,
    spectateRoom,
    cancelRoom,
    manualScoreUpdate,
    addTime
  };
};
