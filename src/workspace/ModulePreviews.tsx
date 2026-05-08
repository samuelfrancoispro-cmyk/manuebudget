import type { ModuleKey } from '@/types';

function PreviewBudget() {
  const bars = [60, 35, 80, 50, 70];
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none">
      {bars.map((h, i) => (
        <rect key={i} x={i * 20 + 4} y={48 - h * 0.45} width="14" height={h * 0.45}
          rx="2" fill="currentColor" opacity={0.6 + i * 0.05} />
      ))}
    </svg>
  );
}

function PreviewForecast() {
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none" stroke="currentColor">
      <polyline points="0,40 25,30 50,20 75,25 100,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <polyline points="50,20 75,25 100,10" strokeWidth="2" strokeDasharray="4 2" opacity="0.4" />
    </svg>
  );
}

function PreviewEpargne() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" opacity="0.2" />
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4"
        strokeDasharray="88 126" strokeDashoffset="31" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function PreviewSimulateur() {
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none" stroke="currentColor">
      <polyline points="0,45 30,35 60,20 100,8" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
      <polyline points="0,45 30,40 60,38 100,35" strokeWidth="2" opacity="0.4" strokeDasharray="3 2" strokeLinecap="round" />
      <circle cx="60" cy="20" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="90" cy="11" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function PreviewRapports() {
  const bars = [40, 70, 55, 85, 45, 60];
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none">
      {bars.map((h, i) => (
        <rect key={i} x={i * 16 + 2} y={48 - h * 0.9} width="10" height={h * 0.9} rx="2"
          fill="currentColor" opacity={i % 2 === 0 ? 0.7 : 0.35} />
      ))}
    </svg>
  );
}

function PreviewInvestissements() {
  const bars = [20, 35, 50, 45, 65, 80];
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none">
      {bars.map((h, i) => (
        <rect key={i} x={i * 16 + 2} y={48 - h * 0.9} width="10" height={h * 0.9} rx="2"
          fill="currentColor" opacity={0.4 + i * 0.1} />
      ))}
    </svg>
  );
}

function PreviewPatrimoine() {
  const slices = [
    { pct: 40, offset: 0, opacity: 0.9 },
    { pct: 25, offset: 40, opacity: 0.6 },
    { pct: 20, offset: 65, opacity: 0.4 },
    { pct: 15, offset: 85, opacity: 0.25 },
  ];
  const r = 18;
  const cx = 24;
  const cy = 24;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          stroke="currentColor" strokeWidth="8"
          strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
          strokeDashoffset={-((s.offset / 100) * circ)}
          opacity={s.opacity} />
      ))}
    </svg>
  );
}

function PreviewDettes() {
  const bars = [100, 85, 65, 45, 30, 15];
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none">
      {bars.map((h, i) => (
        <rect key={i} x={i * 16 + 2} y={48 - h * 0.45} width="10" height={h * 0.45} rx="2"
          fill="currentColor" opacity={0.8 - i * 0.1} />
      ))}
    </svg>
  );
}

function PreviewFiscalite() {
  const lines = [30, 45, 60, 75];
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none" stroke="currentColor">
      {lines.map((y, i) => (
        <line key={i} x1="10" y1={y * 0.6} x2={40 + i * 15} y2={y * 0.6}
          strokeWidth="2.5" strokeLinecap="round" opacity={0.9 - i * 0.15} />
      ))}
    </svg>
  );
}

function PreviewDuo() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="currentColor">
      <circle cx="16" cy="18" r="7" opacity="0.7" />
      <circle cx="32" cy="18" r="7" opacity="0.5" />
      <ellipse cx="16" cy="36" rx="10" ry="6" opacity="0.7" />
      <ellipse cx="32" cy="36" rx="10" ry="6" opacity="0.5" />
    </svg>
  );
}

function PreviewFreelance() {
  const pts = '0,40 15,35 30,20 40,30 55,15 70,25 85,10 100,18';
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none" stroke="currentColor">
      <polyline points={pts} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

function PreviewMultidevise() {
  return (
    <svg viewBox="0 0 100 48" className="h-10 w-full" fill="none">
      <text x="5" y="22" fontSize="14" fill="currentColor" opacity="0.8" fontFamily="monospace">€</text>
      <text x="32" y="22" fontSize="14" fill="currentColor" opacity="0.6" fontFamily="monospace">$</text>
      <text x="59" y="22" fontSize="14" fill="currentColor" opacity="0.4" fontFamily="monospace">£</text>
      <text x="5" y="42" fontSize="12" fill="currentColor" opacity="0.3" fontFamily="monospace">¥</text>
      <text x="30" y="42" fontSize="12" fill="currentColor" opacity="0.25" fontFamily="monospace">CHF</text>
    </svg>
  );
}

const PREVIEWS: Record<ModuleKey, React.FC> = {
  budget: PreviewBudget,
  forecast: PreviewForecast,
  epargne: PreviewEpargne,
  simulateur: PreviewSimulateur,
  rapports: PreviewRapports,
  investissements: PreviewInvestissements,
  patrimoine: PreviewPatrimoine,
  dettes: PreviewDettes,
  fiscalite: PreviewFiscalite,
  duo: PreviewDuo,
  freelance: PreviewFreelance,
  multidevise: PreviewMultidevise,
};

export function ModulePreview({ moduleKey }: { moduleKey: ModuleKey }) {
  const Preview = PREVIEWS[moduleKey];
  if (!Preview) return null;
  return (
    <div className="flex items-center justify-center text-ink-muted">
      <Preview />
    </div>
  );
}
