import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { evolutionSoldeCompteCourant } from "@/lib/calculs";
import { monthKey, monthLabel, formatEUR } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function moisPrec(mois: string, n: number): string {
  const [y, m] = mois.split("-").map(Number);
  let mm = m - n, yy = y;
  while (mm < 1) { mm += 12; yy--; }
  return `${yy.toString().padStart(4, "0")}-${String(mm).padStart(2, "0")}`;
}

export function WidgetEvolution(_props: { config: Record<string, unknown> }) {
  const { comptesCourants, transactions, recurrentes, virementsRecurrents, comptes } = useStore();
  const mois = monthKey(new Date().toISOString());

  const evolution = useMemo(() => {
    if (comptesCourants.length === 0) return [];
    const moisDeb = moisPrec(mois, 5);
    const series = comptesCourants.map((c) =>
      evolutionSoldeCompteCourant(c, transactions, recurrentes, virementsRecurrents, comptes, moisDeb, mois)
    );
    const len = series[0]?.length ?? 0;
    return Array.from({ length: len }, (_, i) => ({
      mois: series[0][i].mois,
      solde: series.reduce((s, sr) => s + (sr[i]?.solde ?? 0), 0),
    }));
  }, [comptesCourants, transactions, recurrentes, virementsRecurrents, comptes, mois]);

  if (evolution.length === 0) return <p className="py-4 text-center text-sm text-ink-muted">Pas encore de données</p>;

  return (
    <div className="h-full w-full">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Évolution 6 mois</div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={evolution}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="mois" tick={{ fontSize: 10 }} tickFormatter={(v) => monthLabel(v).split(" ")[0]} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatEUR(Number(v))} labelFormatter={(v) => monthLabel(String(v))} />
          <Line type="monotone" dataKey="solde" stroke="hsl(var(--ink-muted))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
