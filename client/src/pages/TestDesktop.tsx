import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { questions } from '../data/questions';
import type { Answer } from '@mbti-duo/shared';
import { getUser } from '../utils/storage';

export function TestDesktop() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [animating, setAnimating] = useState(false);

  const { emit } = useSocket(roomId, user?.id);
  const currentQuestion = questions[currentIndex];

  const handleSelect = useCallback((choice: 'A' | 'B') => {
    if (!currentQuestion || animating) return;

    setSelected(choice);

    const choiceData = choice === 'A' ? currentQuestion.choiceA : currentQuestion.choiceB;
    const answer: Answer = {
      questionId: currentQuestion.id,
      chosen: choice,
      value: choiceData.value,
      timestamp: Date.now(),
    };

    // Update or add answer (handles going back and re-selecting)
    const newAnswers = [...answers];
    const existingIdx = newAnswers.findIndex((a) => a.questionId === currentQuestion.id);
    if (existingIdx >= 0) {
      newAnswers[existingIdx] = answer;
    } else {
      newAnswers.push(answer);
    }
    setAnswers(newAnswers);
    emit('answer-submitted', { roomId: roomId!, answer });

    // Auto-advance after short delay
    setAnimating(true);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelected(newAnswers[currentIndex + 1]?.chosen ?? null);
      } else {
        emit('answers-batch', { roomId: roomId!, answers: newAnswers });
        emit('test-completed', { roomId: roomId!, userId: user!.id });
        saveRoom(roomId!, { myAnswers: newAnswers, status: 'analyzing' });
        navigate(`/room/${roomId}/result`);
      }
      setAnimating(false);
    }, 400);
  }, [currentQuestion, answers, currentIndex, emit, roomId, user, navigate, animating]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelected(answers[currentIndex - 1]?.chosen ?? null);
    }
  }, [currentIndex, answers]);

  const handleFillAll = useCallback(() => {
    const filled: Answer[] = questions.slice(0, -1).map((q) => {
      const choice = Math.random() > 0.5 ? 'A' : 'B';
      const choiceData = choice === 'A' ? q.choiceA : q.choiceB;
      return {
        questionId: q.id,
        chosen: choice,
        value: choiceData.value,
        timestamp: Date.now(),
      };
    });
    setAnswers(filled);
    setCurrentIndex(questions.length - 1);
    setSelected(null);
  }, []);

  if (!currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">题目加载失败</div>;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex">
      {/* 左侧：题目和选项 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部进度栏 */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-8 py-4">
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

        {/* 题目内容 */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className={`w-full max-w-2xl transition-all duration-300 ${animating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}>
            {/* 题目文字 */}
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4">
                题目 {currentIndex + 1}
              </span>
              <h2 className="text-2xl xl:text-3xl font-semibold text-slate-800 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* 选项卡片 - 左右布局 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 选项 A */}
              <button
                onClick={() => handleSelect('A')}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selected === 'A'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-xl shadow-blue-500/20 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 ${
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

              {/* 选项 B */}
              <button
                onClick={() => handleSelect('B')}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selected === 'B'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 ${
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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 px-8 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="py-3 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium disabled:opacity-50 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              上一题
            </button>
            <span className="text-sm text-slate-400 dark:text-slate-500">
              选择后自动跳转
            </span>
          </div>
        </div>
      </div>

      {/* 右侧：答题进度概览 */}
      <div className="hidden xl:flex xl:w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-1">答题进度</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            已完成 {answers.length} / {questions.length} 题
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                  i < answers.length
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : i === currentIndex
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            选择 A 或 B 继续答题
          </div>
          <button
            onClick={handleFillAll}
            className="w-full py-2 px-3 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            一键填充（跳到最后一题）
          </button>
        </div>
      </div>
    </div>
  );
}
