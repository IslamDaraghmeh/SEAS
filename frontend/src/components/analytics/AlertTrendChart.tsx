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
  Legend,
} from 'recharts';
import Card from '../ui/Card';

interface AlertTrendData {
  date: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
  total?: number;
}

interface AlertTrendChartProps {
  data: AlertTrendData[];
  title?: string;
  className?: string;
  height?: number;
}

const SEVERITY_COLORS = {
  low: '#3b82f6',      // Blue
  medium: '#eab308',   // Yellow
  high: '#f97316',     // Orange
  critical: '#ef4444', // Red
};

const AlertTrendChart: React.FC<AlertTrendChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
}) => {
  const { t } = useTranslation();

  // Process data
  const processedData = data.map(item => ({
    ...item,
    total: item.low + item.medium + item.high + item.critical,
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
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.critical }} />
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.critical') || 'Critical'}:</span>
              <span className="font-semibold">{data.critical}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.high }} />
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.high') || 'High'}:</span>
              <span className="font-semibold">{data.high}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.medium }} />
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.medium') || 'Medium'}:</span>
              <span className="font-semibold">{data.medium}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: SEVERITY_COLORS.low }} />
              <span className="text-gray-600 dark:text-gray-300">{t('analytics.low') || 'Low'}:</span>
              <span className="font-semibold">{data.low}</span>
            </p>
            <p className="pt-1 border-t border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400">
              {t('analytics.total') || 'Total'}: <span className="font-semibold">{data.total}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate totals by severity
  const totals = processedData.reduce(
    (acc, item) => ({
      low: acc.low + item.low,
      medium: acc.medium + item.medium,
      high: acc.high + item.high,
      critical: acc.critical + item.critical,
      total: acc.total + item.total,
    }),
    { low: 0, medium: 0, high: 0, critical: 0, total: 0 }
  );

  return (
    <Card className={`p-6 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('analytics.totalAlerts') || 'Total Alerts'}: <span className="font-semibold">{totals.total.toLocaleString()}</span>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{value}</span>
            )}
          />
          <Bar
            dataKey="critical"
            name={t('analytics.critical') || 'Critical'}
            stackId="alerts"
            fill={SEVERITY_COLORS.critical}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="high"
            name={t('analytics.high') || 'High'}
            stackId="alerts"
            fill={SEVERITY_COLORS.high}
          />
          <Bar
            dataKey="medium"
            name={t('analytics.medium') || 'Medium'}
            stackId="alerts"
            fill={SEVERITY_COLORS.medium}
          />
          <Bar
            dataKey="low"
            name={t('analytics.low') || 'Low'}
            stackId="alerts"
            fill={SEVERITY_COLORS.low}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Severity summary cards */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {Object.entries(SEVERITY_COLORS).reverse().map(([severity, color]) => (
          <div
            key={severity}
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}15` }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium capitalize" style={{ color }}>
                {t(`analytics.${severity}`) || severity}
              </span>
            </div>
            <p className="text-xl font-bold mt-1" style={{ color }}>
              {totals[severity as keyof typeof SEVERITY_COLORS]}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AlertTrendChart;
