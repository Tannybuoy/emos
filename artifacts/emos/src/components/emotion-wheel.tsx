import { clsx } from 'clsx';

interface EmotionWheelProps {
  selectedStates: string[];
  toggleState: (s: string) => void;
  onAtLimit?: () => void;
  activeRing?: 'primary' | 'modifier' | 'intent' | 'done';
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

const rings = [
  {
    name: 'Primary',
    innerRadius: 48,
    outerRadius: 120,
    segments: ['Focused', 'Stressed', 'Tired', 'Energized', 'Bored'],
    // Orange palette
    fillIdle:     '#1f0d00',
    strokeIdle:   '#7a3d00',
    textIdle:     '#FF8C00',
    fillSelected: '#FF8C00',
    strokeSelected: '#FF8C00',
  },
  {
    name: 'Modifiers',
    innerRadius: 125,
    outerRadius: 197,
    segments: ['Calm', 'Anxious', 'Distracted', 'Locked-in', 'Overwhelmed', 'In Control', 'Curious', 'Blocked'],
    // Lime palette (unchanged)
    fillIdle:     '#1a2800',
    strokeIdle:   '#3d6600',
    textIdle:     '#CBFF00',
    fillSelected: '#CBFF00',
    strokeSelected: '#CBFF00',
  },
  {
    name: 'Intent',
    innerRadius: 202,
    outerRadius: 272,
    segments: ['Start', 'Continue', 'Finish', 'Recover'],
    // Blue palette
    fillIdle:     '#001520',
    strokeIdle:   '#004d80',
    textIdle:     '#4DB8FF',
    fillSelected: '#4DB8FF',
    strokeSelected: '#4DB8FF',
  }
];

const RING_OF: Record<string, 'primary' | 'modifier' | 'intent'> = {
  Focused: 'primary', Stressed: 'primary', Tired: 'primary', Energized: 'primary', Bored: 'primary',
  Calm: 'modifier', Anxious: 'modifier', Distracted: 'modifier', 'Locked-in': 'modifier',
  Overwhelmed: 'modifier', 'In Control': 'modifier', Curious: 'modifier', Blocked: 'modifier',
  Start: 'intent', Continue: 'intent', Finish: 'intent', Recover: 'intent',
};

export function EmotionWheel({ selectedStates, toggleState, onAtLimit, activeRing = 'done' }: EmotionWheelProps) {
  const center = 290;

  return (
    <div className="relative w-full h-full max-w-[500px] mx-auto">
      <svg viewBox="0 0 580 580" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
        {rings.map((ring) => {
          const angleStep = 360 / ring.segments.length;
          return ring.segments.map((segment, i) => {
            const startAngle = i * angleStep + 1;
            const endAngle = (i + 1) * angleStep - 1;
            const isSelected = selectedStates.includes(segment);
            const pathData = describeArc(center, center, ring.innerRadius, ring.outerRadius, startAngle, endAngle);
            const textAngle = startAngle + (endAngle - startAngle) / 2;
            const textRadius = ring.innerRadius + (ring.outerRadius - ring.innerRadius) / 2;
            const textPos = polarToCartesian(center, center, textRadius, textAngle);
            const rotateAngle = textAngle > 90 && textAngle < 270 ? textAngle + 180 : textAngle;

            const segRing = RING_OF[segment];
            const isLocked = !isSelected && activeRing !== 'done' && segRing !== activeRing;

            return (
              <g
                key={segment}
                className={clsx('group', isLocked ? 'cursor-default' : 'cursor-pointer')}
                style={{ opacity: isLocked ? 0.2 : 1, transition: 'opacity 0.3s' }}
                onClick={() => {
                  if (isLocked) return;
                  if (!isSelected && selectedStates.length >= 5) {
                    onAtLimit?.();
                  } else {
                    toggleState(segment);
                  }
                }}
                role="button"
                tabIndex={isLocked ? -1 : 0}
              >
                <path
                  d={pathData}
                  fill={isSelected ? ring.fillSelected : ring.fillIdle}
                  stroke={isSelected ? ring.strokeSelected : ring.strokeIdle}
                  strokeWidth="2"
                  className="transition-all duration-200 group-hover:brightness-150"
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${rotateAngle}, ${textPos.x}, ${textPos.y})`}
                  fontSize="17"
                  fill={isSelected ? '#000' : ring.textIdle}
                  className="pointer-events-none font-sans transition-colors duration-200"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  opacity={isSelected ? 1 : 0.85}
                >
                  {segment}
                </text>
              </g>
            );
          });
        })}

        {/* Center core */}
        <circle cx={center} cy={center} r="36" fill="#000" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          className="fill-white font-display font-extrabold tracking-tighter pointer-events-none"
        >
          emos
        </text>
      </svg>
    </div>
  );
}
