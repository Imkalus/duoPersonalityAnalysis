import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getUser, setUser } from '../utils/storage';
import type { Relationship, TestMode, QuestionVersion, DisplayMode } from '@mbti-duo/shared';

export function Home() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('朋友');
  const [testMode, setTestMode] = useState<TestMode>('independent');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('hidden');
  const [questionVersion] = useState<QuestionVersion>('lite');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('请输入用户名'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), relationship, mode: testMode, questionVersion, displayMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const user = { id: data.userId, name: name.trim(), createdAt: Date.now() };
      setUser(user);
      navigate(`/room/${data.roomId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError('请输入用户名'); return; }
    if (!joinRoomId.trim()) { setError('请输入房间号'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${joinRoomId.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const user = { id: data.userId, name: name.trim(), createdAt: Date.now() };
      setUser(user);
      navigate(`/room/${data.roomId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">MBTI 双人测试</h1>
          <button onClick={toggle} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* 模式切换 */}
        <div className="flex mb-6 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-md transition ${mode === 'create' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
          >
            创建房间
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 rounded-md transition ${mode === 'join' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
          >
            加入房间
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">你的名字</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="2-20 个字符"
            />
          </div>

          {mode === 'join' && (
            <div>
              <label className="block text-sm font-medium mb-1">房间号</label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="输入房间号"
              />
            </div>
          )}

          {mode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">关系类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['情侣', '朋友', '家人', '同事'] as Relationship[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRelationship(r)}
                      className={`py-2 rounded-lg text-sm transition ${
                        relationship === r
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">答题模式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTestMode('sync')}
                    className={`py-2 rounded-lg text-sm transition ${
                      testMode === 'sync' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    同步答题
                  </button>
                  <button
                    onClick={() => setTestMode('independent')}
                    className={`py-2 rounded-lg text-sm transition ${
                      testMode === 'independent' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    各自答题
                  </button>
                </div>
              </div>

              {testMode === 'sync' && (
                <div>
                  <label className="block text-sm font-medium mb-1">显示模式</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDisplayMode('open')}
                      className={`py-2 rounded-lg text-sm transition ${
                        displayMode === 'open' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      明牌
                    </button>
                    <button
                      onClick={() => setDisplayMode('hidden')}
                      className={`py-2 rounded-lg text-sm transition ${
                        displayMode === 'hidden' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      暗牌
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={mode === 'create' ? handleCreate : handleJoin}
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition"
          >
            {loading ? '处理中...' : mode === 'create' ? '创建房间' : '加入房间'}
          </button>
        </div>
      </div>
    </div>
  );
}
