"use client";

import type { GenreStat, MonthBucket } from "@/lib/types";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const PALETTE = [
  "#1ed760",
  "#8b5cf6",
  "#ec4899",
  "#4fc3f7",
  "#d2ff5e",
  "#ff7b54",
  "#f9c74f",
  "#2dd4bf",
  "#fb7185",
  "#a78bfa",
];

function CardTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string }[];
  label?: React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  const title = label ?? payload[0].name;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold capitalize">{title}</p>
      <p className="text-muted">{payload[0].value} songs</p>
    </div>
  );
}

export function MonthlyTimeline({ data }: { data: MonthBucket[] }) {
  // Only label a handful of months so the axis stays readable.
  const step = Math.max(1, Math.ceil(data.length / 8));
  const ticks = data.filter((_, i) => i % step === 0).map((d) => d.month);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ed760" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#1ed760" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          ticks={ticks}
          tickFormatter={(m: string) =>
            data.find((d) => d.month === m)?.label ?? m
          }
          tick={{ fill: "#b3b3b3", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#b3b3b3", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          content={<CardTooltip />}
          cursor={{ stroke: "#ffffff20" }}
          labelFormatter={(m) =>
            data.find((d) => d.month === m)?.label ?? String(m)
          }
        />
        <Area
          type="monotone"
          dataKey="count"
          name="songs"
          stroke="#1ed760"
          strokeWidth={2}
          fill="url(#fillGreen)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GenreDonut({ data }: { data: GenreStat[] }) {
  const top = data.slice(0, 8);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={top}
              dataKey="count"
              nameKey="genre"
              innerRadius={48}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {top.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CardTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5">
        {top.map((g, i) => (
          <li key={g.genre} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="flex-1 capitalize">{g.genre}</span>
            <span className="text-muted">{g.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
