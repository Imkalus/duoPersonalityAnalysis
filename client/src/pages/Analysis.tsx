import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom, saveRoom } from '../utils/storage';
import { renderMarkdown } from '../utils/sanitize';

export function Analysis() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const room = getRoom(roomId || '');
  const [analysis, setAnalysis] = useState(room?.relationshipAnalysis || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (analysis || !room?.myResult || !room?.partnerResult) return;
    setLoading(true);
    fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        typeA: room.myResult.type,
        typeB: room.partnerResult.type,
        relationship: room.relationship,
        resultA: room.myResult,
        resultB: room.partnerResult,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.analysis) {
          setAnalysis(data.analysis);
          saveRoom(roomId!, { relationshipAnalysis: data.analysis, status: 'chatting' });
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(() => setError('网络错误，请稍后重试'))
      .finally(() => setLoading(false));
  }, [analysis, room, roomId]);

  const retry = () => {
    setAnalysis('');
    setError('');
    if (roomId) saveRoom(roomId, { relationshipAnalysis: '' });
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center px-6">
          {loading || !error ? (
            <>
              <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">正在计算宁配不配指数...</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">这可能需要 30-60 秒</p>
            </>
          ) : (
            <>
              <p className="text-rose-500 mb-4">{error}</p>
              <button onClick={retry} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition">
                重试
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const myType = room?.myResult?.type || '';
  const partnerType = room?.partnerResult?.type || '';
  const relationship = room?.relationship || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">关系分析报告</p>
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              {myType}
            </span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-lg shadow-lg shadow-rose-400/30">
              ♥
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {partnerType}
            </span>
          </div>
          {relationship && (
            <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-full shadow-sm">
              {relationship}
            </span>
          )}
        </div>

        {/* Content card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <article
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }}
          />
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate(`/room/${roomId}/chat`)}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
          >
            进入 AI 对话
          </button>
        </div>
      </div>
    </div>
  );
}
