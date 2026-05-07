import { useMemo } from "react";
import { Repeat, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";
import { useStore } from "@/store/useStore";
import { prochaineOccurrence } from "@/lib/calculs";
import { formatEUR, formatDate } from "@/lib/utils";
import type { TransactionRecurrente, VirementRecurrent, CompteEpargne } from "@/types";

export function WidgetProchaines() {
  const { recurrentes, virementsRecurrents, comptesCourants, comptes } = useStore();

  const prochaines = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    type Item = { key: string; date: string; libelle: string; type: "depense" | "revenu" | "virement"; montant: number };
    const items: Item[] = [];
    for (const r of recurrentes as TransactionRecurrente[]) {
      const debut = r.dateDebut ?? (r.moisDebut ? `${r.moisDebut}-01` : null);
      if (!debut) continue;
      const fin = r.dateFin ?? (r.moisFin ? `${r.moisFin}-28` : null);
      const next = prochaineOccurrence(debut, fin, r.frequence ?? "mois", r.intervalle ?? 1, today);
      if (!next) continue;
      items.push({ key: `r-${r.id}`, date: next, libelle: r.libelle, type: r.type, montant: r.montant });
    }
    for (const v of virementsRecurrents as VirementRecurrent[]) {
      const next = prochaineOccurrence(v.dateDebut, v.dateFin ?? null, v.frequence, v.intervalle, today);
      if (!next) continue;
      const ce = (comptes as CompteEpargne[]).find((c) => c.id === v.compteEpargneId);
      items.push({ key: `v-${v.id}`, date: next, libelle: `${v.libelle} → ${ce?.nom ?? "épargne"}`, type: "virement", montant: v.montant });
    }
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  }, [recurrentes, virementsRecurrents, comptesCourants, comptes]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Repeat className="h-3.5 w-3.5" />
        Prochaines échéances
      </div>
      {prochaines.length === 0 ? (
        <p className="py-2 text-sm text-ink-muted">Aucune</p>
      ) : (
        <div className="space-y-1.5">
          {prochaines.map((p) => (
            <div key={p.key} className="flex items-center justify-between rounded border px-2 py-1.5">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${p.type === "revenu" ? "bg-emerald-100 text-emerald-700" : p.type === "virement" ? "bg-violet-100 text-violet-700" : "bg-rose-100 text-rose-700"}`}>
                  {p.type === "revenu" ? <ArrowUpRight className="h-3 w-3" /> : p.type === "virement" ? <ArrowRightLeft className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </div>
                <div>
                  <div className="text-xs font-medium">{p.libelle}</div>
                  <div className="text-xs text-ink-muted">{formatDate(p.date)}</div>
                </div>
              </div>
              <div className={`text-xs font-semibold ${p.type === "revenu" ? "text-emerald-600" : p.type === "virement" ? "text-violet-600" : "text-rose-600"}`}>
                {p.type === "revenu" ? "+" : "−"}{formatEUR(p.montant)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
