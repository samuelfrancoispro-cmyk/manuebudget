import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { useStore } from "@/store/useStore";
import { soldeCompteCourant } from "@/lib/calculs";
import { formatEUR } from "@/lib/utils";

export function WidgetSolde(_props: { config: Record<string, unknown> }) {
  const { comptesCourants, transactions, recurrentes, virementsRecurrents, comptes } = useStore();
  const soldeTotal = useMemo(
    () => comptesCourants.reduce((sum, c) => sum + soldeCompteCourant(c, transactions, recurrentes, undefined, virementsRecurrents, comptes), 0),
    [comptesCourants, transactions, recurrentes, virementsRecurrents, comptes]
  );
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Wallet className="h-3.5 w-3.5" />
        Solde courant
      </div>
      <div className={`text-2xl font-bold ${soldeTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        {formatEUR(soldeTotal)}
      </div>
      <div className="text-xs text-ink-muted">{comptesCourants.length} compte{comptesCourants.length > 1 ? "s" : ""}</div>
    </div>
  );
}
