import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { setUser } from '../utils/storage';
import type { Relationship, TestMode, DisplayMode } from '@mbti-duo/shared';

export function HomeMobile() {
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
  const [step, setStep] = useState(0); // 0: 选择模式, 1: 填写信息

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 3000);
    return () => clearTimeout(t);
  }, [error]);

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

  if (step === 1) {
    // 步骤 1: 填写信息 (全屏表单)
    return (
      <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 pt-4 pb-8">
        <div className="max-w-md mx-auto space-y-5">
          <button onClick={() => setStep(0)} className="text-sm text-blue-500 dark:text-blue-400 mb-2">
            ← 返回
          </button>

          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {mode === 'create' ? '创建房间' : '加入房间'}
          </h2>

          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">你的名字</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="2-20 个字符"
            />
          </div>

          {/* 加入房间 - 房间号 */}
          {mode === 'join' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">房间号</label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="输入房间号"
              />
            </div>
          )}

          {/* 创建房间选项 */}
          {mode === 'create' && (
            <>
              {/* 关系类型 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">你们的关系</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: '情侣' as Relationship, icon: '💑', label: '情侣' },
                    { value: '朋友' as Relationship, icon: '👫', label: '朋友' },
                    { value: '家人' as Relationship, icon: '👨‍👩‍👧', label: '家人' },
                    { value: '同事' as Relationship, icon: '👔', label: '同事' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRelationship(r.value)}
                      className={`py-3 rounded-xl text-center transition-all ${
                        relationship === r.value
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block text-lg">{r.icon}</span>
                      <span className="text-xs">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 答题模式 */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">答题模式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTestMode('sync')}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      testMode === 'sync'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    同步答题
                  </button>
                  <button
                    onClick={() => setTestMode('independent')}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      testMode === 'independent'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    各自答题
                  </button>
                </div>
              </div>

              {/* 显示模式 */}
              {testMode === 'sync' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">显示模式</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDisplayMode('open')}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        displayMode === 'open'
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      明牌
                    </button>
                    <button
                      onClick={() => setDisplayMode('hidden')}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        displayMode === 'hidden'
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      暗牌
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
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-white rounded-2xl font-medium text-lg active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
          >
            {loading ? '处理中...' : mode === 'create' ? '创建房间' : '加入房间'}
          </button>
        </div>
      </div>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-red-500/90 dark:bg-red-600/90 backdrop-blur-sm text-white text-sm rounded-xl shadow-lg shadow-red-500/25">
          {error}
        </div>
      )}
      </>
    );
  }

  // 步骤 0: 首页
  return (
    <>
    <div className="min-h-screen flex flex-col">
      {/* 渐变头部区域 - 占据大部分屏幕 */}
      <div className="relative flex-1 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 px-6 pt-4 overflow-hidden">
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 dark:bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 -left-16 w-48 h-48 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl" />
        </div>

        {/* 顶部栏 */}
        <div className="relative z-10 flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 dark:bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">宁</span>
            </div>
            <span className="text-sm font-medium text-white/80">宁配吗</span>
          </div>
          <button onClick={toggle} className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors">
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>
        </div>

        {/* 核心视觉区域 */}
        <div className="relative z-10 flex flex-col items-center">
          {/* 双圆交叉图 */}
          <div className="relative w-40 h-28 mb-6">
            <div className="absolute left-2 top-0 w-24 h-24 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 flex items-center justify-center">
              <span className="text-2xl">🧑</span>
            </div>
            <div className="absolute right-2 top-0 w-24 h-24 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 flex items-center justify-center">
              <span className="text-2xl">🧑</span>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/25 dark:bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-xs">✨</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">宁配吗</h1>
          <p className="text-white/70 dark:text-white/50 text-sm mb-3">两种性格，一场化学反应</p>
          <p className="text-white/50 dark:text-white/30 text-xs text-center max-w-[260px] leading-relaxed">
            看清你们之间的默契与摩擦，发现意想不到的搭配
          </p>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="bg-white dark:bg-slate-950 rounded-t-3xl -mt-6 px-8 pt-8 pb-8 mb-6 safe-area-pb relative z-10">
        <h2 className="text-sm font-medium text-slate-400 dark:text-slate-500 text-center mb-6">开始测试</h2>
        <div className="space-y-4">
          <button
            onClick={() => { setMode('create'); setStep(1); }}
            className="w-full p-5 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-2xl text-white text-left active:scale-[0.98] transition-transform shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
          >
            <div className="font-semibold text-base">创建房间</div>
            <div className="text-sm text-white/70">邀请朋友一起测试</div>
          </button>

          <button
            onClick={() => { setMode('join'); setStep(1); }}
            className="w-full p-5 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 rounded-2xl text-white text-left active:scale-[0.98] transition-transform shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10"
          >
            <div className="font-semibold text-base">加入房间</div>
            <div className="text-sm text-white/70">输入房间号加入</div>
          </button>
        </div>
      </div>
    </div>
    {error && (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-red-500/90 dark:bg-red-600/90 backdrop-blur-sm text-white text-sm rounded-xl shadow-lg shadow-red-500/25">
        {error}
      </div>
    )}
    </>
  );
}
