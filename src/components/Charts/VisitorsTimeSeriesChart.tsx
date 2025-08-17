import React, { useMemo, useRef, useState, useCallback } from 'react';

interface TimeSeriesPoint {
  timestamp: string;
  count: number;
}

interface Props {
  data: TimeSeriesPoint[];
  width?: number; // px
  height?: number; // px
  stroke?: string;
  fill?: string;
  ariaLabel?: string;
  smooth?: boolean; // smooth the line
  showPoints?: boolean; // show dots on all points
  locale?: string; // for date formatting
  valueFormatter?: (v: number) => string;
  dateFormatter?: (d: Date) => string;
}

// Utility: create a nice, rounded max and ticks for Y axis
function niceTicks(maxValue: number, maxTicks = 5) {
  const niceNum = (range: number, round: boolean) => {
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3) niceFraction = 2;
      else if (fraction < 7) niceFraction = 5;
      else niceFraction = 10;
    } else {
      if (fraction <= 1) niceFraction = 1;
      else if (fraction <= 2) niceFraction = 2;
      else if (fraction <= 5) niceFraction = 5;
      else niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
  };

  const min = 0;
  const max = Math.max(1, maxValue);
  const range = niceNum(max - min, false);
  const tickSpacing = niceNum(range / (maxTicks - 1), true);
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;

  const ticks: number[] = [];
  for (let t = min; t <= niceMax + 1e-9; t += tickSpacing) {
    ticks.push(Math.round(t * 100000) / 100000);
  }
  return { niceMax, ticks };
}

// Build a smooth (Catmull-Rom to cubic Bezier) path for the line
function buildSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const tension = 0.5; // smoothness factor
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

