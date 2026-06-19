import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { setUser } from '../utils/storage';
import type { Relationship, TestMode, DisplayMode } from '@mbti-duo/shared';

export function HomeDesktop() {
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
      setUser({ id: data.userId, name: name.trim(), createdAt: Date.now() });
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
      setUser({ id: data.userId, name: name.trim(), createdAt: Date.now() });
      navigate(`/room/${data.roomId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex">
      {/* 左侧装饰区域 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <span className="text-xl font-semibold text-white">MBTI 双人测试</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            和朋友一起<br />探索性格密码
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            通过 MBTI 性格测试，了解自己和朋友的性格特点，发现彼此的互补之处。
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">93</div>
              <div className="text-sm text-white/60">测试题目</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">16</div>
              <div className="text-sm text-white/60">性格类型</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4</div>
              <div className="text-sm text-white/60">AI 角色</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧表单区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 主题切换 */}
          <div className="flex justify-end mb-8">
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-lg hover:scale-110 transition-transform"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>

          {/* Logo (小屏幕) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center">
              <span className="text-3xl text-white font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">MBTI 双人测试</h1>
          </div>

          {/* 模式切换 */}
          <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5">
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

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 表单 */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">你的名字</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="2-20 个字符"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">房间号</label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="输入房间号"
                />
              </div>
            )}

            {mode === 'create' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">你们的关系</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: '情侣' as Relationship, icon: '💑', label: '情侣' },
                      { value: '朋友' as Relationship, icon: '👫', label: '朋友' },
                      { value: '家人' as Relationship, icon: '👨‍👩‍👧', label: '家人' },
                      { value: '同事' as Relationship, icon: '👔', label: '同事' },
                    ].map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRelationship(r.value)}
                        className={`py-4 rounded-xl text-center transition-all ${
                          relationship === r.value
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="block text-xl mb-1">{r.icon}</span>
                        <span className="text-sm">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">答题模式</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTestMode('sync')}
                      className={`p-4 rounded-xl text-left transition-all ${
                        testMode === 'sync'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
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
                          : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="font-medium text-slate-800 dark:text-white">各自答题</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">各做各的，做完汇总</div>
                    </button>
                  </div>
                </div>

                {testMode === 'sync' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">显示模式</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDisplayMode('open')}
                        className={`p-4 rounded-xl text-left transition-all ${
                          displayMode === 'open'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                            : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
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
                            : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
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
