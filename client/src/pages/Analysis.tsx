import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom, saveRoom } from '../utils/storage';
import { sanitizeHTML } from '../utils/sanitize';

export function Analysis() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const room = getRoom(roomId || '');
  const [analysis, setAnalysis] = useState(room?.relationshipAnalysis || '');
  const [loading, setLoading] = useState(!analysis);
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
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAnalysis(data.analysis);
        saveRoom(roomId!, { relationshipAnalysis: data.analysis, status: 'chatting' });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [analysis, room, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg">AI 正在分析，预计需要 15 秒...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">双人关系分析</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
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
