import { monthKey } from '@/lib/finance';
import { useStore } from '@/store/useStore';

interface Props { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; }

export default function ModuleDepensesConfig({ config, onChange }: Props) {
  const categories = useStore((s) => s.categories.filter((c) => c.type === 'depense'));
  const currentMk = (config.monthKey as string) ?? monthKey();
  const plafond = config.plafond as number | undefined;
  const hiddenCats = (config.hiddenCats as string[]) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium block mb-1">Mois</label>
        <input type="month" className="w-full border border-border rounded px-2 py-1 text-sm bg-background"
          value={currentMk} onChange={(e) => onChange({ ...config, monthKey: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">Plafond budget (€)</label>
        <input type="number" className="w-full border border-border rounded px-2 py-1 text-sm bg-background"
          placeholder="Aucun" value={plafond ?? ''}
          onChange={(e) => onChange({ ...config, plafond: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
      <div>
        <p className="text-xs font-medium mb-1">Catégories masquées</p>
        {categories.map((c) => (
          <label key={c.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
            <input type="checkbox" checked={hiddenCats.includes(c.id)}
              onChange={(e) => {
                const next = e.target.checked ? [...hiddenCats, c.id] : hiddenCats.filter((id) => id !== c.id);
                onChange({ ...config, hiddenCats: next });
              }} />
            <span className="text-sm">{c.nom}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
