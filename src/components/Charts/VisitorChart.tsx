import React, { useRef, useState } from 'react';

export interface VisitorChartDataPoint {
  date: string; // YYYY-MM-DD format
  count: number;
  uniqueCount: number;
}

interface Props {
  data: VisitorChartDataPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  ariaLabel?: string;
  showValueLabels?: boolean;
  showUniqueVisitors?: boolean;
}

const VisitorChart: React.FC<Props> = ({
  data,
  width = 560,
  height = 200,
  stroke = '#3B82F6', // blue
  fill = 'rgba(59, 130, 246, 0.15)',
  ariaLabel = 'Visitor chart',
  showValueLabels = true,
  showUniqueVisitors = false
}) => {
  const PAD_LEFT = 40;
  const PAD_RIGHT = 12;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 25;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Filter and validate data
  const validData = Array.isArray(data) ? data.filter(d =>
    typeof d.count === 'number' &&
    isFinite(d.count) &&
    typeof d.date === 'string'
  ) : [];

  const n = validData.length;

  // Determine which metric to show
  const values = validData.map(d => showUniqueVisitors ? d.uniqueCount : d.count);
  const maxY = n > 0 ? Math.max(...values, 1) : 1;
  const minY = 0;

  const iw = Math.max(0, width - (PAD_LEFT + PAD_RIGHT));
  const ih = Math.max(0, height - (PAD_TOP + PAD_BOTTOM));

  const xAt = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * iw) + PAD_LEFT;
  const yAt = (v: number) => {
    if (maxY === minY) return PAD_TOP + ih;
    const t = (v - minY) / (maxY - minY);
    return PAD_TOP + (1 - t) * ih;
  };

  // Build path for line chart
  let path = '';
  if (n > 0) {
    path = `M ${xAt(0)} ${yAt(values[0])}`;
    for (let i = 1; i < n; i++) {
      path += ` L ${xAt(i)} ${yAt(values[i])}`;
    }
  }

  // Area under the curve
  let area = '';
  if (n > 0) {
    area = `${path} L ${xAt(n - 1)} ${PAD_TOP + ih} L ${xAt(0)} ${PAD_TOP + ih} Z`;
  }

  // Y-axis ticks
  const yTickCount = Math.min(5, maxY + 1);
  const yTicks: number[] = [];
  for (let i = 0; i < yTickCount; i++) {
    const t = i / (yTickCount - 1);
    yTicks.push(Math.round(minY + t * (maxY - minY)));
  }

  // X-axis tick indices (show every 5th day or so)
  const xTickIndices: number[] = [];
  if (n > 0) {
    const step = Math.max(1, Math.floor(n / 6));
    for (let i = 0; i < n; i += step) {
      xTickIndices.push(i);
    }
    if (xTickIndices[xTickIndices.length - 1] !== n - 1 && n > 1) {
      xTickIndices.push(n - 1);
    }
  }

  // Date formatting
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    } catch {
      return dateStr;
    }
  };

  // Value label filtering
  const shouldShowValueAt = (i: number): boolean => {
    if (!showValueLabels) return false;
    if (n <= 10) return true;
    if (i === 0 || i === n - 1) return true;
    return i % 3 === 0;
  };

  // Hover handlers
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

  if (n === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
      >
        <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize={12}>
          No visitor data available
        </text>
      </svg>
    );
  }

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

      {/* Y-axis line */}
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + ih} stroke="#e5e7eb" strokeWidth={1} />

      {/* X-axis baseline */}
      <line x1={PAD_LEFT} y1={PAD_TOP + ih} x2={PAD_LEFT + iw} y2={PAD_TOP + ih} stroke="#e5e7eb" strokeWidth={1} />

      {/* Y-axis ticks and gridlines */}
      {yTicks.map((yv, idx) => {
        const yy = yAt(yv);
        return (
          <g key={`y-${idx}`}>
            <line x1={PAD_LEFT} y1={yy} x2={PAD_LEFT + iw} y2={yy} stroke="#f3f4f6" strokeWidth={1} />
            <text x={PAD_LEFT - 6} y={yy} textAnchor="end" dominantBaseline="central" fill="#6b7280" fontSize={10}>
              {yv}
            </text>
          </g>
        );
      })}

      {/* X-axis ticks and labels */}
      {xTickIndices.map((i, idx) => {
        const x = xAt(i);
        return (
          <g key={`x-${idx}`}>
            <line x1={x} y1={PAD_TOP + ih} x2={x} y2={PAD_TOP + ih + 4} stroke="#9ca3af" strokeWidth={1} />
            <text x={x} y={PAD_TOP + ih + 16} textAnchor="middle" fill="#6b7280" fontSize={10}>
              {formatDate(validData[i].date)}
            </text>
          </g>
        );
      })}

      {/* Area */}
      <path d={area} fill={fill} stroke="none" />

      {/* Line */}
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points and value labels */}
      {validData.map((d, i) => {
        const cx = xAt(i);
        const cy = yAt(values[i]);
        return (
          <g key={`pt-${i}`}>
            <circle cx={cx} cy={cy} r={2.5} fill={stroke} />
            {shouldShowValueAt(i) && (
              <text x={cx} y={cy - 6} textAnchor="middle" fill="#111827" fontSize={10}>
                {values[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hoverIdx !== null && (() => {
        const i = hoverIdx;
        const hx = xAt(i);
        const hy = yAt(values[i]);
        const data = validData[i];
        const tip = `${formatDate(data.date)}: ${values[i]} ${showUniqueVisitors ? 'unique' : 'total'} visitors`;
        const tipWidth = Math.max(80, tip.length * 6);
        const tx = Math.min(PAD_LEFT + iw - tipWidth - 8, Math.max(PAD_LEFT + 8, hx + 8));
        const ty = Math.max(PAD_TOP + 12, hy - 20);

        return (
          <g key="hover" pointerEvents="none">
            <line x1={hx} y1={PAD_TOP} x2={hx} y2={PAD_TOP + ih} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,3" />
            <circle cx={hx} cy={hy} r={4} fill="#ffffff" stroke={stroke} strokeWidth={2} />
            <rect x={tx - 6} y={ty - 10} width={tipWidth + 12} height={20} rx={4} fill="#111827" opacity={0.9} />
            <text x={tx} y={ty} fill="#ffffff" fontSize={10} dominantBaseline="central">{tip}</text>
          </g>
        );
      })()}

      {/* Interactive overlay */}
      <rect
        x={PAD_LEFT}
        y={PAD_TOP}
        width={iw}
        height={ih}
        fill="transparent"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </svg>
  );
};

export default VisitorChart;