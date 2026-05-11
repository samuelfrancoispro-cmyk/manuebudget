import { useStore } from '@/store/useStore';
import ModuleShell from '../_base/ModuleShell';
import ModuleSoldeConfig from './ModuleSoldeConfig';
import { soldeCompteCourant, formatEUR } from '@/lib/finance';
import type { WbModule } from '@/types';
import { TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props { module: WbModule; }

export default function ModuleSolde({ module }: Props) {
  const comptesCourants = useStore((s) => s.comptesCourants);
  const transactions = useStore((s) => s.transactions);
  const removeWbModule = useStore((s) => s.removeWbModule);
  const updateWbModuleConfig = useStore((s) => s.updateWbModuleConfig);
  const navigate = useNavigate();

  const config = module.config;
  const compteIds = (config.compteIds as string[]) ?? comptesCourants.map((c) => c.id);
  const showVariation = (config.showVariation as boolean) ?? true;
  const comptes = comptesCourants.filter((c) => compteIds.includes(c.id));

  return (
    <ModuleShell
      title="Solde"
      onRemove={() => removeWbModule(module.id)}
      configPanel={<ModuleSoldeConfig config={config} onChange={(c) => updateWbModuleConfig(module.id, c)} />}
    >
      {comptes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
          <p className="text-sm">Aucun compte courant</p>
          <button onClick={() => navigate('/parametres')} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <PlusCircle size={12} /> Ajouter un compte
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comptes.map((compte) => {
            const solde = soldeCompteCourant(compte.id, compte.soldeInitial, transactions);
            return (
              <div key={compte.id} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground truncate">{compte.nom}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-base font-semibold tabular-nums ${solde >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {formatEUR(solde)}
                  </span>
                  {showVariation && (
                    solde >= 0
                      ? <TrendingUp size={12} className="text-green-500" />
                      : <TrendingDown size={12} className="text-red-500" />
                  )}
                </div>
              </div>
            );
          })}
          {comptes.length > 1 && (
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Total</span>
              <span className="text-sm font-bold tabular-nums">
                {formatEUR(comptes.reduce((acc, c) => acc + soldeCompteCourant(c.id, c.soldeInitial, transactions), 0))}
              </span>
            </div>
          )}
        </div>
      )}
    </ModuleShell>
  );
}
