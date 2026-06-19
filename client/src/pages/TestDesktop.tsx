import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveRoom, getRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { questions } from '../data/questions';
import type { Answer } from '@mbti-duo/shared';
import { getUser } from '../utils/storage';

export function TestDesktop() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const roomData = getRoom(roomId || '');
  const isOpen = roomData?.displayMode === 'open';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [animating, setAnimating] = useState(false);
  const [partnerAnswerCount, setPartnerAnswerCount] = useState(0);
  const [partnerFinished, setPartnerFinished] = useState(false);
  const [partnerCurrentAnswer, setPartnerCurrentAnswer] = useState<{ questionId: number; chosen: 'A' | 'B' } | null>(null);
  const [partnerLastAnswer, setPartnerLastAnswer] = useState<{ questionText: string; chosenText: string; chosen: 'A' | 'B'; index: number } | null>(null);
  const [partnerActiveAt, setPartnerActiveAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Tick clock for "answering recently" indicator
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Reset partner answer display when question changes
  useEffect(() => {
    setPartnerCurrentAnswer(null);
  }, [currentIndex]);

  const { emit, on } = useSocket(roomId, user?.id);
  const currentQuestion = questions[currentIndex];

  // Listen for partner's answer progress
  useEffect(() => {
    const unsub1 = on('answer-synced', ({ questionId, value }) => {
      setPartnerAnswerCount((c) => c + 1);
      setPartnerActiveAt(Date.now());
      if (isOpen) {
        const idx = questions.findIndex((q) => q.id === questionId);
        const q = questions[idx];
        if (q) {
          const chosen = q.choiceA.value === value ? 'A' : 'B';
          setPartnerCurrentAnswer({ questionId, chosen });
          setPartnerLastAnswer({
            questionText: q.question,
            chosenText: chosen === 'A' ? q.choiceA.text : q.choiceB.text,
            chosen,
            index: idx + 1,
          });
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
            <div className="flex items-center gap-3">
              {(() => {
                const recentlyActive = now - partnerActiveAt < 4000 && partnerActiveAt > 0;
                const label = partnerFinished
                  ? '对方已完成'
                  : recentlyActive
                  ? '对方正在答题中...'
                  : partnerAnswerCount === 0
                  ? '等待对方开始'
                  : `对方已答 ${partnerAnswerCount}/${questions.length}`;
                return (
                  <span className="xl:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                    <span className={`relative w-1.5 h-1.5 rounded-full ${
                      partnerFinished ? 'bg-emerald-500' : recentlyActive ? 'bg-amber-500' : 'bg-slate-400'
                    }`}>
                      {recentlyActive && !partnerFinished && (
                        <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-60" />
                      )}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{label}</span>
                  </span>
                );
              })()}
              <span className="text-sm font-medium text-blue-500">
                {Math.round(progress)}%
              </span>
            </div>
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
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl ${
                      selected === 'A'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      A
                    </div>
                    {isOpen && partnerCurrentAnswer?.questionId === currentQuestion.id && partnerCurrentAnswer?.chosen === 'A' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow">✓</div>
                    )}
                  </div>
                  <span className={`text-lg mt-4 ${
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
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl ${
                      selected === 'B'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      B
                    </div>
                    {isOpen && partnerCurrentAnswer?.questionId === currentQuestion.id && partnerCurrentAnswer?.chosen === 'B' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow">✓</div>
                    )}
                  </div>
                  <span className={`text-lg mt-4 ${
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
              className="group flex items-center gap-2 py-2.5 pl-3 pr-5 rounded-full text-slate-600 dark:text-slate-300 font-medium transition-all disabled:opacity-0 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </span>
              <span className="text-sm">上一题</span>
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500">选择后自动进入下一题</span>
          </div>
        </div>
      </div>

      {/* 右侧：对方进度 + 我的进度 */}
      <div className="hidden xl:flex xl:w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">答题面板</h3>

          {/* 我的进度 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">我的进度</span>
              <span className="text-sm font-bold text-blue-500">{answers.length}/{questions.length}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(answers.length / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 对方进度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">对方进度</span>
              {partnerFinished ? (
                <span className="text-sm font-bold text-emerald-500">已完成</span>
              ) : (
                <span className="text-sm font-bold text-amber-500">{partnerAnswerCount}/{questions.length}</span>
              )}
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  partnerFinished
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500'
                }`}
                style={{ width: partnerFinished ? '100%' : `${(partnerAnswerCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            {(() => {
              const recentlyActive = now - partnerActiveAt < 4000 && partnerActiveAt > 0;
              const status = partnerFinished
                ? { emoji: '✓', label: '对方已完成答题，等你哦~', color: 'bg-emerald-100 dark:bg-emerald-900/30' }
                : recentlyActive
                ? { emoji: '✍️', label: '对方正在答题中...', color: 'bg-amber-100 dark:bg-amber-900/30' }
                : partnerAnswerCount > 0
                ? { emoji: '⏸', label: '对方暂停了一下', color: 'bg-slate-100 dark:bg-slate-700' }
                : { emoji: '⏳', label: '等待对方开始答题', color: 'bg-slate-100 dark:bg-slate-700' };
              return (
                <>
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${status.color}`}>
                    <span className="text-2xl">{status.emoji}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {status.label}
                  </p>
                  {recentlyActive && !partnerFinished && (
                    <div className="mt-3 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </>
              );
            })()}

            {/* 明牌：对方上一题选择 */}
            {isOpen && partnerLastAnswer && !partnerFinished && (
              <div className="mt-6 w-full text-left bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">
                  对方第 {partnerLastAnswer.index} 题选择了
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                  {partnerLastAnswer.questionText}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                    partnerLastAnswer.chosen === 'A' ? 'bg-blue-500' : 'bg-indigo-500'
                  }`}>
                    {partnerLastAnswer.chosen}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{partnerLastAnswer.chosenText}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
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
