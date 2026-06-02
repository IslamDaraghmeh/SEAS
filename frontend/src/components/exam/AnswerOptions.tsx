import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Question } from '../../services/exam.service';

interface AnswerOptionsProps {
  question: Question;
  selectedAnswer: string | number | null;
  onAnswerSelect: (answer: string | number) => void;
  showResult?: boolean;
  disabled?: boolean;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showResult = false,
  disabled = false,
}) => {
  const { t } = useTranslation();

  // Render based on question type
  switch (question.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceOptions
          options={question.options || []}
          selectedAnswer={selectedAnswer}
          correctAnswer={showResult ? question.correctAnswer : undefined}
          onSelect={onAnswerSelect}
          disabled={disabled}
        />
      );

    case 'true_false':
      return (
        <TrueFalseOptions
          selectedAnswer={selectedAnswer}
          correctAnswer={showResult ? question.correctAnswer : undefined}
          onSelect={onAnswerSelect}
          disabled={disabled}
        />
      );

    case 'short_answer':
      return (
        <ShortAnswerInput
          value={selectedAnswer as string}
          onChange={(value) => onAnswerSelect(value)}
          disabled={disabled}
          showResult={showResult}
          correctAnswer={showResult ? (question.correctAnswer as string) : undefined}
        />
      );

    case 'essay':
      return (
        <EssayInput
          value={selectedAnswer as string}
          onChange={(value) => onAnswerSelect(value)}
          disabled={disabled}
        />
      );

    default:
      return null;
  }
};

// Multiple Choice Options
interface MultipleChoiceProps {
  options: string[];
  selectedAnswer: string | number | null;
  correctAnswer?: string | number;
  onSelect: (answer: string | number) => void;
  disabled: boolean;
}

const MultipleChoiceOptions: React.FC<MultipleChoiceProps> = ({
  options,
  selectedAnswer,
  correctAnswer,
  onSelect,
  disabled,
}) => {
  const optionLabels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']; // Arabic option labels

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === index;
        const isCorrect = correctAnswer !== undefined && correctAnswer === index;
        const isWrong =
          correctAnswer !== undefined && isSelected && correctAnswer !== index;

        let optionStyles = 'border-gray-200 hover:border-primary-300 hover:bg-primary-50';
        if (isSelected && correctAnswer === undefined) {
          optionStyles = 'border-primary-500 bg-primary-50';
        }
        if (isCorrect) {
          optionStyles = 'border-green-500 bg-green-50';
        }
        if (isWrong) {
          optionStyles = 'border-red-500 bg-red-50';
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onSelect(index)}
            disabled={disabled}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-start ${optionStyles} ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full font-medium ${
                isSelected || isCorrect
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              } ${isCorrect ? 'bg-green-600' : ''} ${isWrong ? 'bg-red-600' : ''}`}
            >
              {optionLabels[index]}
            </span>
            <span className="flex-1 text-gray-800">{option}</span>
            {isCorrect && (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            )}
            {isWrong && <XCircleIcon className="h-6 w-6 text-red-600" />}
          </button>
        );
      })}
    </div>
  );
};

// True/False Options
interface TrueFalseProps {
  selectedAnswer: string | number | null;
  correctAnswer?: string | number;
  onSelect: (answer: string | number) => void;
  disabled: boolean;
}

const TrueFalseOptions: React.FC<TrueFalseProps> = ({
  selectedAnswer,
  correctAnswer,
  onSelect,
  disabled,
}) => {
  const { t } = useTranslation();

  const options = [
    { value: 'true', label: t('common.yes') },
    { value: 'false', label: t('common.no') },
  ];

  return (
    <div className="flex gap-4">
      {options.map((option) => {
        const isSelected = selectedAnswer === option.value;
        const isCorrect =
          correctAnswer !== undefined && correctAnswer === option.value;
        const isWrong =
          correctAnswer !== undefined &&
          isSelected &&
          correctAnswer !== option.value;

        let optionStyles =
          'border-gray-200 hover:border-primary-300 hover:bg-primary-50';
        if (isSelected && correctAnswer === undefined) {
          optionStyles = 'border-primary-500 bg-primary-50';
        }
        if (isCorrect) {
          optionStyles = 'border-green-500 bg-green-50';
        }
        if (isWrong) {
          optionStyles = 'border-red-500 bg-red-50';
        }

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${optionStyles} ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <span className="text-lg font-medium text-gray-800">
              {option.label}
            </span>
            {isCorrect && (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            )}
            {isWrong && <XCircleIcon className="h-6 w-6 text-red-600" />}
          </button>
        );
      })}
    </div>
  );
};

// Short Answer Input
interface ShortAnswerProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  showResult?: boolean;
  correctAnswer?: string;
}

const ShortAnswerInput: React.FC<ShortAnswerProps> = ({
  value,
  onChange,
  disabled,
  showResult,
  correctAnswer,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={t('exam.selectAnswer')}
        className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
          disabled
            ? 'bg-gray-50 border-gray-200 cursor-default'
            : 'border-gray-200 focus:border-primary-500'
        }`}
      />
      {showResult && correctAnswer && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-sm text-green-600 font-medium">
            {t('exam.correctAnswer')}:
          </span>
          <span className="ms-2 text-green-700">{correctAnswer}</span>
        </div>
      )}
    </div>
  );
};

// Essay Input
interface EssayProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const EssayInput: React.FC<EssayProps> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();

  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={t('exam.answer')}
      rows={6}
      className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none resize-none ${
        disabled
          ? 'bg-gray-50 border-gray-200 cursor-default'
          : 'border-gray-200 focus:border-primary-500'
      }`}
    />
  );
};

export default AnswerOptions;
