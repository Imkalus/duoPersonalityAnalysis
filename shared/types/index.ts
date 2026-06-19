// ===== Room Status =====
export type RoomStatus = 'waiting' | 'testing' | 'analyzing' | 'chatting' | 'closed';

// ===== User =====
export interface UserProfile {
  id: string;        // "user_a1b2c3d4"
  name: string;      // 2-20 字符
  createdAt: number; // 时间戳
}

// ===== Answer (二选一) =====
export interface Answer {
  questionId: number;            // 题目编号
  chosen: 'A' | 'B';            // 选择的选项
  value: string;                 // E/I/S/N/T/F/J/P
  timestamp: number;
}

// ===== MBTI Result =====
export interface DimensionResult {
  score: number;          // 原始得分
  direction: string;      // 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
  percentage: number;     // 0-100
}

export interface MBTIResult {
  type: string;            // "INTJ"
  dimensions: {
    EI: DimensionResult;
    SN: DimensionResult;
    TF: DimensionResult;
    JP: DimensionResult;
  };
  description: string;
}

// ===== Room =====
export type QuestionVersion = 'lite' | 'full';  // 28题 / 60题
export type DisplayMode = 'open' | 'hidden';    // 明牌 / 暗牌
export type Relationship = '情侣' | '朋友' | '家人' | '同事';

export interface RoomData {
  roomId: string;
  partnerName: string;
  partnerId: string;
  relationship: Relationship;
  displayMode: DisplayMode;
  questionVersion: QuestionVersion;
  status: RoomStatus;
  myAnswers: Answer[];
  partnerAnswers: Answer[];
  myResult: MBTIResult | null;
  partnerResult: MBTIResult | null;
  relationshipAnalysis: string;
  chatHistory: ChatMessage[];
  createdAt: number;
}

// ===== Chat =====
export type Character = 'kind' | 'evil';

export interface ChatMessage {
  id: string;
  role: 'user_a' | 'user_b' | 'assistant';
  content: string;
  character: Character;
  senderName?: string;     // 发送者昵称（用户消息）
  timestamp: number;
}

// ===== API Types =====
export interface CreateRoomRequest {
  name: string;
  relationship: Relationship;
  questionVersion: QuestionVersion;
  displayMode: DisplayMode;
}

export interface CreateRoomResponse {
  roomId: string;
  userId: string;
}

export interface JoinRoomRequest {
  name: string;
}

export interface JoinRoomResponse {
  roomId: string;
  userId: string;
  partnerName: string;
  relationship: Relationship;
  questionVersion: QuestionVersion;
  displayMode: DisplayMode;
}

export interface AnalysisRequest {
  roomId: string;
  typeA: string;
  typeB: string;
  relationship: Relationship;
  // 完整画像（含维度明细 + 昵称），用于生成定制化分析
  nameA?: string;
  nameB?: string;
  resultA?: MBTIResult;
  resultB?: MBTIResult;
}

export interface AnalysisResponse {
  analysis: string;
  cached: boolean;
}

export interface ChatRequest {
  roomId: string;
  message: string;
  character: Character;
}

export interface ChatResponse {
  reply: string;
  usage?: { promptTokens: number; completionTokens: number };
}

// ===== Question =====
export interface Question {
  id: number;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  text: string;
  reverse: boolean;  // 是否反向计分
}

// ===== Socket Events =====
export interface ServerToClientEvents {
  'partner-joined': (data: { name: string; userId: string }) => void;
  'answer-synced': (data: { questionId: number; value: string }) => void;
  'partner-progress': (data: { count: number }) => void;
  'both-completed': () => void;
  'partner-answers': (data: { answers: Answer[] }) => void;
  'new-message': (data: ChatMessage) => void;
  'chat-history': (data: { messages: ChatMessage[]; character: Character; typing: boolean }) => void;
  'chat-typing': (data: { typing: boolean }) => void;
  'character-changed': (data: { character: Character }) => void;
  'user-disconnected': () => void;
  'user-reconnected': () => void;
  'room-expired': () => void;
  'room-state': (data: { status: RoomStatus; answersA: number; answersB: number }) => void;
}

export interface ClientToServerEvents {
  'join-room': (data: { roomId: string; userId: string }) => void;
  'answer-submitted': (data: { roomId: string; answer: Answer }) => void;
  'answers-batch': (data: { roomId: string; answers: Answer[] }) => void;
  'test-completed': (data: { roomId: string; userId: string }) => void;
  'chat-message': (data: { roomId: string; message: string; character: Character }) => void;
  'change-character': (data: { roomId: string; character: Character }) => void;
}
