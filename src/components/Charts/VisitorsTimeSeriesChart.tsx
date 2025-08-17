import React, { useRef, useState } from 'react';

export type TimeSeriesPoint = {
  timestamp: string; // ISO date-time string
  count: number;     // value for the bucket
};

interface Props {
  data: TimeSeriesPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  ariaLabel?: string;
  // New, optional toggles (defaults enable better readability for admin dashboard)
  showAxes?: boolean;
  showValueLabels?: boolean;
  xTickCount?: number; // desired number of x ticks (including ends)
  yTickCount?: number; // desired number of y ticks (including 0 & max)
}

// A small, dependency-free, accessible SVG line/area chart for minimalistic dashboards.
// Improvements:
// - Adds clear axes with ticks and labels.
// - Adds point markers and value labels (decluttered when many points).
// - Keeps accessibility and zero-dependency footprint.
const VisitorsTimeSeriesChart: React.FC<Props> = ({
  data,
  width = 560,
  height = 200,
  stroke = '#3b82f6', // blue-500
  fill = 'rgba(59, 130, 246, 0.15)', // blue-500 @ 15%
  ariaLabel = 'Time series chart',
  showAxes = true,
  showValueLabels = true,
  xTickCount = 6,
  yTickCount = 4,
}) => {
  // Padding expanded on the left to fit Y-axis labels.
  const PAD_LEFT = 36;
  const PAD_RIGHT = 12;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 20; // extra to fit X-axis labels

  // Hover interactivity
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Normalize and guard data
  const safe = Array.isArray(data) ? data.filter(d => typeof d.count === 'number' && isFinite(d.count)) : [];
  const n = safe.length;

  // Compute min/max
  const maxY = n > 0 ? Math.max(...safe.map(d => d.count), 0) : 0;
  const minY = 0; // start at 0 for better readability on metrics

  const iw = Math.max(0, width - (PAD_LEFT + PAD_RIGHT));
  const ih = Math.max(0, height - (PAD_TOP + PAD_BOTTOM));

  const xAt = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * iw) + PAD_LEFT;
  const yAt = (v: number) => {
    if (maxY === minY) return PAD_TOP + ih; // flat line at bottom if no variance
    const t = (v - minY) / (maxY - minY);
    return PAD_TOP + (1 - t) * ih;
  };

  // Build path
  let path = '';
  if (n > 0) {
    path = `M ${xAt(0)} ${yAt(safe[0].count)}`;
    for (let i = 1; i < n; i++) {
      path += ` L ${xAt(i)} ${yAt(safe[i].count)}`;
    }
  }

  // Area under the curve
  let area = '';
  if (n > 0) {
    area = `${path} L ${xAt(n - 1)} ${PAD_TOP + ih} L ${xAt(0)} ${PAD_TOP + ih} Z`;
  }

  // Y-axis ticks (0..maxY)
  const effectiveYTicks = Math.max(2, Math.min(8, yTickCount));
  const yTicks: number[] = [];
  if (maxY === 0) {
    yTicks.push(0);
  } else {
    for (let i = 0; i < effectiveYTicks; i++) {
      const t = i / (effectiveYTicks - 1);
      // round to nearest integer since counts are integers
      yTicks.push(Math.round(minY + t * (maxY - minY)));
    }
  }

  // X-axis tick indices across data points
  const desiredXTicks = Math.max(2, Math.min(10, xTickCount));
  const xTickIndices: number[] = [];
  if (n > 0) {
    if (n <= desiredXTicks) {
      for (let i = 0; i < n; i++) xTickIndices.push(i);
    } else {
      const step = Math.max(1, Math.floor((n - 1) / (desiredXTicks - 1)));
      for (let i = 0; i < n; i += step) xTickIndices.push(i);
      if (xTickIndices[xTickIndices.length - 1] !== n - 1) xTickIndices.push(n - 1);
    }
  }

  // Label formatting helpers
  const formatX = (iso: string): string => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  };

  const formatY = (v: number): string => v.toLocaleString(undefined);

  // Value label thinning to avoid clutter
  const shouldShowValueAt = (i: number): boolean => {
    if (!showValueLabels) return false;
    if (n <= 12) return true;
    // Show every 3rd point and always first & last
    if (i === 0 || i === n - 1) return true;
    return i % 3 === 0;
  };

  // Hover handlers (after scales are defined)
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (!svgRef.current || n === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const clampedX = Math.max(PAD_LEFT, Math.min(PAD_LEFT + iw, px));

    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const dx = Math.abs(clampedX - xAt(i));
      if (dx < minDist) {
        minDist = dx;
        nearest = i;
      }
    }
    setHoverIdx(nearest);
  };

  const handleMouseLeave = () => setHoverIdx(null);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block' }}
    >
      {/* Background */}
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />

      {/* Axes and grid */}
      {showAxes && (
        <g>
          {/* Y-axis line */}
          <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + ih} stroke="#e5e7eb" strokeWidth={1} />
          {/* X-axis baseline */}
          <line x1={PAD_LEFT} y1={PAD_TOP + ih} x2={PAD_LEFT + iw} y2={PAD_TOP + ih} stroke="#e5e7eb" strokeWidth={1} />

          {/* Y ticks and gridlines */}
          {yTicks.map((yv, idx) => {
            const yy = yAt(yv);
            return (
              <g key={`y-${idx}`}>
                <line x1={PAD_LEFT} y1={yy} x2={PAD_LEFT + iw} y2={yy} stroke="#f3f4f6" strokeWidth={1} />
                <text x={PAD_LEFT - 6} y={yy} textAnchor="end" dominantBaseline="central" fill="#6b7280" fontSize={10}>
                  {formatY(yv)}
                </text>
              </g>
            );
          })}

          {/* X ticks and labels */}
          {xTickIndices.map((i, idx) => {
            const x = xAt(i);
            return (
              <g key={`x-${idx}`}>
                <line x1={x} y1={PAD_TOP + ih} x2={x} y2={PAD_TOP + ih + 4} stroke="#9ca3af" strokeWidth={1} />
                <text x={x} y={PAD_TOP + ih + 14} textAnchor="middle" fill="#6b7280" fontSize={10}>
                  {formatX(safe[i].timestamp)}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Empty state */}
      {n === 0 ? (
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize={12}>
          No data
        </text>
      ) : (
        <g>
          {/* Area */}
          <path d={area} fill={fill} stroke="none" />
          {/* Line */}
          <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Points & value labels */}
          {safe.map((d, i) => {
            const cx = xAt(i);
            const cy = yAt(d.count);
            return (
              <g key={`pt-${i}`}>
                <circle cx={cx} cy={cy} r={2.25} fill={stroke} />
                {shouldShowValueAt(i) && (
                  <text x={cx} y={cy - 6} textAnchor="middle" fill="#111827" fontSize={10}>
                    {d.count}
                  </text>
                )}
              </g>
            );
          })}

          {hoverIdx !== null && (() => {
            const i = hoverIdx as number;
            const hx = xAt(i);
            const hy = yAt(safe[i].count);
            const tip = `${formatX(safe[i].timestamp)}: ${safe[i].count.toLocaleString(undefined)}`;
            const w = Math.max(40, Math.round(tip.length * 6.5));
            const tx = Math.min(PAD_LEFT + iw - w - 8, Math.max(PAD_LEFT + 8, hx + 8));
            const ty = Math.max(PAD_TOP + 12, hy - 20);
            return (
              <g key="hover" pointerEvents="none">
                <line x1={hx} y1={PAD_TOP} x2={hx} y2={PAD_TOP + ih} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,3" />
                <circle cx={hx} cy={hy} r={3.5} fill="#ffffff" stroke={stroke} strokeWidth={2} />
                <g>
                  <rect x={tx - 6} y={ty - 10} width={w + 12} height={20} rx={4} fill="#111827" opacity={0.9} />
                  <text x={tx} y={ty} fill="#ffffff" fontSize={10} dominantBaseline="central">{tip}</text>
                </g>
              </g>
            );
          })()}
        </g>
      )}
      <rect x={PAD_LEFT} y={PAD_TOP} width={iw} height={ih} fill="transparent" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
    </svg>
  );
};

export default VisitorsTimeSeriesChart;
