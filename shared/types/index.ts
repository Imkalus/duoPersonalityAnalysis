// ===== Room Status =====
export type RoomStatus = 'waiting' | 'testing' | 'analyzing' | 'chatting' | 'closed';

// ===== User =====
export interface UserProfile {
  id: string;        // "user_a1b2c3d4"
  name: string;      // 2-20 字符
  createdAt: number; // 时间戳
}

// ===== Answer (7-point Likert) =====
export interface Answer {
  questionId: number;            // 题目编号
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  value: number;                 // -3 到 +3（Likert 量表）
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
export type TestMode = 'sync' | 'independent';
export type QuestionVersion = 'lite' | 'full';  // 28题 / 60题
export type DisplayMode = 'open' | 'hidden';    // 明牌 / 暗牌
export type Relationship = '情侣' | '朋友' | '家人' | '同事';

export interface RoomData {
  roomId: string;
  partnerName: string;
  partnerId: string;
  relationship: Relationship;
  mode: TestMode;
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
export type Character = 'mediator' | 'genie' | 'evil' | 'kind';

export interface ChatMessage {
  id: string;
  role: 'user_a' | 'user_b' | 'assistant';
  content: string;
  character: Character;
  timestamp: number;
}

// ===== API Types =====
export interface CreateRoomRequest {
  name: string;
  relationship: Relationship;
  mode: TestMode;
  questionVersion: QuestionVersion;
  displayMode?: DisplayMode;  // sync 模式下必填
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
  mode: TestMode;
  questionVersion: QuestionVersion;
  displayMode: DisplayMode;
}

export interface AnalysisRequest {
  roomId: string;
  typeA: string;
  typeB: string;
  relationship: Relationship;
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
  'answer-synced': (data: { questionId: number; value: number }) => void;
  'both-completed': () => void;
  'partner-answers': (data: { answers: Answer[] }) => void;
  'new-message': (data: ChatMessage) => void;
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
}
