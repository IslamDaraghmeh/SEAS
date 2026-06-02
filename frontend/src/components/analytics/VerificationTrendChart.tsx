import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Card from '../ui/Card';

interface VerificationTrendData {
  date: string;
  total: number;
  successful: number;
  failed: number;
  successRate?: number;
}

interface VerificationTrendChartProps {
  data: VerificationTrendData[];
  title?: string;
  className?: string;
  height?: number;
  showSuccessRate?: boolean;
}

const VerificationTrendChart: React.FC<VerificationTrendChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
  showSuccessRate = true,
}) => {
  const { t } = useTranslation();

  // Process data to include success rate
  const processedData = data.map(item => ({
    ...item,
    successRate: item.total > 0 ? (item.successful / item.total) * 100 : 0,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-300">
              <span className="inline-block w-3 h-3 rounded mr-2 bg-blue-500" />
              {t('analytics.total') || 'Total'}: <span className="font-semibold">{data.total}</span>
            </p>
            <p className="text-green-600 dark:text-green-400">
              <span className="inline-block w-3 h-3 rounded mr-2 bg-green-500" />
              {t('analytics.successful') || 'Successful'}: <span className="font-semibold">{data.successful}</span>
            </p>
            <p className="text-red-600 dark:text-red-400">
              <span className="inline-block w-3 h-3 rounded mr-2 bg-red-500" />
              {t('analytics.failed') || 'Failed'}: <span className="font-semibold">{data.failed}</span>
            </p>
            {showSuccessRate && (
              <p className="text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
                {t('analytics.successRate') || 'Success Rate'}: <span className="font-semibold">{data.successRate.toFixed(1)}%</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate summary stats
  const totalVerifications = processedData.reduce((sum, item) => sum + item.total, 0);
  const totalSuccessful = processedData.reduce((sum, item) => sum + item.successful, 0);
  const overallSuccessRate = totalVerifications > 0 ? (totalSuccessful / totalVerifications) * 100 : 0;

  return (
    <Card className={`p-6 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-gray-600 dark:text-gray-300">
              {t('analytics.total') || 'Total'}: <span className="font-semibold">{totalVerifications.toLocaleString()}</span>
            </div>
            <div className={`font-semibold ${overallSuccessRate >= 80 ? 'text-green-600' : overallSuccessRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {overallSuccessRate.toFixed(1)}% {t('analytics.successRate') || 'success'}
            </div>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSuccessful" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="formattedDate"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="successful"
            name={t('analytics.successful') || 'Successful'}
            stroke="#22c55e"
            fillOpacity={1}
            fill="url(#colorSuccessful)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="failed"
            name={t('analytics.failed') || 'Failed'}
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorFailed)"
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default VerificationTrendChart;
