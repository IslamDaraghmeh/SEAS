import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Card from '../ui/Card';

interface ScoreDistributionData {
  range: string;
  count: number;
  percentage: number;
}

interface ScoreDistributionChartProps {
  data: ScoreDistributionData[];
  title?: string;
  className?: string;
  height?: number;
  showPercentage?: boolean;
}

const GRADE_COLORS = {
  '0-50': '#ef4444',   // Red - Failing
  '50-60': '#f97316',  // Orange - Poor
  '60-70': '#eab308',  // Yellow - Average
  '70-80': '#22c55e',  // Green - Good
  '80-90': '#3b82f6',  // Blue - Very Good
  '90-100': '#8b5cf6', // Purple - Excellent
};

const getBarColor = (range: string): string => {
  const rangeKey = Object.keys(GRADE_COLORS).find(key => range.includes(key.split('-')[0]));
  return rangeKey ? GRADE_COLORS[rangeKey as keyof typeof GRADE_COLORS] : '#6b7280';
};

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
  showPercentage = true,
}) => {
  const { t } = useTranslation();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('analytics.students') || 'Students'}: <span className="font-semibold">{payload[0].value}</span>
          </p>
          {showPercentage && payload[0].payload.percentage !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ({payload[0].payload.percentage.toFixed(1)}%)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`p-6 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="range"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            label={{
              value: t('analytics.numberOfStudents') || 'Number of Students',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6b7280', fontSize: 12 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {Object.entries(GRADE_COLORS).map(([range, color]) => (
          <div key={range} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">{range}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ScoreDistributionChart;
