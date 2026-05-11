import { monthKey } from '@/lib/finance';

interface Props { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; }

export default function ModuleRecurrentesConfig({ config, onChange }: Props) {
  const mk = (config.monthKey as string) ?? monthKey();
  const showRevenus = (config.showRevenus as boolean) ?? false;
  const sortBy = (config.sortBy as string) ?? 'date';

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium block mb-1">Mois</label>
        <input type="month" className="w-full border border-border rounded px-2 py-1 text-sm bg-background"
          value={mk} onChange={(e) => onChange({ ...config, monthKey: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={showRevenus}
          onChange={(e) => onChange({ ...config, showRevenus: e.target.checked })} />
        <span className="text-sm">Afficher revenus récurrents</span>
      </label>
      <div>
        <label className="text-xs font-medium block mb-1">Tri</label>
        <select className="w-full border border-border rounded px-2 py-1 text-sm bg-background"
          value={sortBy} onChange={(e) => onChange({ ...config, sortBy: e.target.value })}>
          <option value="date">Date prélèvement</option>
          <option value="amount">Montant</option>
        </select>
      </div>
    </div>
  );
}
