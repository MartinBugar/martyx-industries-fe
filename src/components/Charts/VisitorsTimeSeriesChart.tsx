import React from 'react';

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
}

// A small, dependency-free, accessible SVG line/area chart for minimalistic dashboards.
// Best practices used:
// - Accessible <svg> with aria-label and role="img".
// - Responsive to provided width/height; internal padding for crisp axes-free layout.
// - Handles empty data safely, renders a subtle placeholder.
const VisitorsTimeSeriesChart: React.FC<Props> = ({
  data,
  width = 560,
  height = 200,
  stroke = '#3b82f6', // blue-500
  fill = 'rgba(59, 130, 246, 0.15)', // blue-500 @ 15%
  ariaLabel = 'Time series chart',
}) => {
  const PAD_X = 12;
  const PAD_Y = 8;

  // Normalize and guard data
  const safe = Array.isArray(data) ? data.filter(d => typeof d.count === 'number' && isFinite(d.count)) : [];
  const n = safe.length;

  // Compute min/max
  const maxY = n > 0 ? Math.max(...safe.map(d => d.count), 0) : 0;
  const minY = 0; // start at 0 for better readability on metrics

  const iw = Math.max(0, width - PAD_X * 2);
  const ih = Math.max(0, height - PAD_Y * 2);

  const xAt = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * iw) + PAD_X;
  const yAt = (v: number) => {
    if (maxY === minY) return PAD_Y + ih; // flat line at bottom if no variance
    const t = (v - minY) / (maxY - minY);
    return PAD_Y + (1 - t) * ih;
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
    area = `${path} L ${xAt(n - 1)} ${PAD_Y + ih} L ${xAt(0)} ${PAD_Y + ih} Z`;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block' }}
    >
      {/* Background */}
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />

      {/* Subtle baseline grid (optional, minimal) */}
      <line x1={PAD_X} y1={PAD_Y + ih} x2={PAD_X + iw} y2={PAD_Y + ih} stroke="#e5e7eb" strokeWidth={1} />

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
        </g>
      )}
    </svg>
  );
};

export default VisitorsTimeSeriesChart;
