import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, getRoom, saveRoom } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { getQuestions } from '../data/questions';
import type { Answer } from '@mbti-duo/shared';

export function Test() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const room = getRoom(roomId || '');

  const questions = getQuestions(room?.questionVersion || 'lite');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const { emit } = useSocket(roomId, user?.id);

  const currentQuestion = questions[currentIndex];

  const handleSelect = useCallback((value: number) => {
    setSelectedValue(value);
  }, []);

  const handleNext = useCallback(() => {
    if (selectedValue === null || !currentQuestion) return;

    const answer: Answer = {
      questionId: currentQuestion.id,
      dimension: currentQuestion.dimension,
      value: selectedValue,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // 发送给服务器
    emit('answer-submitted', { roomId: roomId!, answer });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedValue(null);
    } else {
      // 完成所有题目
      emit('answers-batch', { roomId: roomId!, answers: newAnswers });
      emit('test-completed', { roomId: roomId!, userId: user!.id });
      saveRoom(roomId!, { myAnswers: newAnswers, status: 'analyzing' });
      navigate(`/room/${roomId}/result`);
    }
  }, [selectedValue, currentQuestion, answers, currentIndex, emit, roomId, questions.length, user, navigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedValue(answers[currentIndex - 1]?.value ?? null);
    }
  }, [currentIndex, answers]);

  if (!currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">题目加载失败</div>;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  const likertLabels = [
    '强烈不同意',
    '中度不同意',
    '轻微不同意',
    '中立',
    '轻微同意',
    '中度同意',
    '强烈同意',
  ];

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* 进度条 */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-sm text-gray-500 mb-2">
        {currentIndex + 1} / {questions.length}
      </div>

      {/* 题目 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-xl font-medium text-center mb-8 max-w-lg">
          {currentQuestion.text}
        </h2>

        {/* Likert 量表 */}
        <div className="w-full max-w-lg">
          <div className="flex justify-between mb-2 text-xs text-gray-500">
            <span>不同意</span>
            <span>同意</span>
          </div>
          <div className="flex gap-2 justify-center">
            {[-3, -2, -1, 0, 1, 2, 3].map((value) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
                  selectedValue === value
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {likertLabels[value + 3]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex gap-4 mt-8 max-w-lg mx-auto w-full">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 disabled:opacity-50 rounded-lg"
        >
          上一题
        </button>
        <button
          onClick={handleNext}
          disabled={selectedValue === null}
          className="flex-1 py-3 bg-blue-500 disabled:bg-blue-300 text-white rounded-lg font-medium"
        >
          {currentIndex === questions.length - 1 ? '完成' : '下一题'}
        </button>
      </div>
    </div>
  );
}
