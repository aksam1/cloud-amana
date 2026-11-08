// Shared ornament: 8-point star (khatam), geometric field, rules, badges and icons.

export function starPath(r = 30, inner = 0.76) {
  // Two overlapping squares = the classic eight-pointed khatam outline.
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * inner;
    pts.push(`${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** Repeating star-and-cross lattice; used on the loader and title backgrounds. */
export function GeoField({ opacity = 0.12, color = '#e2bb68', size = 120, className = '' }) {
  return (
    <svg className={`absolute inset-0 h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <pattern id="geo-field" width={size} height={size} patternUnits="userSpaceOnUse">
          <g transform={`translate(${size / 2} ${size / 2})`} fill="none" stroke={color} strokeWidth="1">
            <path d={starPath(size * 0.34, 0.72)} />
            <rect x={-size * 0.18} y={-size * 0.18} width={size * 0.36} height={size * 0.36} transform="rotate(45)" />
            <circle r={size * 0.06} />
          </g>
          <g fill="none" stroke={color} strokeWidth="1">
            <path d={`M0,0 L${size * 0.16},${size * 0.16} M${size},0 L${size * 0.84},${size * 0.16} M0,${size} L${size * 0.16},${size * 0.84} M${size},${size} L${size * 0.84},${size * 0.84}`} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo-field)" opacity={opacity} />
    </svg>
  );
}

/** Ink divider with a star at its centre. */
export function Rule({ className = '', color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 240 14" className={className} aria-hidden="true">
      <path d="M4,7 C60,5 90,8 106,7 M134,7 C150,6 180,9 236,7" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d={starPath(6, 0.6)} transform="translate(120 7)" fill={color} />
    </svg>
  );
}

const SOURCE = {
  quran: { label: 'Quran', tone: 'bg-[#6b4a14] text-[#f7e0a3] border-[#c99a45]' },
  tradition: { label: 'Tradition', tone: 'bg-[#3d2c22] text-[#e8cfae] border-[#8a6a4e]' },
  mixed: { label: 'Quran + tradition', tone: 'bg-[#4d3418] text-[#f1d8a8] border-[#a98348]' },
};

export function SourceBadge({ source = 'quran', className = '' }) {
  const s = SOURCE[source] || SOURCE.quran;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.62rem] caps ${s.tone} ${className}`}>
      <svg viewBox="-8 -8 16 16" className="h-2.5 w-2.5" aria-hidden="true">
        <path d={starPath(7.5, 0.62)} fill="currentColor" />
      </svg>
      {s.label}
    </span>
  );
}

const ICONS = {
  home: 'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  pyramid: 'M12 3.5L3 19.5h18zM7 12.5h10M5 16h14',
  bars: 'M5 20v-7M12 20V5M19 20v-10',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  play: 'M7 4.5v15l12-7.5z',
  pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  next: 'M5 4.5v15l10-7.5zM17 4.5h2.5v15H17z',
  prev: 'M19 4.5v15L9 12zM4.5 4.5H7v15H4.5z',
  soundOn: 'M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12',
  soundOff: 'M4 9h4l5-4v14l-5-4H4zM16.5 9.5l5 5M21.5 9.5l-5 5',
  auto: 'M4 12a8 8 0 0113.6-5.7M20 12a8 8 0 01-13.6 5.7M17.5 3v4h-4M6.5 21v-4h4',
  help: 'M9.2 9a2.9 2.9 0 115.1 1.9c-.9.9-2.3 1.5-2.3 3.1M12 17.6v.4',
  close: 'M6 6l12 12M18 6L6 18',
  chevron: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  target: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 110 8 4 4 0 010-8z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  book: 'M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 21.5zM4 5.5v16M8 7h8',
};

export function Icon({ name, className = 'h-5 w-5', filled = false }) {
  const solid = filled || name === 'play' || name === 'pause' || name === 'next' || name === 'prev';
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill={solid ? 'currentColor' : 'none'} stroke={solid ? 'none' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}
