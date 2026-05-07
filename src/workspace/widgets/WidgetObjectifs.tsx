import { useStore } from "@/store/useStore";
import { soldeCompte } from "@/lib/calculs";
import { formatEUR } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export function WidgetObjectifs() {
  const { objectifs, comptes, mouvements, virementsRecurrents } = useStore();
  const top = objectifs.slice(0, 4);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Objectifs</div>
      {top.length === 0 ? (
        <p className="py-2 text-sm text-ink-muted">Aucun objectif créé</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {top.map((o) => {
            const compte = o.compteId ? comptes.find((c) => c.id === o.compteId) : null;
            const actuel = compte ? soldeCompte(compte, mouvements, virementsRecurrents) : 0;
            const pct = Math.min(100, (actuel / o.montantCible) * 100);
            return (
              <div key={o.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{o.nom}</span>
                  <span className="text-ink-muted">{pct.toFixed(0)}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="text-xs text-ink-muted">{formatEUR(actuel)} / {formatEUR(o.montantCible)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
