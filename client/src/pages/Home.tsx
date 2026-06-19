import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError('请输入用户名'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), relationship, mode: testMode, questionVersion: 'lite', displayMode }),
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

  const relationshipOptions: { value: Relationship; label: string; icon: string }[] = [
    { value: '情侣', label: '情侣', icon: '💑' },
    { value: '朋友', label: '朋友', icon: '👫' },
    { value: '家人', label: '家人', icon: '👨‍👩‍👧' },
    { value: '同事', label: '同事', icon: '👔' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* 主题切换按钮 */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-lg hover:scale-110 transition-transform"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center">
            <span className="text-4xl text-white font-bold">M</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">MBTI 双人测试</h1>
          <p className="text-slate-500 dark:text-slate-400">和朋友一起探索性格密码</p>
        </div>

        {/* 主卡片 */}
        <div className="w-full max-w-md">
          {/* 模式切换 */}
          <div className="flex mb-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                mode === 'create'
                  ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              创建房间
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                mode === 'join'
                  ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              加入房间
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 表单卡片 */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-5">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">你的名字</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="2-20 个字符"
              />
            </div>

            {/* 加入房间 - 房间号 */}
            {mode === 'join' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">房间号</label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="输入房间号"
                />
              </div>
            )}

            {/* 创建房间选项 */}
            {mode === 'create' && (
              <>
                {/* 关系类型 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">你们的关系</label>
                  <div className="grid grid-cols-4 gap-2">
                    {relationshipOptions.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRelationship(r.value)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          relationship === r.value
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <span className="block text-lg mb-1">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 答题模式 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">答题模式</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTestMode('sync')}
                      className={`p-4 rounded-xl text-left transition-all ${
                        testMode === 'sync'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-slate-800 dark:text-white">同步答题</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">一起做同一道题</div>
                    </button>
                    <button
                      onClick={() => setTestMode('independent')}
                      className={`p-4 rounded-xl text-left transition-all ${
                        testMode === 'independent'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-slate-800 dark:text-white">各自答题</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">各做各的，做完汇总</div>
                    </button>
                  </div>
                </div>

                {/* 显示模式（同步模式下） */}
                {testMode === 'sync' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">显示模式</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDisplayMode('open')}
                        className={`p-4 rounded-xl text-left transition-all ${
                          displayMode === 'open'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                            : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-slate-800 dark:text-white">明牌</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">可看到对方选择</div>
                      </button>
                      <button
                        onClick={() => setDisplayMode('hidden')}
                        className={`p-4 rounded-xl text-left transition-all ${
                          displayMode === 'hidden'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                            : 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-slate-800 dark:text-white">暗牌</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">看不到对方选择</div>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 提交按钮 */}
            <button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-blue-400 disabled:to-indigo-400 text-white rounded-xl font-medium text-lg shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              {loading ? '处理中...' : mode === 'create' ? '创建房间' : '加入房间'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
