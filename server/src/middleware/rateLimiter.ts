import type { Request, Response, NextFunction } from 'express';
import { roomStore } from '../store';

const ROOM_CREATE_LIMIT = 10; // 每 IP 每日创建房间上限

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const count = roomStore.countByIp(ip);

  if (count >= ROOM_CREATE_LIMIT) {
    res.status(429).json({
      error: '今日创建房间数已达上限，请明天再试',
    });
    return;
  }

  roomStore.incrementIp(ip);
  next();
}
