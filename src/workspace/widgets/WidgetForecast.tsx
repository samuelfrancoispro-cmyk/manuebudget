import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { expandRecurrentesPourMois, expandVirementsTransactionsPourMois } from "@/lib/calculs";
import { monthKey, monthLabel, formatEUR } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function moisSuiv(mois: string, n: number): string {
  const [y, m] = mois.split("-").map(Number);
  let mm = m + n, yy = y;
  while (mm > 12) { mm -= 12; yy++; }
  return `${yy.toString().padStart(4, "0")}-${String(mm).padStart(2, "0")}`;
}

export function WidgetForecast(_props: { config: Record<string, unknown> }) {
  const { recurrentes, virementsRecurrents, comptes } = useStore();
  const mois = monthKey(new Date().toISOString());

  const previsions = useMemo(() => [1, 2, 3].map((n) => {
    const m = moisSuiv(mois, n);
    const recs = expandRecurrentesPourMois(recurrentes, m);
    const virs = expandVirementsTransactionsPourMois(virementsRecurrents, comptes, m);
    const all = [...recs, ...virs];
    const revenus = all.filter((t) => t.type === "revenu").reduce((s, t) => s + t.montant, 0);
    const depenses = all.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0);
    return { mois: m, label: monthLabel(m), revenus, depenses };
  }), [recurrentes, virementsRecurrents, comptes, mois]);

  return (
    <div className="h-full w-full">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Prévisions 3 mois</div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={previsions}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatEUR(Number(v))} />
          <Bar dataKey="revenus" fill="hsl(var(--positive))" name="Revenus" />
          <Bar dataKey="depenses" fill="hsl(var(--negative))" name="Dépenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
