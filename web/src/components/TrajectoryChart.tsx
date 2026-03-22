'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatTime } from '@/lib/swim-utils';

interface TrajectoryChartProps {
  swimmerName: string;
  swimmerTrajectory: Array<{ age: number; timeSeconds: number }>;
  worldTop3: Array<{
    name: string;
    country: string;
    trajectory: Array<{ age: number; timeSeconds: number }>;
    color: string;
  }>;
}

export default function TrajectoryChart({
  swimmerName,
  swimmerTrajectory,
  worldTop3,
}: TrajectoryChartProps) {
  // Merge all data into unified age-keyed structure for Recharts
  const ageMap = new Map<number, Record<string, number | null>>();

  // Collect all ages
  const allAges = new Set<number>();
  swimmerTrajectory.forEach((p) => allAges.add(p.age));
  worldTop3.forEach((w) => w.trajectory.forEach((p) => allAges.add(p.age)));

  // Build data array
  const sortedAges = Array.from(allAges).sort((a, b) => a - b);
  const minAge = Math.min(12, sortedAges[0] ?? 12);
  const maxAge = Math.max(sortedAges[sortedAges.length - 1] ?? 18, 18);

  // Fill in all ages from min to max
  for (let age = minAge; age <= maxAge; age++) {
    ageMap.set(age, { age });
  }

  // Add swimmer data
  swimmerTrajectory.forEach((p) => {
    const row = ageMap.get(p.age);
    if (row) row[swimmerName] = p.timeSeconds;
  });

  // Add world top 3 data
  worldTop3.forEach((w) => {
    w.trajectory.forEach((p) => {
      const row = ageMap.get(p.age);
      if (row) row[w.name] = p.timeSeconds;
    });
  });

  const data = Array.from(ageMap.values()).sort(
    (a, b) => (a.age as number) - (b.age as number)
  );

  // Calculate Y domain (reversed: lower times at top)
  let allTimes: number[] = [];
  swimmerTrajectory.forEach((p) => allTimes.push(p.timeSeconds));
  worldTop3.forEach((w) => w.trajectory.forEach((p) => allTimes.push(p.timeSeconds)));

  const minTime = Math.floor(Math.min(...allTimes) - 2);
  const maxTime = Math.ceil(Math.max(...allTimes) + 2);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-[#111D33] border border-[#1E3050] rounded-lg p-3 shadow-xl">
        <p className="text-xs text-[#64748B] mb-1">Age {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatTime(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-[300px] sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
          <XAxis
            dataKey="age"
            stroke="#64748B"
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickLine={{ stroke: '#1E3050' }}
            label={{ value: 'Age', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 12 }}
          />
          <YAxis
            reversed
            domain={[minTime, maxTime]}
            stroke="#64748B"
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={{ stroke: '#1E3050' }}
            tickFormatter={(val: number) => formatTime(val)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#94A3B8', paddingTop: 8 }}
          />

          {/* Swimmer line - bold */}
          <Line
            type="monotone"
            dataKey={swimmerName}
            stroke="#06B6D4"
            strokeWidth={3}
            dot={{ fill: '#06B6D4', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#22D3EE' }}
            connectNulls
          />

          {/* World top 3 lines */}
          {worldTop3.map((w, i) => (
            <Line
              key={w.name}
              type="monotone"
              dataKey={w.name}
              stroke={w.color}
              strokeWidth={i === 0 ? 2 : 2}
              strokeDasharray={i === 0 ? undefined : '6 3'}
              dot={{ fill: w.color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
