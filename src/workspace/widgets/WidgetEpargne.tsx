import { useMemo } from "react";
import { PiggyBank } from "lucide-react";
import { useStore } from "@/store/useStore";
import { totalEpargne } from "@/lib/calculs";
import { formatEUR } from "@/lib/utils";

export function WidgetEpargne(_props: { config: Record<string, unknown> }) {
  const { comptes, mouvements, virementsRecurrents, actifs } = useStore();
  const total = useMemo(
    () => totalEpargne(comptes, mouvements, virementsRecurrents, actifs),
    [comptes, mouvements, virementsRecurrents, actifs]
  );
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <PiggyBank className="h-3.5 w-3.5" />
        Épargne totale
      </div>
      <div className="text-2xl font-bold text-emerald-600">{formatEUR(total)}</div>
      <div className="text-xs text-ink-muted">{comptes.length} compte{comptes.length > 1 ? "s" : ""}</div>
    </div>
  );
}
