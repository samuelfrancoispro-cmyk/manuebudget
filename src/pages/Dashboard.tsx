import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Coins } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  totauxMois,
  depensesParCategorie,
  moisDisponibles,
  totalEpargne,
  soldeCompteCourant,
} from "@/lib/calculs";
import { formatEUR, monthKey, monthLabel, formatDate } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const {
    transactions,
    recurrentes,
    categories,
    comptes,
    comptesCourants,
    mouvements,
    objectifs,
  } = useStore();
  const [mois, setMois] = useState<string>(monthKey(new Date().toISOString()));
  const [compteId, setCompteId] = useState<string>("all");

  const moisListe = useMemo(() => {
    const dispos = moisDisponibles(transactions, recurrentes);
    if (!dispos.includes(mois)) dispos.unshift(mois);
    return dispos;
  }, [transactions, recurrentes, mois]);

  const compteFiltre = compteId === "all" ? undefined : compteId;

  const totaux = useMemo(
    () => totauxMois(transactions, mois, recurrentes, compteFiltre),
    [transactions, recurrentes, mois, compteFiltre]
  );
  const tauxEpargne = totaux.revenus > 0 ? (totaux.solde / totaux.revenus) * 100 : 0;

  const soldesComptes = useMemo(() => {
    return comptesCourants.map((c) => ({
      compte: c,
      solde: soldeCompteCourant(c, transactions, recurrentes, mois),
    }));
  }, [comptesCourants, transactions, recurrentes, mois]);

  const soldeCompteSelection = useMemo(() => {
    if (compteFiltre) {
      const found = soldesComptes.find((x) => x.compte.id === compteFiltre);
      return found ? found.solde : 0;
    }
    return soldesComptes.reduce((s, x) => s + x.solde, 0);
  }, [soldesComptes, compteFiltre]);

  const parCat = useMemo(
    () => depensesParCategorie(transactions, mois, recurrentes, compteFiltre),
    [transactions, recurrentes, mois, compteFiltre]
  );
  const repartition = useMemo(() => {
    const arr = Array.from(parCat.entries()).map(([catId, montant]) => {
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

  const epargneTotale = totalEpargne(comptes, mouvements);

  const dernieres = useMemo(() => {
    const ponct = transactions
      .filter((t) => monthKey(t.date) === mois)
      .filter((t) => !compteFiltre || t.compteCourantId === compteFiltre);
    return [...ponct]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [transactions, mois, compteFiltre]);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de tes finances mensuelles."
        action={
          <div className="flex gap-2">
            <Select value={compteId} onValueChange={setCompteId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                {comptesCourants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom} {c.type === "joint" ? "(joint)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mois} onValueChange={setMois}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moisListe.map((m) => (
                  <SelectItem key={m} value={m}>
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          titre="Revenus du mois"
          valeur={formatEUR(totaux.revenus)}
        />
        <Kpi
          icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
          titre="Dépenses du mois"
          valeur={formatEUR(totaux.depenses)}
        />
        <Kpi
          icon={<Coins className="h-4 w-4" />}
          titre="Reste à vivre"
          valeur={formatEUR(totaux.solde)}
          accent={totaux.solde >= 0 ? "positif" : "negatif"}
          extra={
            totaux.revenus > 0 ? `Taux d'épargne : ${tauxEpargne.toFixed(1)}%` : undefined
          }
        />
        <Kpi
          icon={<Wallet className="h-4 w-4" />}
          titre="Solde compte"
          valeur={formatEUR(soldeCompteSelection)}
          accent={soldeCompteSelection >= 0 ? "positif" : "negatif"}
          extra={
            compteFiltre
              ? "Solde cumulé du compte"
              : `${comptesCourants.length} compte${comptesCourants.length > 1 ? "s" : ""} courant${comptesCourants.length > 1 ? "s" : ""}`
          }
        />
      </div>

      {compteFiltre === undefined && comptesCourants.length > 1 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Détail par compte</CardTitle>
            <CardDescription>Solde cumulé jusqu'au mois sélectionné</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {soldesComptes.map(({ compte, solde }) => {
                const t = totauxMois(transactions, mois, recurrentes, compte.id);
                return (
                  <div
                    key={compte.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {compte.nom}
                        {compte.type === "joint" && (
                          <Badge variant="outline" className="text-xs">
                            joint
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reste à vivre : {formatEUR(t.solde)}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${solde >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatEUR(solde)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des dépenses</CardTitle>
            <CardDescription>Par catégorie pour le mois sélectionné</CardDescription>
          </CardHeader>
          <CardContent>
            {repartition.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune dépense ce mois-ci.
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
            <CardTitle>Objectifs en cours</CardTitle>
            <CardDescription>Progression vers tes cibles</CardDescription>
          </CardHeader>
          <CardContent>
            {objectifs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun objectif pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {objectifs.map((o) => {
                  const compte = o.compteId ? comptes.find((c) => c.id === o.compteId) : null;
                  let actuel = 0;
                  if (compte) {
                    const mvts = mouvements.filter((m) => m.compteId === compte.id);
                    actuel =
                      compte.soldeInitial +
                      mvts.reduce(
                        (acc, m) => (m.type === "retrait" ? acc - m.montant : acc + m.montant),
                        0
                      );
                  }
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

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Épargne placée</CardTitle>
              <CardDescription>Total des comptes d'épargne</CardDescription>
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
          <CardTitle>Dernières transactions</CardTitle>
          <CardDescription>5 plus récentes du mois (hors récurrentes)</CardDescription>
        </CardHeader>
        <CardContent>
          {dernieres.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune transaction. Va dans l'onglet Transactions pour en ajouter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
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
    </>
  );
}

function Kpi({
  icon,
  titre,
  valeur,
  extra,
  accent,
}: {
  icon: React.ReactNode;
  titre: string;
  valeur: string;
  extra?: string;
  accent?: "positif" | "negatif";
}) {
  const color =
    accent === "positif" ? "text-emerald-600" : accent === "negatif" ? "text-rose-600" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{titre}</CardDescription>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${color}`}>{valeur}</div>
        {extra && <p className="mt-1 text-xs text-muted-foreground">{extra}</p>}
      </CardContent>
    </Card>
  );
}
