import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import ModuleShell from '../_base/ModuleShell';
import ModuleRecurrentesConfig from './ModuleRecurrentesConfig';
import { formatEUR, monthKey, expandRecurrentesPourMois } from '@/lib/finance';
import type { WbModule } from '@/types';

interface Props { module: WbModule; }

export default function ModuleRecurrentes({ module }: Props) {
  const recurrentes = useStore((s) => s.recurrentes);
  const removeWbModule = useStore((s) => s.removeWbModule);
  const updateWbModuleConfig = useStore((s) => s.updateWbModuleConfig);

  const config = module.config;
  const mk = (config.monthKey as string) ?? monthKey();
  const showRevenus = (config.showRevenus as boolean) ?? false;
  const sortBy = (config.sortBy as string) ?? 'date';

  const items = useMemo(() => {
    let list = expandRecurrentesPourMois(recurrentes, mk);
    if (!showRevenus) list = list.filter((r) => r.type === 'debit');
    return sortBy === 'date'
      ? list.sort((a, b) => a.jourPrelevement - b.jourPrelevement)
      : list.sort((a, b) => b.montant - a.montant);
  }, [recurrentes, mk, showRevenus, sortBy]);

  const total = items.filter((r) => r.type === 'debit').reduce((a, r) => a + r.montant, 0);

  return (
    <ModuleShell
      title="Charges fixes"
      onRemove={() => removeWbModule(module.id)}
      configPanel={<ModuleRecurrentesConfig config={config} onChange={(c) => updateWbModuleConfig(module.id, c)} />}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">{formatEUR(total)}</span>
          <span className="text-xs text-muted-foreground">/mois</span>
        </div>
        <div className="flex flex-col gap-1 mt-1 max-h-[180px] overflow-y-auto">
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-muted-foreground w-5 shrink-0">{r.jourPrelevement}</span>
                <span className="text-xs truncate">{r.libelle}</span>
              </div>
              <span className={`text-xs font-medium tabular-nums shrink-0 ml-2 ${r.type === 'credit' ? 'text-green-600' : ''}`}>
                {r.type === 'credit' ? '+' : ''}{formatEUR(r.montant)}
              </span>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Aucune récurrente</p>}
        </div>
      </div>
    </ModuleShell>
  );
}
