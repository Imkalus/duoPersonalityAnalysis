import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom, saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { questions } from '../data/questions';
import type { Answer } from '@mbti-duo/shared';

export function Test() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const room = getRoom(roomId || '');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [animating, setAnimating] = useState(false);

  const { emit } = useSocket(roomId, user?.id);
  const currentQuestion = questions[currentIndex];

  const handleSelect = useCallback((choice: 'A' | 'B') => {
    setSelected(choice);
  }, []);

  const handleNext = useCallback(() => {
    if (!selected || !currentQuestion) return;

    const choiceData = selected === 'A' ? currentQuestion.choiceA : currentQuestion.choiceB;
    const answer: Answer = {
      questionId: currentQuestion.id,
      chosen: selected,
      value: choiceData.value,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    emit('answer-submitted', { roomId: roomId!, answer });

    setAnimating(true);
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
      setAnimating(false);
    }, 300);
  }, [selected, currentQuestion, answers, currentIndex, emit, roomId, user, navigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelected(answers[currentIndex - 1]?.chosen ?? null);
    }
  }, [currentIndex, answers]);

  if (!currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">题目加载失败</div>;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 顶部进度栏 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              第 {currentIndex + 1} / {questions.length} 题
            </span>
            <span className="text-sm font-medium text-blue-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className={`transition-all duration-300 ${animating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}>
          {/* 题目文字 */}
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4">
              {currentQuestion.question}
            </span>
          </div>

          {/* 选项卡片 */}
          <div className="space-y-4">
            {/* 选项 A */}
            <button
              onClick={() => handleSelect('A')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                selected === 'A'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  selected === 'A'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  A
                </div>
                <span className={`text-lg ${
                  selected === 'A'
                    ? 'text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {currentQuestion.choiceA.text}
                </span>
              </div>
            </button>

            {/* 分隔线 */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-sm text-slate-400 dark:text-slate-500">或者</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* 选项 B */}
            <button
              onClick={() => handleSelect('B')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                selected === 'B'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  selected === 'B'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  B
                </div>
                <span className={`text-lg ${
                  selected === 'B'
                    ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {currentQuestion.choiceB.text}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 safe-area-pb">
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 py-3.5 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium disabled:opacity-50 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            上一题
          </button>
          <button
            onClick={handleNext}
            disabled={!selected}
            className="flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
          >
            {currentIndex === questions.length - 1 ? '完成测试' : '下一题'}
          </button>
        </div>
      </div>
    </div>
  );
}
