import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface PricePoint {
  timestamp: string | Date;
  high?: number | null;
  low?: number | null;
}

interface PriceHistoryChartProps {
  data: PricePoint[];
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const chartData = useMemo(
    () =>
      data
        .slice()
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime()
        )
        .map((p) => ({
          timestamp: new Date(p.timestamp).getTime(),
          buy: p.low ?? null,
          sell: p.high ?? null,
        })),
    [data]
  );

  const formatTime = (value: number) => {
    const d = new Date(value);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const hasBuy = chartData.some((p) => p.buy !== null);
  const hasSell = chartData.some((p) => p.sell !== null);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatTime}
        />
        <YAxis tick={{ fontSize: 12 }} width={80} domain={['dataMin', 'dataMax']} />
        <Tooltip
          labelFormatter={(label) => new Date(label).toLocaleString()}
        />
        {hasSell && (
          <Line
            type="monotone"
            dataKey="sell"
            stroke="#ef4444"
            dot={false}
          />
        )}
        {hasBuy && (
          <Line
            type="monotone"
            dataKey="buy"
            stroke="#22c55e"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
