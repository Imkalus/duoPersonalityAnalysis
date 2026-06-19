import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveRoom, getRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { questions } from '../data/questions';
import type { Answer } from '@mbti-duo/shared';
import { getUser } from '../utils/storage';

export function TestMobile() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const roomData = getRoom(roomId || '');
  const isOpen = roomData?.displayMode === 'open';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [partnerChoice, setPartnerChoice] = useState<'A' | 'B' | null>(null);
  const [partnerAnswerCount, setPartnerAnswerCount] = useState(0);
  const [partnerActiveAt, setPartnerActiveAt] = useState(0);
  const [partnerFinished, setPartnerFinished] = useState(false);
  const [now, setNow] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const { emit, on } = useSocket(roomId, user?.id);
  const currentQuestion = questions[currentIndex];

  // Tick clock for "answering recently" indicator
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Listen for partner's progress (both modes)
  useEffect(() => {
    const unsub1 = on('answer-synced', ({ questionId, value }) => {
      setPartnerAnswerCount((c) => c + 1);
      setPartnerActiveAt(Date.now());
      if (isOpen) {
        const q = questions.find((q) => q.id === questionId);
        if (q) {
          setPartnerChoice(q.choiceA.value === value ? 'A' : 'B');
        }
      }
    });
    const unsub2 = on('both-completed', () => {
      setPartnerFinished(true);
    });
    const unsub3 = on('partner-progress', ({ count }) => {
      setPartnerAnswerCount(count);
      setPartnerActiveAt(Date.now());
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on, isOpen]);

  // Reset partner choice when question changes
  useEffect(() => {
    setPartnerChoice(null);
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startX;
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    if (Math.abs(offsetX) > 100) {
      // 滑动距离足够，选择对应选项
      if (offsetX > 0) {
        handleSelect('A');
      } else {
        handleSelect('B');
      }
    }
    setOffsetX(0);
    setSwiping(false);
  };

  const handleSelect = useCallback((choice: 'A' | 'B') => {
    setSelected(choice);

    const choiceData = choice === 'A' ? currentQuestion.choiceA : currentQuestion.choiceB;
    const answer: Answer = {
      questionId: currentQuestion.id,
      chosen: choice,
      value: choiceData.value,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    emit('answer-submitted', { roomId: roomId!, answer });

    // 自动跳到下一题
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
      } else {
        emit('answers-batch', { roomId: roomId!, answers: newAnswers });
        emit('test-completed', { roomId: roomId!, userId: user!.id });
        saveRoom(roomId!, { myAnswers: newAnswers, status: 'analyzing' });
        navigate(`/room/${roomId}/result`);
      }
    }, 300);
  }, [currentQuestion, answers, currentIndex, emit, roomId, user, navigate]);

  if (!currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">题目加载失败</div>;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-indigo-600 flex flex-col">
      {/* 顶部进度 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between text-white/80 text-sm mb-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Partner status pill */}
        {(() => {
          const recentlyActive = now - partnerActiveAt < 4000 && partnerActiveAt > 0;
          const partnerProgress = (partnerAnswerCount / questions.length) * 100;
          const label = partnerFinished
            ? '对方已完成 ✓'
            : recentlyActive
            ? '对方正在答题中...'
            : partnerAnswerCount === 0
            ? '等待对方开始答题'
            : `对方已答 ${partnerAnswerCount}/${questions.length}`;
          return (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
              <span className={`relative w-2 h-2 rounded-full shrink-0 ${
                partnerFinished ? 'bg-emerald-300' : recentlyActive ? 'bg-amber-300' : 'bg-white/40'
              }`}>
                {recentlyActive && !partnerFinished && (
                  <span className="absolute inset-0 rounded-full bg-amber-300 animate-ping opacity-60" />
                )}
              </span>
              <span className="text-xs text-white/90 flex-1 truncate">{label}</span>
              {!partnerFinished && partnerAnswerCount > 0 && (
                <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-white/80 transition-all"
                    style={{ width: `${partnerProgress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 题目卡片区域 */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-6 py-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="w-full max-w-sm transition-transform duration-200"
          style={{ transform: `translateX(${offsetX}px)` }}
        >
          {/* 题目 */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
            <p className="text-white/60 text-sm mt-2">← 左右滑动选择 →</p>
          </div>

          {/* 选项 */}
          <div className="space-y-4">
            <button
              onClick={() => handleSelect('A')}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-200 ${
                selected === 'A'
                  ? 'bg-white text-blue-600 scale-95 shadow-2xl'
                  : 'bg-white/10 text-white backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    selected === 'A' ? 'bg-blue-100 text-blue-600' : 'bg-white/20 text-white'
                  }`}>
                    A
                  </div>
                  {isOpen && partnerChoice === 'A' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow">✓</div>
                  )}
                </div>
                <span className="text-lg">{currentQuestion.choiceA.text}</span>
              </div>
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-sm text-white/40">或者</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <button
              onClick={() => handleSelect('B')}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-200 ${
                selected === 'B'
                  ? 'bg-white text-indigo-600 scale-95 shadow-2xl'
                  : 'bg-white/10 text-white backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    selected === 'B' ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white'
                  }`}>
                    B
                  </div>
                  {isOpen && partnerChoice === 'B' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow">✓</div>
                  )}
                </div>
                <span className="text-lg">{currentQuestion.choiceB.text}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="px-6 pb-8 pt-4 safe-area-pb space-y-3">
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                setSelected(answers[currentIndex - 1]?.chosen ?? null);
              }
            }}
            disabled={currentIndex === 0}
            className="group flex items-center gap-2 py-2.5 pl-2.5 pr-5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium transition-all disabled:opacity-0 disabled:pointer-events-none active:scale-95"
          >
            <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              <svg className="w-4 h-4 transition-transform group-active:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            返回上一题
          </button>
        </div>
        <button
          onClick={() => {
            const filled: Answer[] = questions.slice(0, -1).map((q) => {
              const choice = Math.random() > 0.5 ? 'A' : 'B';
              const choiceData = choice === 'A' ? q.choiceA : q.choiceB;
              return { questionId: q.id, chosen: choice, value: choiceData.value, timestamp: Date.now() };
            });
            setAnswers(filled);
            setCurrentIndex(questions.length - 1);
            setSelected(null);
          }}
          className="w-full py-2 text-amber-200/70 text-xs transition-all active:scale-95"
        >
          一键填充（跳到最后一题）
        </button>
      </div>
    </div>
  );
}
