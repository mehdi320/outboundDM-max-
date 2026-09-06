import { useMemo } from "react";
import type { Log, Script } from "@shared/types";

interface Props {
  scripts: Script[];
  logs: Log[];
}

const COLORS = ["#6366f1", "#22d3ee", "#34d399", "#f87171", "#a78bfa", "#fb923c", "#e879f9"];

function isoWeekKey(dateStr: string): { key: string; sortValue: number } {
  const d = new Date(dateStr + "T00:00:00Z");
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return {
    key: `${target.getUTCFullYear()}-S${String(week).padStart(2, "0")}`,
    sortValue: target.getUTCFullYear() * 100 + week,
  };
}

interface Series {
  script: Script;
  color: string;
  points: { x: number; y: number; tauxReponse: number; envoyes: number }[];
}

export function TrendChart({ scripts, logs }: Props) {
  const { weekKeys, series } = useMemo(() => {
    const weekMap = new Map<string, number>();
    for (const l of logs) {
      const { key, sortValue } = isoWeekKey(l.date);
      weekMap.set(key, sortValue);
    }
    const sortedWeeks = [...weekMap.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => key);

    const series: Series[] = scripts.map((script, i) => {
      const byWeek = new Map<string, { envoyes: number; reponses: number }>();
      for (const l of logs.filter((l) => l.script_id === script.id)) {
        const { key } = isoWeekKey(l.date);
        const acc = byWeek.get(key) ?? { envoyes: 0, reponses: 0 };
        acc.envoyes += l.envoye ? 1 : 0;
        acc.reponses += l.reponse ? 1 : 0;
        byWeek.set(key, acc);
      }
      const points = sortedWeeks
        .map((week, idx) => {
          const data = byWeek.get(week);
          if (!data || data.envoyes === 0) return null;
          return {
            x: idx,
            y: (data.reponses / data.envoyes) * 100,
            tauxReponse: (data.reponses / data.envoyes) * 100,
            envoyes: data.envoyes,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
      return { script, color: COLORS[i % COLORS.length], points };
    });

    return { weekKeys: sortedWeeks, series: series.filter((s) => s.points.length > 0) };
  }, [scripts, logs]);

  if (weekKeys.length < 2 || series.length === 0) {
    return (
      <div className="bg-base-850 border border-base-700 rounded-lg p-6 text-center text-base-400 text-sm">
        Pas encore assez de données réparties dans le temps pour afficher une tendance
        (minimum 2 semaines avec des entrées).
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const padding = { top: 12, right: 12, bottom: 24, left: 32 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const xStep = weekKeys.length > 1 ? plotW / (weekKeys.length - 1) : 0;

  function toXY(x: number, y: number) {
    return {
      px: padding.left + x * xStep,
      py: padding.top + plotH - (Math.min(100, y) / 100) * plotH,
    };
  }

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide mb-3">
        Tendance du taux de réponse (par semaine)
      </h2>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 25, 50, 75, 100].map((v) => {
          const { py } = toXY(0, v);
          return (
            <g key={v}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={py}
                y2={py}
                stroke="#212429"
                strokeWidth={1}
              />
              <text x={4} y={py + 3} fontSize={9} fill="#5c6270">
                {v}%
              </text>
            </g>
          );
        })}

        {series.map((s) => {
          const pathD = s.points
            .map((p, i) => {
              const { px, py } = toXY(p.x, p.y);
              return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
            })
            .join(" ");
          return (
            <g key={s.script.id}>
              <path d={pathD} fill="none" stroke={s.color} strokeWidth={2} />
              {s.points.map((p) => {
                const { px, py } = toXY(p.x, p.y);
                return (
                  <circle key={p.x} cx={px} cy={py} r={2.5} fill={s.color}>
                    <title>
                      {s.script.label} — {weekKeys[p.x]} : {p.tauxReponse.toFixed(1)}% ({p.envoyes} envoyés)
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s) => (
          <div key={s.script.id} className="flex items-center gap-1.5 text-xs text-base-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.script.label}
          </div>
        ))}
      </div>
    </div>
  );
}
