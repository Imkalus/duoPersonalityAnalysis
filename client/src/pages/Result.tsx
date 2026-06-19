import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom, saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { calculateMBTI } from '../utils/scoring';

export function Result() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const room = getRoom(roomId || '');
  const [waiting, setWaiting] = useState(false);

  const { on } = useSocket(roomId, user?.id);

  const result = room?.myAnswers?.length ? calculateMBTI(room.myAnswers) : null;

  useEffect(() => {
    if (result) {
      saveRoom(roomId!, { myResult: result });
    }
  }, [result, roomId]);

  useEffect(() => {
    const unsub = on('both-completed', () => {
      setWaiting(false);
      navigate(`/room/${roomId}/analysis`);
    });
    return unsub;
  }, [on, navigate, roomId]);

  if (!result) {
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
        <h1 className="text-3xl font-bold mb-2">你的 MBTI 类型</h1>
        <div className="text-5xl font-bold text-blue-500 mb-6">{result.type}</div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
          {Object.entries(result.dimensions).map(([dim, data]) => (
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

        <p className="text-gray-600 dark:text-gray-400 mb-6">{result.description}</p>

        <button
          onClick={() => {
            setWaiting(true);
            // 等待对方完成
          }}
          disabled={waiting}
          className="px-6 py-3 bg-blue-500 disabled:bg-blue-300 text-white rounded-lg"
        >
          {waiting ? '等待对方完成...' : '查看双人分析'}
        </button>
      </div>
    </div>
  );
}
