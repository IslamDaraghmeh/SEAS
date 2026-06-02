import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import Card from '../ui/Card';

interface CompletionRateData {
  time: string;
  completed: number;
  inProgress: number;
  total: number;
  completionRate?: number;
}

interface CompletionRateChartProps {
  data: CompletionRateData[];
  title?: string;
  className?: string;
  height?: number;
  targetRate?: number;
}

const CompletionRateChart: React.FC<CompletionRateChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
  targetRate = 80,
}) => {
  const { t } = useTranslation();

  // Process data to include completion rate
  const processedData = data.map(item => ({
    ...item,
    completionRate: item.total > 0 ? (item.completed / item.total) * 100 : 0,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-300">
              {t('analytics.completed') || 'Completed'}: <span className="font-semibold">{data.completed}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {t('analytics.inProgress') || 'In Progress'}: <span className="font-semibold">{data.inProgress}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {t('analytics.total') || 'Total'}: <span className="font-semibold">{data.total}</span>
            </p>
            <p className="text-primary-600 dark:text-primary-400 pt-1 border-t border-gray-200 dark:border-gray-600">
              {t('analytics.completionRate') || 'Completion Rate'}: <span className="font-semibold">{data.completionRate.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate current completion rate
  const latestData = processedData[processedData.length - 1];
  const currentRate = latestData?.completionRate || 0;
  const isAboveTarget = currentRate >= targetRate;

  return (
    <Card className={`p-6 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-4">
            <div className={`text-sm font-semibold ${isAboveTarget ? 'text-green-600' : 'text-yellow-600'}`}>
              {currentRate.toFixed(1)}% {t('analytics.current') || 'current'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('analytics.target') || 'Target'}: {targetRate}%
            </div>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="time"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={targetRate}
            label={{
              value: `${t('analytics.target') || 'Target'}: ${targetRate}%`,
              position: 'right',
              fill: '#6b7280',
              fontSize: 11,
            }}
            stroke="#9ca3af"
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="completionRate"
            name={t('analytics.completionRate') || 'Completion Rate'}
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{latestData?.completed || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('analytics.completed') || 'Completed'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{latestData?.inProgress || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('analytics.inProgress') || 'In Progress'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{latestData?.total || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('analytics.total') || 'Total'}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CompletionRateChart;
