import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@mbti-duo/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(roomId: string | undefined, userId: string | undefined) {
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const socket: TypedSocket = io({
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join-room', { roomId, userId });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, userId]);

  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    socketRef.current?.on(event, handler as any);
    return () => {
      socketRef.current?.off(event, handler as any);
    };
  }, []);

  return { emit, on, socket: socketRef };
}
