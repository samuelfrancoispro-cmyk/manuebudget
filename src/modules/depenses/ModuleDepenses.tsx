import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import ModuleShell from '../_base/ModuleShell';
import ModuleDepensesConfig from './ModuleDepensesConfig';
import { formatEUR, monthKey } from '@/lib/finance';
import type { WbModule } from '@/types';

interface Props { module: WbModule; }

export default function ModuleDepenses({ module }: Props) {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const removeWbModule = useStore((s) => s.removeWbModule);
  const updateWbModuleConfig = useStore((s) => s.updateWbModuleConfig);

  const config = module.config;
  const mk = (config.monthKey as string) ?? monthKey();
  const plafond = config.plafond as number | undefined;
  const hiddenCats = (config.hiddenCats as string[]) ?? [];

  const { total, byCat } = useMemo(() => {
    const filtered = transactions.filter(
      (t) => t.type === 'debit' && t.date.startsWith(mk) && !hiddenCats.includes(t.categorieId ?? '')
    );
    const map = new Map<string, number>();
    for (const t of filtered) {
      const id = t.categorieId ?? '__sans__';
      map.set(id, (map.get(id) ?? 0) + t.montant);
    }
    const total = filtered.reduce((a, t) => a + t.montant, 0);
    const byCat = Array.from(map.entries())
      .map(([id, amount]) => ({ id, amount, cat: categories.find((c) => c.id === id) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return { total, byCat };
  }, [transactions, mk, hiddenCats, categories]);

  const pct = plafond ? Math.min(100, (total / plafond) * 100) : null;

  return (
    <ModuleShell
      title={`Dépenses — ${mk}`}
      onRemove={() => removeWbModule(module.id)}
      configPanel={<ModuleDepensesConfig config={config} onChange={(c) => updateWbModuleConfig(module.id, c)} />}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">{formatEUR(total)}</span>
          {plafond && <span className="text-xs text-muted-foreground">/ {formatEUR(plafond)}</span>}
        </div>
        {pct !== null && (
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="flex flex-col gap-1.5 mt-1">
          {byCat.map(({ id, amount, cat }) => (
            <div key={id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.couleur ?? '#94a3b8' }} />
              <span className="flex-1 text-xs text-muted-foreground truncate">{cat?.nom ?? 'Sans catégorie'}</span>
              <span className="text-xs font-medium tabular-nums">{formatEUR(amount)}</span>
            </div>
          ))}
          {byCat.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Aucune dépense ce mois</p>}
        </div>
      </div>
    </ModuleShell>
  );
}
