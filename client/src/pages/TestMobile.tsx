import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { questions } from '../data/questions';
import type { Answer } from '@mbti-duo/shared';
import { getUser } from '../utils/storage';

export function TestMobile() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { emit } = useSocket(roomId, user?.id);
  const currentQuestion = questions[currentIndex];

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
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  selected === 'A' ? 'bg-blue-100 text-blue-600' : 'bg-white/20 text-white'
                }`}>
                  A
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
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  selected === 'B' ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white'
                }`}>
                  B
                </div>
                <span className="text-lg">{currentQuestion.choiceB.text}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="px-6 pb-8 pt-4 safe-area-pb">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1);
              setSelected(answers[currentIndex - 1]?.chosen ?? null);
            }
          }}
          disabled={currentIndex === 0}
          className="w-full py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-xl disabled:opacity-30 transition-all"
        >
          上一题
        </button>
      </div>
    </div>
  );
}
