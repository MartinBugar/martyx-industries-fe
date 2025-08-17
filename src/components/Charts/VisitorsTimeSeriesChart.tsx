import React from 'react';

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
}

// A tiny, dependency-free SVG line/area chart for time-series data
const VisitorsTimeSeriesChart: React.FC<Props> = ({
  data,
  width = 560,
  height = 180,
  stroke = '#2563eb',
  fill = 'rgba(37, 99, 235, 0.15)',
  ariaLabel = 'Time series'
}) => {
  // Padding for axes
  const padding = { top: 10, right: 12, bottom: 22, left: 32 };
  const innerW = Math.max(0, width - padding.left - padding.right);
  const innerH = Math.max(0, height - padding.top - padding.bottom);

  if (!data || data.length === 0) {
    return <div style={{ color: '#6b7280', fontSize: 14 }}>No data</div>;
  }

  // Parse dates and values
  const points = data
    .map(d => ({ x: new Date(d.timestamp).getTime(), y: d.count }))
    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
    .sort((a, b) => a.x - b.x);

  const xMin = points[0].x;
  const xMax = points[points.length - 1].x || xMin + 1;
  const yMax = Math.max(1, ...points.map(p => p.y));

  const xScale = (x: number) => {
    if (xMax === xMin) return padding.left + innerW / 2;
    return padding.left + ((x - xMin) / (xMax - xMin)) * innerW;
  };
  const yScale = (y: number) => padding.top + innerH - (y / yMax) * innerH;

  // Build path for line and area
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
    .join(' ');

  const areaPath = `${linePath} L ${xScale(points[points.length - 1].x)} ${yScale(0)} L ${xScale(points[0].x)} ${yScale(0)} Z`;

  // Create simple x-axis ticks: start, middle, end
  const xTicks: number[] = [xMin, Math.round((xMin + xMax) / 2), xMax];
  const formatDate = (ms: number) => {
    const d = new Date(ms);
    // show M/D or time if same day
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // y-axis ticks: 0, mid, max
  const yTicks: number[] = [0, Math.round(yMax / 2), yMax];

  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel}>
      {/* Axes */}
      <line x1={padding.left} y1={padding.top}
            x2={padding.left} y2={padding.top + innerH}
            stroke="#e5e7eb" />
      <line x1={padding.left} y1={padding.top + innerH}
            x2={padding.left + innerW} y2={padding.top + innerH}
            stroke="#e5e7eb" />

      {/* Grid and y labels */}
      {yTicks.map((t, i) => (
        <g key={`y-${i}`}>
          <line x1={padding.left}
                y1={yScale(t)}
                x2={padding.left + innerW}
                y2={yScale(t)}
                stroke="#f3f4f6"
          />
          <text x={padding.left - 6} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fill="#6b7280" fontSize={10}>
            {t}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xTicks.map((t, i) => (
        <text key={`x-${i}`} x={xScale(t)} y={padding.top + innerH + 14} textAnchor="middle" fill="#6b7280" fontSize={10}>
          {formatDate(t)}
        </text>
      ))}

      {/* Area */}
      <path d={areaPath} fill={fill} stroke="none" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={2.5} fill={stroke} />
      ))}
    </svg>
  );
};

export default VisitorsTimeSeriesChart;
