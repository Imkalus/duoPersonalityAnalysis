import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, getRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { sanitizeText } from '../utils/sanitize';
import type { Character, ChatMessage } from '@mbti-duo/shared';

const CHARACTERS: { key: Character; name: string; desc: string }[] = [
  { key: 'mediator', name: '百姓调解员', desc: '温柔引导' },
  { key: 'genie', name: '阿拉灯神丁', desc: '毒舌幽默' },
  { key: 'evil', name: '邪恶人格', desc: '直击痛点' },
  { key: 'kind', name: '善良人格', desc: '温暖治愈' },
];

export function Chat() {
  const { roomId } = useParams<{ roomId: string }>();
  const user = getUser();
  const room = getRoom(roomId || '');

  const [messages, setMessages] = useState<ChatMessage[]>(room?.chatHistory || []);
  const [input, setInput] = useState('');
  const [character, setCharacter] = useState<Character>('mediator');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { emit, on } = useSocket(roomId, user?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const unsub = on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return unsub;
  }, [on]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}_user`,
      role: user?.id === room?.partnerId ? 'user_b' : 'user_a',
      content: text,
      character,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // 广播消息
    emit('chat-message', { roomId: roomId!, message: text, character });

    // 获取 AI 回复
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, message: text, character }),
      });
      const data = await res.json();
      if (data.reply) {
        const aiMsg: ChatMessage = {
          id: `${Date.now()}_ai`,
          role: 'assistant',
          content: data.reply,
          character,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 角色选择 */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 overflow-x-auto">
          {CHARACTERS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCharacter(c.key)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                character === c.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'assistant'
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <div className="text-sm">{sanitizeText(msg.content)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-2xl">
              <div className="animate-pulse">思考中...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            maxLength={500}
            placeholder="输入消息..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-blue-500 disabled:bg-blue-300 text-white rounded-lg font-medium"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
