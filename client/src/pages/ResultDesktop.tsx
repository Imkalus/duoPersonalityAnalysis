import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom, saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { calculateMBTI } from '../utils/scoring';
import { dimensionPoles, typeTraits } from '../data/dimensionInsights';
import type { MBTIResult } from '@mbti-duo/shared';

export function ResultDesktop() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();

  const [myResult] = useState<MBTIResult | null>(() => {
    const room = getRoom(roomId || '');
    return room?.myAnswers?.length ? calculateMBTI(room.myAnswers) : null;
  });
  const [partnerResult, setPartnerResult] = useState<MBTIResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analysisTriggered = useRef(false);

  const { on } = useSocket(roomId, user?.id);

  // Save my result once on mount
  useEffect(() => {
    if (myResult && roomId) {
      saveRoom(roomId, { myResult });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsub = on('partner-answers', ({ answers }) => {
      const partner = calculateMBTI(answers);
      setPartnerResult(partner);
      if (roomId) {
        saveRoom(roomId, { partnerResult: partner, partnerAnswers: answers });
      }
    });
    return unsub;
  }, [on, roomId]);

  // Listen for both-completed — both users see loading simultaneously
  useEffect(() => {
    const unsub = on('both-completed', () => {
      setAnalyzing(true);
    });
    return unsub;
  }, [on]);

  useEffect(() => {
    if (!myResult || !partnerResult || !roomId || analysisTriggered.current) return;
    analysisTriggered.current = true;

    const room = getRoom(roomId);
    if (room?.relationshipAnalysis) {
      navigate(`/room/${roomId}/analysis`);
      return;
    }

    setAnalyzing(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        typeA: myResult.type,
        typeB: partnerResult.type,
        relationship: room?.relationship || '朋友',
        nameA: user?.name || '我',
        nameB: room?.partnerName || '伙伴',
        resultA: myResult,
        resultB: partnerResult,
      }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeout);
        if (data.error) throw new Error(data.error);
        saveRoom(roomId, { relationshipAnalysis: data.analysis, status: 'chatting' });
        navigate(`/room/${roomId}/analysis`);
      })
      .catch((err) => {
        clearTimeout(timeout);
        const msg = err.name === 'AbortError' ? '分析请求超时，请稍后重试。' : '分析生成失败，请稍后重试。';
        saveRoom(roomId, { relationshipAnalysis: msg, status: 'chatting' });
        navigate(`/room/${roomId}/analysis`);
      });
  }, [myResult, partnerResult, roomId, navigate]);

  if (!myResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">未找到答题记录</p>
          <button onClick={() => navigate(`/room/${roomId}/test`)} className="px-4 py-2 bg-blue-500 text-white rounded-lg">去答题</button>
        </div>
      </div>
    );
  }

  const subtitle = myResult.description.split(' — ')[0] || '';
  const desc = myResult.description.split(' — ')[1] || myResult.description;
  const traits = typeTraits[myResult.type];
  const dims = Object.entries(myResult.dimensions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Hero: type code + subtitle */}
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 tracking-wide">你的 MBTI 类型</p>
          <div className="text-7xl font-extrabold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2 tracking-wider">
            {myResult.type}
          </div>
          {subtitle && (
            <p className="text-xl font-medium text-slate-600 dark:text-slate-300">{subtitle}</p>
          )}
        </div>

        {/* Dimension bars — centered gauge */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {dims.map(([dim, data]) => {
            const poles = dimensionPoles[dim];
            if (!poles) return null;
            const isLeft = data.direction === poles.left.label.split(' ')[1];
            const activePole = isLeft ? poles.left : poles.right;
            const barW = data.percentage - 50;
            return (
              <div key={dim} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-xs font-bold ${isLeft ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>{poles.left.label.split(' ')[0]}</span>
                  <span className={`text-xs font-bold ${!isLeft ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>{poles.right.label.split(' ')[0]}</span>
                </div>
                <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mb-2">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-300 dark:bg-slate-500 z-10" />
                  {barW > 0 && (
                    <div
                      className={`absolute top-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full ${
                        isLeft ? 'right-1/2' : 'left-1/2'
                      }`}
                      style={{ width: `${barW}%` }}
                    />
                  )}
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">{data.percentage}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activePole.shortDesc}</div>
              </div>
            );
          })}
        </div>

        {/* Bottom row: description + traits side by side */}
        <div className="grid grid-cols-[1fr_1fr] gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">性格概述</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
          </div>

          {traits && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">优势</h3>
                  <ul className="space-y-1.5">
                    {traits.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5 shrink-0">+</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wider">成长</h3>
                  <ul className="space-y-1.5">
                    {traits.growth.map((g, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5 shrink-0">~</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        {analyzing && (
          <div className="flex items-center justify-center gap-3 py-4 px-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
            <span className="text-amber-700 dark:text-amber-400 font-medium">正在计算宁配不配指数...</span>
          </div>
        )}
        {!analyzing && !partnerResult && (
          <div className="flex items-center justify-center gap-3 py-4 px-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl">
            <div className="animate-pulse w-2 h-2 bg-slate-400 rounded-full" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">等待对方完成答题...</p>
          </div>
        )}
      </div>
    </div>
  );
}
