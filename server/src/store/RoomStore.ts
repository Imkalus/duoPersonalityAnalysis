import type {
  Answer,
  RoomStatus,
  DisplayMode,
  QuestionVersion,
  Relationship,
  MBTIResult,
  ChatMessage,
  Character,
} from '@mbti-duo/shared';

export interface ServerRoom {
  roomId: string;
  members: {
    A: { socketId: string; userId: string; name: string; completed?: boolean };
    B: { socketId: string; userId: string; name: string; completed?: boolean } | null;
  };
  status: RoomStatus;
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

  // 双方 MBTI 类型字符串（由分析接口填充，供后续对话提供上下文）
  types: {
    A: string | null;
    B: string | null;
  };

  analysis: string | null;

  // 进行中的分析请求（in-flight 去重：A/B 同时触发时只发一次 LLM 调用）
  analysisInFlight?: Promise<string> | null;

  // 共享对话状态
  chat: {
    messages: ChatMessage[];
    character: Character;
    typing: boolean;
  };
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
