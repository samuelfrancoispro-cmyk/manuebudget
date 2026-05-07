import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "@/store/useStore";
import { totauxMois } from "@/lib/calculs";
import { formatEUR, monthKey } from "@/lib/utils";

export function WidgetKPIMensuel(_props: { config: Record<string, unknown> }) {
  const { transactions, recurrentes, virementsRecurrents, comptes } = useStore();
  const mois = monthKey(new Date().toISOString());
  const totaux = useMemo(
    () => totauxMois(transactions, mois, recurrentes, undefined, virementsRecurrents, comptes, { seulementEchues: true }),
    [transactions, mois, recurrentes, virementsRecurrents, comptes]
  );
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Mois réel</div>
      <div className="flex gap-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-ink-muted"><TrendingUp className="h-3 w-3 text-emerald-600" />Revenus</div>
          <div className="text-lg font-semibold text-emerald-600">{formatEUR(totaux.revenus)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-ink-muted"><TrendingDown className="h-3 w-3 text-rose-600" />Dépenses</div>
          <div className="text-lg font-semibold text-rose-600">{formatEUR(totaux.depenses)}</div>
        </div>
      </div>
      <div className={`text-sm font-medium ${totaux.solde >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        Solde : {formatEUR(totaux.solde)}
      </div>
    </div>
  );
}
