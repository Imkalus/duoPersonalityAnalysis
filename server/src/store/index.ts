import { MemoryRoomStore } from './RoomStore';

// 当前使用内存实现，后期可替换为 Redis 实现
export const roomStore = new MemoryRoomStore();

// 定期清理过期房间（每 10 分钟）
setInterval(() => {
  const cleaned = roomStore.cleanup(60 * 60 * 1000); // 1 小时
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} expired rooms`);
  }
}, 10 * 60 * 1000);
