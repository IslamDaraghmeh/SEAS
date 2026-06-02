import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Card from '../ui/Card';

interface ExamPerformanceData {
  exam: string;
  examId?: string;
  avgScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
  students: number;
}

interface ExamPerformanceChartProps {
  data: ExamPerformanceData[];
  title?: string;
  className?: string;
  height?: number;
  passingScore?: number;
}

const ExamPerformanceChart: React.FC<ExamPerformanceChartProps> = ({
  data,
  title,
  className = '',
  height = 350,
  passingScore = 60,
}) => {
  const { t } = useTranslation();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const exam = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
          <p className="font-medium text-gray-900 dark:text-white mb-3 truncate">{label}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.avgScore') || 'Avg Score'}:</span>
              <span className="font-semibold text-primary-600">{exam.avgScore.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.maxScore') || 'Max'}:</span>
              <span className="font-semibold text-green-600">{exam.maxScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.minScore') || 'Min'}:</span>
              <span className="font-semibold text-red-600">{exam.minScore}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.passRate') || 'Pass Rate'}:</span>
              <span className={`font-semibold ${exam.passRate >= 70 ? 'text-green-600' : exam.passRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {exam.passRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.students') || 'Students'}:</span>
              <span className="font-semibold">{exam.students}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate overall stats
  const overallAvg = data.length > 0
    ? data.reduce((sum, item) => sum + item.avgScore, 0) / data.length
    : 0;
  const overallPassRate = data.length > 0
    ? data.reduce((sum, item) => sum + item.passRate, 0) / data.length
    : 0;

  return (
    <Card className={`p-6 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-gray-600 dark:text-gray-300">
              {t('analytics.avgScore') || 'Avg'}: <span className="font-semibold text-primary-600">{overallAvg.toFixed(1)}%</span>
            </div>
            <div className={`font-semibold ${overallPassRate >= 70 ? 'text-green-600' : overallPassRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {overallPassRate.toFixed(1)}% {t('analytics.passRate') || 'pass rate'}
            </div>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="exam"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>
            )}
          />
          <Bar
            yAxisId="left"
            dataKey="avgScore"
            name={t('analytics.avgScore') || 'Average Score'}
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="passRate"
            name={t('analytics.passRate') || 'Pass Rate'}
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="students"
            name={t('analytics.students') || 'Students'}
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Passing score indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('analytics.passingScore') || 'Passing Score'}: {passingScore}%
        </p>
      </div>
    </Card>
  );
};

export default ExamPerformanceChart;
