import React, { useId } from "react";

interface SparklineProps {
  data: number[];
  strokeColor?: string;
  gradientColor?: string;
  min?: number;
  max?: number;
  unit?: string;
  showMinMax?: boolean;
  className?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  strokeColor = "#2dd4bf",
  gradientColor = "#2dd4bf",
  min = 0,
  max = 100,
  unit = "",
  showMinMax = true,
  className = "h-20",
  height = 70,
}) => {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return <div className={`${className} w-full`} />;
  }

  const width = 300;
  const stepX = width / (data.length - 1);
  const range = max - min || 1;

  // Calculate points
  const points = data.map((val, idx) => {
    const clamped = Math.min(Math.max(val, min), max);
    // Invert Y coordinate with padding
    const y = height - ((clamped - min) / range) * (height - 18) - 9;
    const x = idx * stepX;
    return { x, y };
  });

  // Construct smooth quadratic bezier path
  let pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    const cpX = (pCurrent.x + pNext.x) / 2;
    const cpY = (pCurrent.y + pNext.y) / 2;
    pathD += ` Q ${pCurrent.x.toFixed(1)},${pCurrent.y.toFixed(1)} ${cpX.toFixed(1)},${cpY.toFixed(1)}`;
  }
  const lastPoint = points[points.length - 1];
  pathD += ` T ${lastPoint.x.toFixed(1)},${lastPoint.y.toFixed(1)}`;

  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className={`${className} w-full relative flex items-end select-none overflow-hidden rounded-md bg-zinc-950/20 border border-zinc-800/40`}>
      {/* Dynamic Max/Min scale watermarks on right edge */}
      {showMinMax && (
        <div className="absolute right-1.5 inset-y-1 flex flex-col justify-between items-end pointer-events-none z-10 text-[9px] font-mono text-zinc-400 font-medium">
          <span>
            {max}
            {unit}
          </span>
          <span>
            {min}
            {unit}
          </span>
        </div>
      )}

      <svg
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={gradientColor} stopOpacity={0.35} />
            <stop offset="65%" stopColor={gradientColor} stopOpacity={0.08} />
            <stop offset="100%" stopColor={gradientColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal Reference Guidelines */}
        <line
          x1="0"
          y1={height * 0.28}
          x2={width}
          y2={height * 0.28}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1={height * 0.65}
          x2={width}
          y2={height * 0.65}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />

        {/* Fill Area with smooth transition */}
        <path
          d={areaD}
          fill={`url(#${gradientId})`}
          style={{
            transition:
              "d 0.5s cubic-bezier(0.25, 1, 0.5, 1), fill 0.3s ease",
          }}
        />

        {/* Smooth Stroke Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          style={{
            transition:
              "d 0.5s cubic-bezier(0.25, 1, 0.5, 1), stroke 0.3s ease",
          }}
        />

        {/* Live point pulse at current leading telemetry reading */}
        {lastPoint && (
          <>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={5.5}
              fill="none"
              stroke={strokeColor}
              strokeWidth={1.5}
              strokeOpacity={0.6}
              className="animate-ping origin-center"
              style={{
                transition:
                  "cx 0.5s cubic-bezier(0.25, 1, 0.5, 1), cy 0.5s cubic-bezier(0.25, 1, 0.5, 1), stroke 0.3s ease",
              }}
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={3}
              fill={strokeColor}
              style={{
                transition:
                  "cx 0.5s cubic-bezier(0.25, 1, 0.5, 1), cy 0.5s cubic-bezier(0.25, 1, 0.5, 1), fill 0.3s ease",
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
};
