import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const gridStroke = 'rgba(108,63,197,0.10)'
const tick = { fontSize: 10, fill: '#6b6880', fontFamily: 'inherit' }

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      {label ? <p className="mb-1 font-bold text-foreground">{label}</p> : null}
      {payload.map((entry: any) => (
        <p key={entry.dataKey ?? entry.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color ?? entry.fill }} />
          <span>{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {entry.value}
            {typeof entry.value === 'number' && entry.unit ? entry.unit : ''}
          </span>
        </p>
      ))}
    </div>
  )
}

export interface Series {
  key: string
  label: string
  color: string
  dashed?: boolean
}

function ChartLegend({ series }: { series: Series[] }) {
  if (series.length < 2) return null
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
      {series.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <span
            className="h-1 w-3 rounded-full"
            style={{ background: s.dashed ? 'transparent' : s.color, borderTop: s.dashed ? `2px dashed ${s.color}` : undefined }}
          />
          {s.label}
        </span>
      ))}
    </div>
  )
}

export function TrendArea({
  data,
  series,
  height = 220,
  yDomain = [40, 100],
  unit = '%',
  showGrid = true,
}: {
  data: Array<Record<string, string | number>>
  series: Series[]
  height?: number
  yDomain?: [number, number]
  unit?: string
  showGrid?: boolean
}) {
  return (
    <div className="w-full">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient id={`grad-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            {showGrid ? <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="3 4" /> : null}
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tick} dy={6} />
            <YAxis domain={yDomain} axisLine={false} tickLine={false} tick={tick} width={46} unit={unit} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(108,63,197,0.18)' }} />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.4}
                strokeDasharray={s.dashed ? '5 5' : undefined}
                fill={s.dashed ? 'transparent' : `url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend series={series} />
    </div>
  )
}

export function MultiLine({
  data,
  series,
  height = 220,
  yDomain = [0, 100],
  unit = '',
}: {
  data: Array<Record<string, string | number>>
  series: Series[]
  height?: number
  yDomain?: [number, number]
  unit?: string
}) {
  return (
    <div className="w-full">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="3 4" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tick} dy={6} />
            <YAxis domain={yDomain} axisLine={false} tickLine={false} tick={tick} width={46} unit={unit} />
            <Tooltip content={<ChartTooltip />} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.4}
                dot={{ r: 2.5, strokeWidth: 0, fill: s.color }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend series={series} />
    </div>
  )
}

export function GroupedBars({
  data,
  series,
  height = 200,
  unit = '',
  stacked = false,
  yDomain,
}: {
  data: Array<Record<string, string | number>>
  series: Series[]
  height?: number
  unit?: string
  stacked?: boolean
  yDomain?: [number, number]
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="3 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tick} dy={6} />
          <YAxis domain={yDomain} axisLine={false} tickLine={false} tick={tick} width={46} unit={unit} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,63,197,0.04)' }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              stackId={stacked ? 'stack' : undefined}
              radius={stacked ? 0 : [6, 6, 0, 0]}
              maxBarSize={38}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StrengthRadar({
  data,
  color = '#6c3fc5',
  height = 220,
}: {
  data: Array<{ subject: string; value: number; full?: number }>
  color?: string
  height?: number
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(108,63,197,0.14)" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b6880' }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Strength" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.18} isAnimationActive={false} />
          <Tooltip content={<ChartTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Donut({
  data,
  height = 190,
  centerValue,
  centerLabel,
}: {
  data: Array<{ name: string; value: number; color: string }>
  height?: number
  centerValue?: string
  centerLabel?: string
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="66%"
            outerRadius="92%"
            paddingAngle={3}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tracking-tight text-foreground">{centerValue}</span>
          {centerLabel ? <span className="text-[10px] font-medium text-muted-foreground">{centerLabel}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export function MiniBars({
  data,
  color = '#6c3fc5',
  height = 40,
}: {
  data: Array<{ label: string; value: number }>
  color?: string
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }} aria-hidden>
      {data.map((d) => (
        <div
          key={d.label}
          className="flex-1 rounded-t-sm transition-all"
          style={{ height: `${Math.max(8, (d.value / max) * 100)}%`, background: color, opacity: 0.3 + (d.value / max) * 0.7 }}
        />
      ))}
    </div>
  )
}
