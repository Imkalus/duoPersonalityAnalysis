import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom, saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { calculateMBTI } from '../utils/scoring';
import type { Answer, MBTIResult } from '@mbti-duo/shared';

export function Result() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const [roomData, setRoomData] = useState(() => getRoom(roomId || ''));
  const [partnerResult, setPartnerResult] = useState<MBTIResult | null>(roomData?.partnerResult || null);
  const [analyzing, setAnalyzing] = useState(false);

  const { on } = useSocket(roomId, user?.id);

  const myResult = roomData?.myAnswers?.length ? calculateMBTI(roomData.myAnswers) : null;

  // Save my result on mount
  useEffect(() => {
    if (myResult && roomId) {
      saveRoom(roomId, { myResult });
      setRoomData((prev) => prev ? { ...prev, myResult } : prev);
    }
  }, [myResult, roomId]);

  // Listen for partner answers
  useEffect(() => {
    const unsub = on('partner-answers', ({ answers }) => {
      const partner = calculateMBTI(answers);
      setPartnerResult(partner);
      if (roomId) {
        saveRoom(roomId, { partnerResult: partner, partnerAnswers: answers });
        setRoomData((prev) => prev ? { ...prev, partnerResult: partner } : prev);
      }
    });
    return unsub;
  }, [on, roomId]);

  // Auto-trigger analysis when both results are ready
  const startAnalysis = useCallback(async () => {
    if (!myResult || !partnerResult || !roomId || analyzing) return;

    const room = getRoom(roomId);
    if (room?.relationshipAnalysis) {
      navigate(`/room/${roomId}/analysis`);
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          typeA: myResult.type,
          typeB: partnerResult.type,
          relationship: room?.relationship || '朋友',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      saveRoom(roomId, { relationshipAnalysis: data.analysis, status: 'chatting' });
      navigate(`/room/${roomId}/analysis`);
    } catch {
      // Fallback: navigate anyway with a basic message
      saveRoom(roomId, { relationshipAnalysis: '分析生成失败，请稍后重试。', status: 'chatting' });
      navigate(`/room/${roomId}/analysis`);
    }
  }, [myResult, partnerResult, roomId, analyzing, navigate]);

  // When partner result arrives, auto-start analysis
  useEffect(() => {
    if (myResult && partnerResult && !analyzing) {
      startAnalysis();
    }
  }, [myResult, partnerResult, analyzing, startAnalysis]);

  // Listen for both-completed as fallback
  useEffect(() => {
    const unsub = on('both-completed', () => {
      if (myResult && partnerResult && !analyzing) {
        startAnalysis();
      }
    });
    return unsub;
  }, [on, myResult, partnerResult, analyzing, startAnalysis]);

  if (!myResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">未找到答题记录</p>
          <button onClick={() => navigate(`/room/${roomId}/test`)} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            去答题
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">你的 MBTI 类型</h1>
        <div className="text-5xl font-bold text-blue-500 mb-6">{myResult.type}</div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mb-6">
          {Object.entries(myResult.dimensions).map(([dim, data]) => (
            <div key={dim} className="mb-4 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span>{dim[0]}</span>
                <span className="font-medium">{data.direction} {data.percentage}%</span>
                <span>{dim[1]}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">{myResult.description}</p>

        {/* 分析状态 */}
        {analyzing && (
          <div className="flex items-center justify-center gap-3 py-4 px-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
            <span className="text-amber-700 dark:text-amber-400 font-medium">正在计算宁配不配指数...</span>
          </div>
        )}

        {!analyzing && !partnerResult && (
          <div className="py-4 px-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <p className="text-slate-500 dark:text-slate-400">等待对方完成答题...</p>
          </div>
        )}
      </div>
    </div>
  );
}
