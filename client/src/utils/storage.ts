import type { UserProfile, RoomData } from '@mbti-duo/shared';

const USER_KEY = 'mbti_user';
const ROOMS_KEY = 'mbti_rooms';
const RESULT_KEY = 'mbti_latest_result';

export function getUser(): UserProfile | null {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setUser(user: UserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getRooms(): Record<string, RoomData> {
  const data = localStorage.getItem(ROOMS_KEY);
  return data ? JSON.parse(data) : {};
}

export function getRoom(roomId: string): RoomData | null {
  const rooms = getRooms();
  return rooms[roomId] || null;
}

export function saveRoom(roomId: string, data: Partial<RoomData>): void {
  const rooms = getRooms();
  rooms[roomId] = { ...rooms[roomId], ...data } as RoomData;
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function deleteRoom(roomId: string): void {
  const rooms = getRooms();
  delete rooms[roomId];
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function getLatestResult() {
  const data = localStorage.getItem(RESULT_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveLatestResult(result: any): void {
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
}
