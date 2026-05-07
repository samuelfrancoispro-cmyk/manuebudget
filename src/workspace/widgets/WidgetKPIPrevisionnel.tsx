import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { totauxPrevisionnels } from "@/lib/calculs";
import { formatEUR, monthKey } from "@/lib/utils";

export function WidgetKPIPrevisionnel() {
  const { recurrentes, virementsRecurrents, comptes } = useStore();
  const mois = monthKey(new Date().toISOString());
  const totaux = useMemo(
    () => totauxPrevisionnels(recurrentes, mois, undefined, virementsRecurrents, comptes),
    [recurrentes, mois, virementsRecurrents, comptes]
  );
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <CalendarClock className="h-3.5 w-3.5" />
        Prévisionnel
      </div>
      <div className="flex gap-4">
        <div>
          <div className="text-xs text-ink-muted">Revenus</div>
          <div className="text-lg font-semibold text-emerald-600">{formatEUR(totaux.revenus)}</div>
        </div>
        <div>
          <div className="text-xs text-ink-muted">Dépenses</div>
          <div className="text-lg font-semibold text-rose-600">{formatEUR(totaux.depenses)}</div>
        </div>
      </div>
      <div className={`text-sm font-medium ${totaux.solde >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        Solde prev. : {formatEUR(totaux.solde)}
      </div>
    </div>
  );
}
