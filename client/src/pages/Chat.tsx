import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { renderMarkdown } from '../utils/sanitize';
import type { Character, ChatMessage } from '@mbti-duo/shared';

const CHARACTERS: {
  key: Character;
  name: string;
  emoji: string;
  desc: string;
  gradient: string;
  bubbleBg: string;
  ring: string;
}[] = [
  {
    key: 'kind',
    name: '善良人格',
    emoji: '😇',
    desc: '温暖治愈，鼓励乐观看待问题',
    gradient: 'from-emerald-400 to-teal-500',
    bubbleBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/40',
    ring: 'ring-emerald-400',
  },
  {
    key: 'evil',
    name: '邪恶人格',
    emoji: '😈',
    desc: '直白尖锐，直击问题痛点',
    gradient: 'from-rose-500 to-purple-600',
    bubbleBg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-700/40',
    ring: 'ring-rose-500',
  },
];

export function Chat() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const room = getRoom(roomId || '');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [character, setCharacter] = useState<Character>('kind');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { emit, on } = useSocket(roomId, user?.id);
  // partnerId 存的是房间创建者(A)的 userId：我若是创建者则为 user_a，否则 user_b
  const myRole = user?.id === room?.partnerId ? 'user_a' : 'user_b';

  const activeChar = CHARACTERS.find((c) => c.key === character) || CHARACTERS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // 共享对话：服务端为唯一数据源
  useEffect(() => {
    const unsubHistory = on('chat-history', ({ messages: msgs, character: ch, typing: t }) => {
      setMessages(msgs);
      setCharacter(ch);
      setTyping(t);
    });
    const unsubNew = on('new-message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    const unsubTyping = on('chat-typing', ({ typing: t }) => setTyping(t));
    const unsubChar = on('character-changed', ({ character: ch }) => setCharacter(ch));
    return () => {
      unsubHistory();
      unsubNew();
      unsubTyping();
      unsubChar();
    };
  }, [on]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || typing) return;
    emit('chat-message', { roomId: roomId!, message: text, character });
    setInput('');
  };

  const handleSwitchCharacter = (key: Character) => {
    if (key === character) return;
    setCharacter(key);
    emit('change-character', { roomId: roomId!, character: key });
  };

  const myType = room?.myResult?.type || '?';
  const partnerType = room?.partnerResult?.type || '?';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(`/room/${roomId}/analysis`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="返回分析"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${activeChar.gradient} flex items-center justify-center text-xl shadow-lg`}>
            {activeChar.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-800 dark:text-white truncate">{activeChar.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{myType} × {partnerType} · {room?.relationship || '关系'} · 双人共享</div>
          </div>
        </div>
      </header>

      {/* Persona switcher */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200/70 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-3">
          {CHARACTERS.map((c) => (
            <button
              key={c.key}
              onClick={() => handleSwitchCharacter(c.key)}
              className={`relative p-3 rounded-2xl text-left transition-all overflow-hidden ${
                character === c.key
                  ? `bg-gradient-to-br ${c.gradient} text-white shadow-lg ring-2 ${c.ring} ring-offset-2 ring-offset-white dark:ring-offset-slate-900`
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:shadow-md border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className={`text-xs truncate ${character === c.key ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    {c.desc}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !typing && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className={`w-20 h-20 mb-5 rounded-3xl bg-gradient-to-br ${activeChar.gradient} flex items-center justify-center text-4xl shadow-xl`}>
                {activeChar.emoji}
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                和「{activeChar.name}」聊聊吧
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                这是你们共享的对话框，双方都能看到消息与回复
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  '我们最容易吵架的点是什么？',
                  '怎么和 TA 更好沟通？',
                  '我们的关系会长久吗？',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            const isMe = msg.role === myRole;
            const charForMsg = CHARACTERS.find((c) => c.key === msg.character) || activeChar;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {isAI ? (
                  <div className={`shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br ${charForMsg.gradient} flex items-center justify-center text-lg shadow-md`}>
                    {charForMsg.emoji}
                  </div>
                ) : (
                  <div className={`shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-semibold shadow-md ${
                    isMe
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'
                      : 'bg-gradient-to-br from-pink-400 to-rose-400 text-white'
                  }`}>
                    {isMe ? '我' : (msg.senderName?.[0] || '伴')}
                  </div>
                )}

                {/* Bubble */}
                <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 px-1">
                    {isAI ? charForMsg.name : isMe ? '我' : (msg.senderName || '伙伴')}
                  </span>
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm border ${
                      isAI
                        ? `${charForMsg.bubbleBg} text-slate-800 dark:text-slate-100 rounded-tl-md`
                        : isMe
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-transparent rounded-tr-md'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-tl-md'
                    }`}
                  >
                    {isAI ? (
                      <div
                        className="markdown-body markdown-chat text-sm"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex gap-2.5">
              <div className={`shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br ${activeChar.gradient} flex items-center justify-center text-lg shadow-md`}>
                {activeChar.emoji}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5 px-1">{activeChar.name} 正在回复</span>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-md border ${activeChar.bubbleBg}`}>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md safe-area-pb">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              maxLength={500}
              rows={1}
              disabled={typing}
              placeholder={typing ? '对方正在等待 AI 回复...' : `和「${activeChar.name}」说点什么...`}
              className="w-full px-4 py-3 pr-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border border-transparent focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none resize-none transition-colors disabled:opacity-60"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <span className="absolute right-3 bottom-2 text-[10px] text-slate-400 dark:text-slate-500">
              {input.length}/500
            </span>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || typing}
            className={`shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              !input.trim() || typing
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : `bg-gradient-to-br ${activeChar.gradient} text-white hover:scale-105 active:scale-95`
            }`}
            title="发送"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
