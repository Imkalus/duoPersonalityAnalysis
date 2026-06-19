import { useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-indigo-600 flex flex-col">
      {/* 顶部 */}
      <div className="flex justify-between items-center p-4">
        <div />
        <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Logo */}
      <div className="text-center text-white pt-8 pb-12">
        <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-2xl flex items-center justify-center">
          <span className="text-3xl font-bold">M</span>
        </div>
        <h1 className="text-2xl font-bold">MBTI 双人测试</h1>
        <p className="text-white/70 text-sm mt-1">和朋友一起探索性格密码</p>
      </div>

      {/* 主内容卡片 */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-6 pb-8">
        {step === 0 ? (
          // 步骤 0: 选择模式
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white text-center mb-6">开始测试</h2>

            <button
              onClick={() => { setMode('create'); setStep(1); }}
              className="w-full p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl">+</div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">创建房间</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">邀请朋友一起测试</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setMode('join'); setStep(1); }}
              className="w-full p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-xl">→</div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white">加入房间</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">输入房间号加入</div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          // 步骤 1: 填写信息
          <div className="space-y-5">
            <button onClick={() => setStep(0)} className="text-sm text-blue-500 mb-2">
              ← 返回
            </button>

            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {mode === 'create' ? '创建房间' : '加入房间'}
            </h2>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">你的名字</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-0 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-0 focus:ring-2 focus:ring-blue-500 outline-none"
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
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      同步答题
                    </button>
                    <button
                      onClick={() => setTestMode('independent')}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        testMode === 'independent'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        明牌
                      </button>
                      <button
                        onClick={() => setDisplayMode('hidden')}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          displayMode === 'hidden'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium text-lg active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? '处理中...' : mode === 'create' ? '创建房间' : '加入房间'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
