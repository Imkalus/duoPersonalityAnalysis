import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom, saveRoom } from '../utils/storage';
import { sanitizeHTML } from '../utils/sanitize';

export function Analysis() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const room = getRoom(roomId || '');
  const [analysis, setAnalysis] = useState(room?.relationshipAnalysis || '');

  // Fallback: if somehow we got here without analysis, try to fetch
  useEffect(() => {
    if (analysis || !room?.myResult || !room?.partnerResult) return;

    fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        typeA: room.myResult.type,
        typeB: room.partnerResult.type,
        relationship: room.relationship,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.analysis) {
          setAnalysis(data.analysis);
          saveRoom(roomId!, { relationshipAnalysis: data.analysis, status: 'chatting' });
        }
      })
      .catch(() => {});
  }, [analysis, room, roomId]);

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">正在计算宁配不配指数...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-white">双人关系分析</h1>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mb-6">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(analysis) }}
          />
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate(`/room/${roomId}/chat`)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg"
          >
            进入对话
          </button>
        </div>
      </div>
    </div>
  );
}
