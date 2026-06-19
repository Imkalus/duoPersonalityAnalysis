import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getUser, setUser, saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { sanitizeText } from '../utils/sanitize';
import type { UserProfile } from '@mbti-duo/shared';

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getUser());

  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  // Determine role: if user's id matches room's A.userId, they're the creator
  const isCreator = currentUser && roomData && currentUser.id === roomData.members?.A?.userId;
  const fromName = searchParams.get('from') || '';

  // Connect socket — will reconnect when currentUser changes (after B joins)
  const { emit, on } = useSocket(roomId, currentUser?.id);

  // Fetch room data
  useEffect(() => {
    if (!roomId) return;

    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRoomData(data);
        setLoading(false);

        // If room is already past 'waiting' and user is A, go straight to test
        if (data.status !== 'waiting' && currentUser && currentUser.id === data.members?.A?.userId) {
          navigate(`/room/${roomId}/test`);
        }
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [roomId, currentUser, navigate]);

  // Listen for partner-joined (A receives this when B joins)
  useEffect(() => {
    if (!isCreator) return;
    const unsub = on('partner-joined', (data) => {
      setRoomData((prev: any) => ({
        ...prev,
        members: { ...prev.members, B: { name: sanitizeText(data.name) } },
        status: 'testing',
      }));
      // Auto-navigate A to test
      navigate(`/room/${roomId}/test`);
    });
    return unsub;
  }, [on, isCreator, navigate, roomId]);

  // Listen for room-state (B receives this after joining via socket)
  useEffect(() => {
    if (isCreator) return;
    const unsub = on('room-state', (data) => {
      if (data.status === 'testing' || data.status === 'analyzing' || data.status === 'chatting') {
        navigate(`/room/${roomId}/test`);
      }
    });
    return unsub;
  }, [on, isCreator, navigate, roomId]);

  // B joins the room
  const handleJoin = async () => {
    if (!joinName.trim() || !roomId) return;

    setJoining(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sanitizeText(joinName.trim()) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save user profile locally
      const newUser: UserProfile = {
        id: data.userId,
        name: joinName.trim(),
        createdAt: Date.now(),
      };
      setUser(newUser);
      setCurrentUser(newUser);
      saveRoom(roomId, { status: 'testing' } as any);

      setJoined(true);
      // Socket will auto-connect via useSocket hook since currentUser changed
    } catch (e: any) {
      setError(e.message || '加入失败');
    } finally {
      setJoining(false);
    }
  };

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

  const waiting = roomData.status === 'waiting';
  const inviteUrl = `${window.location.origin}/room/${roomId}?from=${encodeURIComponent(currentUser?.name || '')}`;

  // Creator (A) view: waiting for B
  if (waiting && isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-6">房间 {roomId}</h1>
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
        </div>
      </div>
    );
  }

  // Joiner (B) view: enter name and join
  if (waiting && !isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-6">房间 {roomId}</h1>
          {joined ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
              <p className="text-gray-600 dark:text-gray-400">已加入房间，等待跳转...</p>
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {fromName ? `${fromName} 邀请你加入测试` : '你被邀请加入 MBTI 双人测试'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                关系：{sanitizeText(roomData.relationship)} | 模式：{roomData.mode === 'sync' ? '同步' : '独立'}
              </p>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="输入你的昵称"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
              <button
                onClick={handleJoin}
                disabled={!joinName.trim() || joining}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 transition-all hover:bg-blue-600"
              >
                {joining ? '加入中...' : '加入房间'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Room already started
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">房间 {roomId}</h1>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <p className="mb-4">房间状态：{roomData.status}</p>
          <button
            onClick={() => navigate(`/room/${roomId}/test`)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg"
          >
            进入测试
          </button>
        </div>
      </div>
    </div>
  );
}
