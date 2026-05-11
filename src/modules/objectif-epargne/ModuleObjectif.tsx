import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import ModuleShell from '../_base/ModuleShell';
import ModuleObjectifConfig from './ModuleObjectifConfig';
import { formatEUR } from '@/lib/finance';
import type { WbModule } from '@/types';
import { Target } from 'lucide-react';

interface Props { module: WbModule; }

export default function ModuleObjectif({ module }: Props) {
  const objectifs = useStore((s) => s.objectifs);
  const removeWbModule = useStore((s) => s.removeWbModule);
  const updateWbModuleConfig = useStore((s) => s.updateWbModuleConfig);

  const config = module.config;
  const objectifId = config.objectifId as string | undefined;
  const showConseil = (config.showConseil as boolean) ?? true;

  const objectif = objectifs.find((o) => o.id === objectifId) ?? objectifs[0];
  const pct = objectif ? Math.min(100, (objectif.montantActuel / objectif.montantCible) * 100) : 0;
  const restant = objectif ? objectif.montantCible - objectif.montantActuel : 0;

  const conseil = useMemo(() => {
    if (!objectif?.dateCible || restant <= 0) return null;
    const moisRestants = Math.max(1, Math.round(
      (new Date(objectif.dateCible).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
    ));
    return restant / moisRestants;
  }, [objectif, restant]);

  return (
    <ModuleShell
      title="Objectif épargne"
      onRemove={() => removeWbModule(module.id)}
      configPanel={<ModuleObjectifConfig config={config} onChange={(c) => updateWbModuleConfig(module.id, c)} />}
    >
      {!objectif ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
          <Target size={24} className="opacity-40" />
          <p className="text-sm">Aucun objectif — configurez ce module</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm truncate">{objectif.nom}</p>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatEUR(objectif.montantActuel)}</span>
            <span className="font-medium">{pct.toFixed(0)}%</span>
            <span>{formatEUR(objectif.montantCible)}</span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>Restant : <strong className="text-foreground">{formatEUR(restant)}</strong></span>
            {objectif.dateCible && (
              <span>Échéance : {new Date(objectif.dateCible).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            )}
          </div>
          {showConseil && conseil !== null && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 text-xs text-primary">
              Conseil : épargner <strong>{formatEUR(conseil)}/mois</strong> pour atteindre l'objectif à temps.
            </div>
          )}
        </div>
      )}
    </ModuleShell>
  );
}