const VisitorsTimeSeriesChart: React.FC<Props> = ({
  data,
  width = 560,
  height = 220,
  stroke = '#2563eb',
  fill = 'rgba(37, 99, 235, 0.15)',
  ariaLabel = 'Time series',
  smooth = true,
  showPoints = false,
  locale,
  valueFormatter,
  dateFormatter,
}) => {
  // Layout paddings
  const padding = { top: 12, right: 16, bottom: 28, left: 44 };
  const innerW = Math.max(0, width - padding.left - padding.right);
  const innerH = Math.max(0, height - padding.top - padding.bottom);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const fmtValue = useCallback((v: number) => {
    if (valueFormatter) return valueFormatter(v);
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v);
  }, [valueFormatter]);

  const fmtDate = useCallback((d: Date) => {
    if (dateFormatter) return dateFormatter(d);
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(d);
  }, [dateFormatter, locale]);

  const points = useMemo(() => {
    if (!data || data.length === 0) return [] as { x: number; y: number; d: Date }[];
    return data
      .map(d => ({ x: new Date(d.timestamp).getTime(), y: d.count, d: new Date(d.timestamp) }))
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x);
  }, [data]);

  if (!points || points.length === 0) {
    return <div style={{ color: '#6b7280', fontSize: 14 }}>No data</div>;
  }

  const xMin = points[0].x;
  const xMax = points[points.length - 1].x || xMin + 1;
  const yRawMax = Math.max(0, ...points.map(p => p.y));
  const { niceMax, ticks: yTicks } = niceTicks(yRawMax, Math.max(3, Math.min(6, Math.floor(innerH / 36))));

  const xScale = (x: number) => {
    if (xMax === xMin) return padding.left + innerW / 2;
    return padding.left + ((x - xMin) / (xMax - xMin)) * innerW;
  };
  const yScale = (y: number) => padding.top + innerH - (y / niceMax) * innerH;

  const scaled = points.map(p => ({ x: xScale(p.x), y: yScale(p.y) }));

  const linePath = smooth && scaled.length > 2
    ? buildSmoothPath(scaled)
    : scaled.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath = `${linePath} L ${xScale(points[points.length - 1].x)} ${yScale(0)} L ${xScale(points[0].x)} ${yScale(0)} Z`;

  // Choose ~6 x ticks or based on width
  const desiredXTicks = Math.max(3, Math.min(8, Math.floor(innerW / 90)));
  const step = Math.max(1, Math.floor(points.length / desiredXTicks));
  const xTickIdxs: number[] = [];
  for (let i = 0; i < points.length; i += step) xTickIdxs.push(i);
  if (xTickIdxs[xTickIdxs.length - 1] !== points.length - 1) xTickIdxs.push(points.length - 1);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // find nearest by x among scaled points
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < scaled.length; i++) {
      const dx = Math.abs(scaled[i].x - x);
      if (dx < bestDist) {
        bestDist = dx;
        bestIdx = i;
      }
    }
    setHoverIdx(bestIdx);
  };

  const onMouseLeave = () => setHoverIdx(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (hoverIdx === null) {
      if (points.length > 0) setHoverIdx(points.length - 1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      setHoverIdx(Math.max(0, hoverIdx - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setHoverIdx(Math.min(points.length - 1, hoverIdx + 1));
      e.preventDefault();
    }
  };

  const hover = hoverIdx != null ? {
    idx: hoverIdx,
    p: points[hoverIdx],
    sx: scaled[hoverIdx]?.x ?? 0,
    sy: scaled[hoverIdx]?.y ?? 0,
  } : null;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width, height, userSelect: 'none' }}
      role="img"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <svg width={width} height={height}>
        {/* Axes */}
        <line x1={padding.left} y1={padding.top}
              x2={padding.left} y2={padding.top + innerH}
              stroke="#e5e7eb" />
        <line x1={padding.left} y1={padding.top + innerH}
              x2={padding.left + innerW} y2={padding.top + innerH}
              stroke="#e5e7eb" />

        {/* Grid + Y ticks */}
        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line x1={padding.left}
                  y1={yScale(t)}
                  x2={padding.left + innerW}
                  y2={yScale(t)}
                  stroke="#e5e7eb"
                  strokeDasharray="3 4"
            />
            <text x={padding.left - 8}
                  y={yScale(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#6b7280"
                  fontSize={11}
            >
              {fmtValue(t)}
            </text>
          </g>
        ))}

        {/* X ticks */}
        {xTickIdxs.map((idx, i) => (
          <g key={`x-${i}`}>
            <line x1={scaled[idx].x}
                  y1={padding.top + innerH}
                  x2={scaled[idx].x}
                  y2={padding.top + innerH + 4}
                  stroke="#9ca3af" />
            <text x={scaled[idx].x}
                  y={padding.top + innerH + 16}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize={11}
            >
              {fmtDate(points[idx].d)}
            </text>
          </g>
        ))}

        {/* Area gradient */}
        <defs>
          <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area */}
        <path d={areaPath} fill={fill || 'url(#visitorsGradient)'} stroke="none" />
        {/* Line */}
        <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Hover crosshair and focus point */}
        {hover && (
          <g>
            <line x1={hover.sx} y1={padding.top}
                  x2={hover.sx} y2={padding.top + innerH}
                  stroke="#9ca3af" strokeDasharray="3 4" />
            <circle cx={hover.sx} cy={hover.sy} r={4.5} fill="#fff" stroke={stroke} strokeWidth={2} />
          </g>
        )}

        {/* Optional dots for all points */}
        {showPoints && scaled.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={stroke} />
        ))}

        {/* Interaction overlay */}
        <rect
          x={padding.left}
          y={padding.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        />
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(hover.sx + 8, padding.left), (width as number) - 160),
            top: Math.max(hover.sy - 40, 4),
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            padding: '8px 10px',
            fontSize: 12,
            lineHeight: 1.3,
            pointerEvents: 'none',
            minWidth: 120,
          }}
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: stroke }} />
            <strong>{fmtValue(hover.p.y)}</strong>
          </div>
          <div style={{ color: '#6b7280' }}>{fmtDate(hover.p.d)}</div>
        </div>
      )}
    </div>
  );
};

export default VisitorsTimeSeriesChart;
