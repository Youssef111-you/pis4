'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

const AXIS = { stroke: '#64748b', fontSize: 12 };
const GRID = '#1e293b';

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
};

/** Comparaison à barres (ex : puissance par scénario, fixe vs portable). */
export function GroupedBarChart({
  data,
  series,
  unit = 'W',
}: {
  data: Array<Record<string, any>>;
  series: { key: string; name: string; color: string }[];
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} unit={unit} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b50' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barres simples colorées (ex : puissance moyenne par type de machine). */
export function SimpleBarChart({
  data,
  unit = 'W',
}: {
  data: Array<{ name: string; value: number; color?: string }>;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} unit={unit} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b50' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? '#3b82f6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Courbe temporelle (puissance / CPU / température). */
export function TimeSeriesChart({
  data,
  lines,
}: {
  data: Array<Record<string, any>>;
  lines: { key: string; name: string; color: string; unit?: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="t" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} unit="s" />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Évolution de la consommation selon le nombre de VM (H3). */
export function VmScalingChart({ data }: { data: Array<{ vmCount: number; powerMeanW: number }> }) {
  const rows = data.map((d) => ({ name: `${d.vmCount} VM`, value: d.powerMeanW }));
  return <SimpleBarChart data={rows.map((r) => ({ ...r, color: '#8b5cf6' }))} unit="W" />;
}
