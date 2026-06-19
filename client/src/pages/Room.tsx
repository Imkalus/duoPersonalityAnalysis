import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom, saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { sanitizeText } from '../utils/sanitize';
import type { RoomData } from '@mbti-duo/shared';

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { emit, on } = useSocket(roomId, user?.id);

  useEffect(() => {
    if (!roomId) return;

    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRoomData(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [roomId]);

  useEffect(() => {
    const unsub = on('partner-joined', (data) => {
      setRoomData((prev: any) => ({
        ...prev,
        members: { ...prev.members, B: { name: sanitizeText(data.name) } },
        status: 'testing',
      }));
    });
    return unsub;
  }, [on]);

  useEffect(() => {
    const unsub = on('room-state', (data) => {
      if (data.status === 'testing' || data.status === 'analyzing' || data.status === 'chatting') {
        navigate(`/room/${roomId}/test`);
      }
    });
    return unsub;
  }, [on, navigate, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">{error || '房间不存在'}</div>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const isCreator = roomData.members?.A?.name && user?.name === roomData.members.A.name;
  const waiting = roomData.status === 'waiting';
  const inviteUrl = `${window.location.origin}/room/${roomId}?from=${encodeURIComponent(user?.name || '')}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">房间 {roomId}</h1>

        {waiting && isCreator && (
          <>
            <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-4">等待对方加入...</p>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg break-all text-sm">
                {inviteUrl}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
              >
                复制链接
              </button>
            </div>
            <div className="text-sm text-gray-500">
              关系：{sanitizeText(roomData.relationship)} | 模式：{roomData.mode === 'sync' ? '同步' : '独立'}
            </div>
          </>
        )}

        {waiting && !isCreator && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
            <p>已加入房间，等待开始...</p>
          </div>
        )}

        {!waiting && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
            <p className="mb-4">房间状态：{roomData.status}</p>
            <button
              onClick={() => navigate(`/room/${roomId}/test`)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg"
            >
              进入测试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
