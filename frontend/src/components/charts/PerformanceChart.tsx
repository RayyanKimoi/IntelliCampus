'use client';

import React from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendPoint {
  date: string;
  mastery: number;
  xp?: number;
}

interface PerformanceChartProps {
  data: TrendPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name}: <strong>{entry.value}{entry.name === 'Mastery %' ? '%' : ' XP'}</strong>
        </p>
      ))}
    </div>
  );
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const hasXp = data.some((d) => (d.xp ?? 0) > 0);
  const hasMastery = data.some((d) => (d.mastery ?? 0) > 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 5, right: hasXp ? 40 : 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="masteryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickLine={false}
        />
        <YAxis
          yAxisId="mastery"
          tick={{ fontSize: 11 }}
          domain={[0, 100]}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        {hasXp && (
          <YAxis
            yAxisId="xp"
            orientation="right"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}`}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          iconType="circle"
          iconSize={8}
        />
        {hasXp && (
          <Bar
            yAxisId="xp"
            dataKey="xp"
            name="XP Earned"
            fill="hsl(var(--primary))"
            opacity={0.18}
            radius={[3, 3, 0, 0]}
          />
        )}
        {(hasMastery || !hasXp) && (
          <Area
            yAxisId="mastery"
            type="monotone"
            dataKey="mastery"
            stroke="hsl(var(--primary))"
            fill="url(#masteryGradient)"
            strokeWidth={2}
            name="Mastery %"
            dot={false}
            activeDot={{ r: 5 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
