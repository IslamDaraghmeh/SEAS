import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from '@heroicons/react/24/outline';
import { FlagIcon as FlagSolidIcon } from '@heroicons/react/24/solid';
import Card from '../ui/Card';
import { Question } from '../../services/exam.service';
import AnswerOptions from './AnswerOptions';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | number | null;
  onAnswerSelect: (answer: string | number) => void;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  showResult?: boolean;
  isCorrect?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  isFlagged = false,
  onToggleFlag,
  showResult = false,
  isCorrect,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="relative">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-700 font-bold rounded-full">
            {questionNumber}
          </span>
          <div>
            <span className="text-sm text-gray-500">
              {t('exam.question')} {questionNumber} {t('exam.of')} {totalQuestions}
            </span>
            <span className="block text-xs text-gray-400">
              {question.marks} {t('exam.marks')}
            </span>
          </div>
        </div>

        {/* Flag Button */}
        {onToggleFlag && !showResult && (
          <button
            type="button"
            onClick={onToggleFlag}
            className={`p-2 rounded-lg transition-colors ${
              isFlagged
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
            }`}
            title={isFlagged ? t('exam.unflagQuestion') : t('exam.flagQuestion')}
          >
            {isFlagged ? (
              <FlagSolidIcon className="h-5 w-5" />
            ) : (
              <FlagIcon className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Result Badge */}
        {showResult && isCorrect !== undefined && (
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              isCorrect
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {isCorrect ? t('results.correctAnswers') : t('results.wrongAnswers')}
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <p className="text-lg text-gray-800 leading-relaxed">{question.text}</p>
      </div>

      {/* Answer Options */}
      <AnswerOptions
        question={question}
        selectedAnswer={selectedAnswer}
        onAnswerSelect={onAnswerSelect}
        showResult={showResult}
        disabled={showResult}
      />
    </Card>
  );
};

export default QuestionCard;
