import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Repeat,
  ArrowRightLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import {
  totauxMois,
  totauxPrevisionnels,
  depensesParCategorie,
  moisDisponibles,
  totalEpargne,
  soldeCompte as soldeCompteEpargne,
  soldeCompteCourant,
  evolutionSoldeCompteCourant,
  expandRecurrentesPourMois,
  expandVirementsTransactionsPourMois,
  prochaineOccurrence,
  labelFrequence,
} from "@/lib/calculs";
import type { TransactionRecurrente, VirementRecurrent, CompteEpargne } from "@/types";
import { formatEUR, monthKey, monthLabel, formatDate } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function moisPrec(mois: string, n: number = 1): string {
  const [y, m] = mois.split("-").map(Number);
  let mm = m - n;
  let yy = y;
  while (mm < 1) {
    mm += 12;
    yy--;
  }
  while (mm > 12) {
    mm -= 12;
    yy++;
  }
  return `${yy.toString().padStart(4, "0")}-${String(mm).padStart(2, "0")}`;
}

function moisSuiv(mois: string, n: number = 1): string {
  return moisPrec(mois, -n);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    transactions,
    recurrentes,
    virementsRecurrents,
    categories,
    comptes,
    comptesCourants,
    mouvements,
    objectifs,
    actifs,
  } = useStore();
  const [mois, setMois] = useState<string>(monthKey(new Date().toISOString()));
  const [compteId, setCompteId] = useState<string>("all");

  const moisAvecDonnees = useMemo(() => {
    return new Set(moisDisponibles(transactions, recurrentes, virementsRecurrents));
  }, [transactions, recurrentes, virementsRecurrents]);

  const minMois = useMemo(() => {
    const dispos = Array.from(moisAvecDonnees).sort();
    return dispos[0] ?? monthKey(new Date().toISOString());
  }, [moisAvecDonnees]);

  const compteFiltre = compteId === "all" ? undefined : compteId;

  // Prévisionnel : récurrents seuls, mois complet (indépendant des ponctuelles)
  const totauxPrev = useMemo(
    () => totauxPrevisionnels(recurrentes, mois, compteFiltre, virementsRecurrents, comptes),
    [recurrentes, mois, compteFiltre, virementsRecurrents, comptes]
  );
  // Réel : récurrents échus + ponctuelles saisies
  const totaux = useMemo(
    () => totauxMois(transactions, mois, recurrentes, compteFiltre, virementsRecurrents, comptes, { seulementEchues: true }),
    [transactions, recurrentes, mois, compteFiltre, virementsRecurrents, comptes]
  );
  const totauxPrec = useMemo(
    () => totauxMois(transactions, moisPrec(mois), recurrentes, compteFiltre, virementsRecurrents, comptes),
    [transactions, recurrentes, mois, compteFiltre, virementsRecurrents, comptes]
  );

  const tauxEpargneReel = totaux.revenus > 0 ? (totaux.solde / totaux.revenus) * 100 : 0;
  const tauxEpargnePrev = totauxPrev.revenus > 0 ? (totauxPrev.solde / totauxPrev.revenus) * 100 : 0;

  const soldesComptes = useMemo(() => {
    return comptesCourants.map((c) => ({
      compte: c,
      solde: soldeCompteCourant(
        c,
        transactions,
        recurrentes,
        undefined,
        virementsRecurrents,
        comptes
      ),
    }));
  }, [comptesCourants, transactions, recurrentes, virementsRecurrents, comptes]);

  const soldeCompteSelection = useMemo(() => {
    if (compteFiltre) {
      const found = soldesComptes.find((x) => x.compte.id === compteFiltre);
      return found ? found.solde : 0;
    }
    return soldesComptes.reduce((s, x) => s + x.solde, 0);
  }, [soldesComptes, compteFiltre]);

  const parCat = useMemo(
    () =>
      depensesParCategorie(
        transactions,
        mois,
        recurrentes,
        compteFiltre,
        virementsRecurrents,
        comptes
      ),
    [transactions, recurrentes, mois, compteFiltre, virementsRecurrents, comptes]
  );
  const repartition = useMemo(() => {
    const arr = Array.from(parCat.entries()).map(([catId, montant]) => {
      if (catId === "_virement") {
        return { nom: t("dashboard.categories.transfers"), couleur: "#8b5cf6", montant };
      }
      const cat = categories.find((c) => c.id === catId);
      return {
        nom: cat?.nom ?? "Inconnu",
        couleur: cat?.couleur ?? "#94a3b8",
        montant,
      };
    });
    arr.sort((a, b) => b.montant - a.montant);
    return arr;
  }, [parCat, categories]);

  const epargneTotale = totalEpargne(comptes, mouvements, virementsRecurrents, actifs);

  // Prévisions des 3 prochains mois (récurrentes + virements seulement)
  const previsions = useMemo(() => {
    return [1, 2, 3].map((n) => {
      const m = moisSuiv(mois, n);
      const recs = expandRecurrentesPourMois(recurrentes, m);
      const virs = expandVirementsTransactionsPourMois(virementsRecurrents, comptes, m);
      const recsF = compteFiltre ? recs.filter((t) => t.compteCourantId === compteFiltre) : recs;
      const virsF = compteFiltre ? virs.filter((t) => t.compteCourantId === compteFiltre) : virs;
      const all = [...recsF, ...virsF];
      const revenus = all.filter((t) => t.type === "revenu").reduce((s, t) => s + t.montant, 0);
      const depenses = all.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0);
      return { mois: m, label: monthLabel(m), revenus, depenses, solde: revenus - depenses };
    });
  }, [recurrentes, virementsRecurrents, comptes, mois, compteFiltre]);

  // Évolution sparkline 6 mois passés (par compte sélectionné, ou agrégé)
  const evolution = useMemo(() => {
    const moisDeb = moisPrec(mois, 5);
    if (compteFiltre) {
      const c = comptesCourants.find((x) => x.id === compteFiltre);
      if (!c) return [];
      return evolutionSoldeCompteCourant(
        c,
        transactions,
        recurrentes,
        virementsRecurrents,
        comptes,
        moisDeb,
        mois
      );
    }
    // agrégé tous comptes
    const points: Array<{ mois: string; solde: number }> = [];
    if (comptesCourants.length === 0) return points;
    const series = comptesCourants.map((c) =>
      evolutionSoldeCompteCourant(
        c,
        transactions,
        recurrentes,
        virementsRecurrents,
        comptes,
        moisDeb,
        mois
      )
    );
    const len = series[0]?.length ?? 0;
    for (let i = 0; i < len; i++) {
      points.push({
        mois: series[0][i].mois,
        solde: series.reduce((s, sr) => s + (sr[i]?.solde ?? 0), 0),
      });
    }
    return points;
  }, [
    comptesCourants,
    compteFiltre,
    transactions,
    recurrentes,
    virementsRecurrents,
    comptes,
    mois,
  ]);

  // 5 prochaines occurrences (récurrentes + virements) à venir
  const prochaines = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    type Item = {
      key: string;
      date: string;
      libelle: string;
      type: "depense" | "revenu" | "virement";
      montant: number;
      compte?: string;
    };
    const items: Item[] = [];
    for (const r of recurrentes as TransactionRecurrente[]) {
      const debut = r.dateDebut ?? (r.moisDebut ? `${r.moisDebut}-01` : null);
      if (!debut) continue;
      const fin = r.dateFin ?? (r.moisFin ? `${r.moisFin}-28` : null);
      const freq = r.frequence ?? "mois";
      const inter = r.intervalle ?? 1;
      const next = prochaineOccurrence(debut, fin, freq, inter, today);
      if (!next) continue;
      const cc = comptesCourants.find((c) => c.id === r.compteCourantId);
      items.push({
        key: `r-${r.id}`,
        date: next,
        libelle: r.libelle,
        type: r.type,
        montant: r.montant,
        compte: cc?.nom,
      });
    }
    for (const v of virementsRecurrents as VirementRecurrent[]) {
      const next = prochaineOccurrence(v.dateDebut, v.dateFin ?? null, v.frequence, v.intervalle, today);
      if (!next) continue;
      const cc = comptesCourants.find((c) => c.id === v.compteCourantId);
      const ce = (comptes as CompteEpargne[]).find((c) => c.id === v.compteEpargneId);
      items.push({
        key: `v-${v.id}`,
        date: next,
        libelle: `${v.libelle} → ${ce?.nom ?? t("dashboard.upcoming.defaultSavings")}`,
        type: "virement",
        montant: v.montant,
        compte: cc?.nom,
      });
    }
    items.sort((a, b) => a.date.localeCompare(b.date));
    return items.slice(0, 5);
  }, [recurrentes, virementsRecurrents, comptesCourants, comptes]);

  const dernieres = useMemo(() => {
    const ponct = transactions
      .filter((t) => monthKey(t.date) === mois)
      .filter((t) => !compteFiltre || t.compteCourantId === compteFiltre);
    return [...ponct].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [transactions, mois, compteFiltre]);

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={compteId} onValueChange={setCompteId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allAccounts")}</SelectItem>
                {comptesCourants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom} {c.type === "joint" ? "(joint)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <MonthPicker
              value={mois}
              onChange={setMois}
              availableMonths={moisAvecDonnees}
              minMonth={minMois}
            />
          </div>
        }
      />

      {/* Bloc prévisionnel */}
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("dashboard.prevSection")}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          titre={t("dashboard.kpi.prevRevenues")}
          valeur={formatEUR(totauxPrev.revenus)}
        />
        <Kpi
          icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
          titre={t("dashboard.kpi.prevExpenses")}
          valeur={formatEUR(totauxPrev.depenses)}
        />
        <Kpi
          icon={<Coins className="h-4 w-4" />}
          titre={t("dashboard.kpi.prevBalance")}
          valeur={formatEUR(totauxPrev.solde)}
          accent={totauxPrev.solde >= 0 ? "positif" : "negatif"}
          extra={totauxPrev.revenus > 0 ? t("dashboard.kpi.prevSavingsRate", { rate: tauxEpargnePrev.toFixed(1) }) : undefined}
        />
        <Kpi
          icon={<Wallet className="h-4 w-4" />}
          titre={t("dashboard.kpi.accountBalance")}
          valeur={formatEUR(soldeCompteSelection)}
          accent={soldeCompteSelection >= 0 ? "positif" : "negatif"}
          extra={
            compteFiltre
              ? t("dashboard.kpi.cumulatedBalance")
              : comptesCourants.length > 1
                ? t("dashboard.kpi.accountCountPlural", { count: comptesCourants.length })
                : t("dashboard.kpi.accountCount", { count: comptesCourants.length })
          }
          onClick={() => navigate("/argent?tab=comptes")}
        />
      </div>

      {/* Bloc réel */}
      <div className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("dashboard.realSection")}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          titre={t("dashboard.kpi.realRevenues")}
          valeur={formatEUR(totaux.revenus)}
          comparaison={delta(totaux.revenus, totauxPrec.revenus)}
          onClick={() => navigate("/argent?tab=transactions")}
        />
        <Kpi
          icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
          titre={t("dashboard.kpi.realExpenses")}
          valeur={formatEUR(totaux.depenses)}
          comparaison={delta(totaux.depenses, totauxPrec.depenses, true)}
          onClick={() => navigate("/argent?tab=transactions")}
        />
        <Kpi
          icon={<Coins className="h-4 w-4" />}
          titre={t("dashboard.kpi.realBalance")}
          valeur={formatEUR(totaux.solde)}
          accent={totaux.solde >= 0 ? "positif" : "negatif"}
          extra={totaux.revenus > 0 ? t("dashboard.kpi.realSavingsRate", { rate: tauxEpargneReel.toFixed(1) }) : undefined}
          comparaison={delta(totaux.solde, totauxPrec.solde)}
        />
      </div>

      {/* Sparkline solde 6 mois */}
      {evolution.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{t("dashboard.evolution.title")}</CardTitle>
                <CardDescription>
                  {compteFiltre
                    ? comptesCourants.find((c) => c.id === compteFiltre)?.nom
                    : t("dashboard.evolution.allAccounts")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => monthLabel(v).split(" ")[0]}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <RTooltip
                    formatter={(v) => formatEUR(Number(v))}
                    labelFormatter={(v) => monthLabel(String(v))}
                  />
                  <Line type="monotone" dataKey="solde" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {compteFiltre === undefined && comptesCourants.length > 1 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard.accountDetail.title")}</CardTitle>
            <CardDescription>{t("dashboard.accountDetail.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {soldesComptes.map(({ compte, solde }) => {
                const totauxCompte = totauxMois(
                  transactions,
                  mois,
                  recurrentes,
                  compte.id,
                  virementsRecurrents,
                  comptes
                );
                return (
                  <button
                    type="button"
                    key={compte.id}
                    onClick={() => setCompteId(compte.id)}
                    className="flex items-center justify-between rounded-md border p-3 text-left hover:bg-accent"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {compte.nom}
                        {compte.type === "joint" && (
                          <Badge variant="outline" className="text-xs">
                            {t("common.joint")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("dashboard.accountDetail.remainingBalance", { amount: formatEUR(totauxCompte.solde) })}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${solde >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatEUR(solde)}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prévisions 3 mois + Calendrier prochaines récurrentes */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> {t("dashboard.forecast.title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.forecast.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previsions.every((p) => p.revenus === 0 && p.depenses === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.forecast.empty")}
              </p>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={previsions}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <RTooltip formatter={(v) => formatEUR(Number(v))} />
                      <Bar dataKey="revenus" fill="#10b981" name={t("dashboard.forecast.revenues")} />
                      <Bar dataKey="depenses" fill="#ef4444" name={t("dashboard.forecast.expenses")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {previsions.map((p) => (
                    <div key={p.mois} className="rounded border p-2 text-center">
                      <div className="text-muted-foreground">{p.label}</div>
                      <div
                        className={`mt-1 font-semibold ${p.solde >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {formatEUR(p.solde)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-4 w-4" /> {t("dashboard.upcoming.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.upcoming.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {prochaines.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.upcoming.empty")}
              </p>
            ) : (
              <div className="space-y-2">
                {prochaines.map((p) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const dans = Math.round(
                    (new Date(p.date).getTime() - new Date(today).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() =>
                        navigate(
                          p.type === "virement"
                            ? "/epargne?tab=virements"
                            : "/argent?tab=recurrents"
                        )
                      }
                      className="flex w-full items-center justify-between rounded-md border p-2 text-left hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            p.type === "revenu"
                              ? "bg-emerald-100 text-emerald-700"
                              : p.type === "virement"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {p.type === "revenu" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : p.type === "virement" ? (
                            <ArrowRightLeft className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{p.libelle}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(p.date)} ·{" "}
                            {dans === 0
                              ? t("dashboard.upcoming.today")
                              : dans === 1
                                ? t("dashboard.upcoming.tomorrow")
                                : t("dashboard.upcoming.inDays", { days: dans })}
                            {p.compte ? ` · ${p.compte}` : ""}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          p.type === "revenu"
                            ? "text-emerald-600"
                            : p.type === "virement"
                              ? "text-violet-600"
                              : "text-rose-600"
                        }`}
                      >
                        {p.type === "revenu" ? "+" : "−"} {formatEUR(p.montant)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.categories.title")}</CardTitle>
            <CardDescription>{t("dashboard.categories.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {repartition.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.categories.empty")}
              </p>
            ) : (
              <div className="space-y-3">
                {repartition.map((r) => {
                  const pct = totaux.depenses > 0 ? (r.montant / totaux.depenses) * 100 : 0;
                  return (
                    <div key={r.nom}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: r.couleur }}
                          />
                          <span className="font-medium">{r.nom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                          <span className="font-medium">{formatEUR(r.montant)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: r.couleur }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.objectives.title")}</CardTitle>
            <CardDescription>{t("dashboard.objectives.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {objectifs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.objectives.empty")}
              </p>
            ) : (
              <div className="space-y-4">
                {objectifs.map((o) => {
                  const compte = o.compteId ? comptes.find((c) => c.id === o.compteId) : null;
                  const actuel = compte ? soldeCompteEpargne(compte, mouvements, virementsRecurrents) : 0;
                  const pct = Math.min(100, (actuel / o.montantCible) * 100);
                  return (
                    <div key={o.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{o.nom}</span>
                        <span className="text-muted-foreground">
                          {formatEUR(actuel)} / {formatEUR(o.montantCible)}
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className="mt-6 cursor-pointer transition hover:bg-accent/30"
        onClick={() => navigate("/epargne?tab=epargne")}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.savings.title")}</CardTitle>
              <CardDescription>{t("dashboard.savings.description")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-semibold">{formatEUR(epargneTotale)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("dashboard.lastTransactions.title")}</CardTitle>
          <CardDescription>{t("dashboard.lastTransactions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {dernieres.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.lastTransactions.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.lastTransactions.colDate")}</TableHead>
                  <TableHead>{t("dashboard.lastTransactions.colCategory")}</TableHead>
                  <TableHead>{t("dashboard.lastTransactions.colDescription")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.lastTransactions.colAmount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dernieres.map((t) => {
                  const cat = categories.find((c) => c.id === t.categorieId);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          <span
                            className="mr-1.5 inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat?.couleur ?? "#94a3b8" }}
                          />
                          {cat?.nom ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.description || "—"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          t.type === "revenu" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {t.type === "revenu" ? "+" : "−"} {formatEUR(t.montant)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Récurrences actives résumé */}
      {(recurrentes.length > 0 || virementsRecurrents.length > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("dashboard.recurring.active")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {recurrentes.slice(0, 3).map((r) => (
                <div key={r.id} className="flex justify-between">
                  <span>{r.libelle}</span>
                  <span>{labelFrequence(r.frequence ?? "mois", r.intervalle ?? 1)}</span>
                </div>
              ))}
              {recurrentes.length > 3 && (
                <div className="pt-1 italic">{t("dashboard.recurring.more", { count: recurrentes.length - 3 })}</div>
              )}
              {recurrentes.length === 0 && <div className="italic">{t("dashboard.recurring.none")}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("dashboard.recurring.transfers")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {virementsRecurrents.slice(0, 3).map((v) => (
                <div key={v.id} className="flex justify-between">
                  <span>{v.libelle}</span>
                  <span>{labelFrequence(v.frequence, v.intervalle)}</span>
                </div>
              ))}
              {virementsRecurrents.length > 3 && (
                <div className="pt-1 italic">{t("dashboard.recurring.more", { count: virementsRecurrents.length - 3 })}</div>
              )}
              {virementsRecurrents.length === 0 && <div className="italic">{t("dashboard.recurring.noneAlt")}</div>}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function delta(courant: number, precedent: number, inversePosNeg: boolean = false): string | undefined {
  if (precedent === 0 && courant === 0) return undefined;
  if (precedent === 0) return "vs N-1 : —";
  const diff = courant - precedent;
  const pct = (diff / Math.abs(precedent)) * 100;
  const signe = diff >= 0 ? "+" : "";
  const positif = inversePosNeg ? diff <= 0 : diff >= 0;
  void positif;
  return `vs N-1 : ${signe}${pct.toFixed(0)}%`;
}

function Kpi({
  icon,
  titre,
  valeur,
  extra,
  accent,
  comparaison,
  onClick,
}: {
  icon: React.ReactNode;
  titre: string;
  valeur: string;
  extra?: string;
  accent?: "positif" | "negatif";
  comparaison?: string;
  onClick?: () => void;
}) {
  const color =
    accent === "positif" ? "text-emerald-600" : accent === "negatif" ? "text-rose-600" : "";
  return (
    <Card
      onClick={onClick}
      className={onClick ? "cursor-pointer transition hover:bg-accent/30" : ""}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{titre}</CardDescription>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${color}`}>{valeur}</div>
        {extra && <p className="mt-1 text-xs text-muted-foreground">{extra}</p>}
        {comparaison && <p className="mt-0.5 text-xs text-muted-foreground">{comparaison}</p>}
      </CardContent>
    </Card>
  );
}
