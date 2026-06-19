import type {
  Answer,
  RoomStatus,
  TestMode,
  DisplayMode,
  QuestionVersion,
  Relationship,
  MBTIResult,
} from '@mbti-duo/shared';

export interface ServerRoom {
  roomId: string;
  members: {
    A: { socketId: string; userId: string; name: string; completed?: boolean };
    B: { socketId: string; userId: string; name: string; completed?: boolean } | null;
  };
  status: RoomStatus;
  mode: TestMode;
  displayMode: DisplayMode;
  questionVersion: QuestionVersion;
  relationship: Relationship;
  createdAt: number;

  answers: {
    A: Answer[];
    B: Answer[];
  };

  results: {
    A: MBTIResult | null;
    B: MBTIResult | null;
  };

  analysis: string | null;
}

export interface RoomStore {
  create(room: ServerRoom): void;
  get(roomId: string): ServerRoom | undefined;
  update(roomId: string, data: Partial<ServerRoom>): void;
  delete(roomId: string): void;
  countByIp(ip: string): number;
  incrementIp(ip: string): void;
  cleanup(maxAge: number): number; // returns number of cleaned rooms
}

export class MemoryRoomStore implements RoomStore {
  private rooms = new Map<string, ServerRoom>();
  private ipCounts = new Map<string, { count: number; resetAt: number }>();

  create(room: ServerRoom): void {
    this.rooms.set(room.roomId, room);
  }

  get(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  update(roomId: string, data: Partial<ServerRoom>): void {
    const room = this.rooms.get(roomId);
    if (room) {
      Object.assign(room, data);
    }
  }

  delete(roomId: string): void {
    this.rooms.delete(roomId);
  }

  countByIp(ip: string): number {
    const entry = this.ipCounts.get(ip);
    if (!entry || Date.now() > entry.resetAt) return 0;
    return entry.count;
  }

  incrementIp(ip: string): void {
    const entry = this.ipCounts.get(ip);
    const now = Date.now();
    if (!entry || now > entry.resetAt) {
      this.ipCounts.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    } else {
      entry.count++;
    }
  }

  cleanup(maxAge: number): number {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;
    for (const [id, room] of this.rooms) {
      if (room.createdAt < cutoff) {
        this.rooms.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}
