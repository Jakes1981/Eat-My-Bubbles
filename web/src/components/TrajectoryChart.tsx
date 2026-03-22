'use client';

import {
  ComposedChart,
  Line,
  Scatter,
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
  /** Individual race results as scatter points (fractional ages for precision) */
  allRaces?: Array<{ age: number; timeSeconds: number; date?: string; city?: string }>;
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
  allRaces = [],
  worldTop3,
}: TrajectoryChartProps) {
  // Build unified data for the line chart (age-keyed)
  const ageMap = new Map<number, Record<string, number | null>>();

  // Collect all integer ages for line data
  const allAges = new Set<number>();
  swimmerTrajectory.forEach(p => allAges.add(p.age));
  worldTop3.forEach(w => w.trajectory.forEach(p => allAges.add(p.age)));

  const minAge = 12;
  const maxAge = 35;

  for (let age = minAge; age <= maxAge; age++) {
    ageMap.set(age, { age });
  }

  // Add swimmer trajectory (best time per year)
  swimmerTrajectory.forEach(p => {
    const row = ageMap.get(p.age);
    if (row) row[swimmerName] = p.timeSeconds;
  });

  // Add world top 3 data
  worldTop3.forEach(w => {
    w.trajectory.forEach(p => {
      const row = ageMap.get(p.age);
      if (row) row[w.name] = p.timeSeconds;
    });
  });

  const lineData = Array.from(ageMap.values()).sort(
    (a, b) => (a.age as number) - (b.age as number)
  );

  // Scatter data for individual races
  const scatterData = allRaces.map(r => ({
    age: Math.round(r.age * 100) / 100,
    time: r.timeSeconds,
    date: r.date || '',
    city: r.city || '',
  }));

  // Calculate Y domain
  const allTimes: number[] = [];
  swimmerTrajectory.forEach(p => allTimes.push(p.timeSeconds));
  allRaces.forEach(p => allTimes.push(p.timeSeconds));
  worldTop3.forEach(w => w.trajectory.forEach(p => allTimes.push(p.timeSeconds)));

  if (allTimes.length === 0) return <div className="text-[#64748B] text-center py-12">No data available</div>;

  const minTime = Math.floor(Math.min(...allTimes) * 0.95);
  const maxTime = Math.ceil(Math.max(...allTimes) * 1.05);

  // Custom tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-[#111D33] border border-[#1E3050] rounded-lg p-3 shadow-xl max-w-[200px]">
        {payload.map((entry: any, index: number) => {
          const p = entry.payload || {};
          return (
            <div key={index} className="mb-1 last:mb-0">
              <p className="text-sm font-medium" style={{ color: entry.color }}>
                {entry.name === 'time' ? swimmerName : entry.name}: {formatTime(entry.value)}
              </p>
              {p.date ? (
                <p className="text-[10px] text-[#64748B]">{String(p.date)} · {String(p.city)}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-[340px] sm:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
          <XAxis
            dataKey="age"
            type="number"
            domain={[minAge, maxAge]}
            stroke="#64748B"
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickLine={{ stroke: '#1E3050' }}
            ticks={Array.from({ length: maxAge - minAge + 1 }, (_, i) => minAge + i)}
            tickFormatter={(val: number) => String(Math.round(val))}
            label={{ value: 'Age', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 12 }}
            allowDuplicatedCategory={false}
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
          <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8', paddingTop: 8 }} />

          {/* Individual race results as scatter dots */}
          {scatterData.length > 0 && (
            <Scatter
              name={`${swimmerName} (all races)`}
              data={scatterData}
              dataKey="time"
              fill="#06B6D4"
              fillOpacity={0.3}
              r={3}
            />
          )}

          {/* Swimmer trajectory line (best per year) */}
          <Line
            data={lineData}
            type="monotone"
            dataKey={swimmerName}
            stroke="#06B6D4"
            strokeWidth={3}
            dot={{ fill: '#06B6D4', r: 5, strokeWidth: 2, stroke: '#0A1628' }}
            activeDot={{ r: 7, fill: '#22D3EE' }}
            connectNulls
          />

          {/* World top 3 lines */}
          {worldTop3.map((w, i) => (
            <Line
              key={w.name}
              data={lineData}
              type="monotone"
              dataKey={w.name}
              stroke={w.color}
              strokeWidth={2}
              strokeDasharray={i === 0 ? undefined : '6 3'}
              dot={{ fill: w.color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
