import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { depensesParCategorie, totauxMois } from "@/lib/calculs";
import { formatEUR, monthKey } from "@/lib/utils";

export function WidgetCategories() {
  const { transactions, recurrentes, virementsRecurrents, comptes, categories } = useStore();
  const mois = monthKey(new Date().toISOString());

  const { repartition, totalDep } = useMemo(() => {
    const parCat = depensesParCategorie(transactions, mois, recurrentes, undefined, virementsRecurrents, comptes);
    const totaux = totauxMois(transactions, mois, recurrentes, undefined, virementsRecurrents, comptes, { seulementEchues: true });
    const arr = Array.from(parCat.entries()).map(([catId, montant]) => {
      if (catId === "_virement") return { nom: "Virements", couleur: "#8b5cf6", montant };
      const cat = categories.find((c) => c.id === catId);
      return { nom: cat?.nom ?? "Inconnu", couleur: cat?.couleur ?? "#94a3b8", montant };
    }).sort((a, b) => b.montant - a.montant).slice(0, 5);
    return { repartition: arr, totalDep: totaux.depenses };
  }, [transactions, mois, recurrentes, virementsRecurrents, comptes, categories]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Répartition dépenses</div>
      {repartition.length === 0 ? (
        <p className="py-2 text-sm text-ink-muted">Aucune dépense ce mois</p>
      ) : (
        <div className="space-y-2">
          {repartition.map((r) => {
            const pct = totalDep > 0 ? (r.montant / totalDep) * 100 : 0;
            return (
              <div key={r.nom}>
                <div className="mb-0.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: r.couleur }} />
                    {r.nom}
                  </span>
                  <span className="text-ink-muted">{formatEUR(r.montant)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.couleur }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
