import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Download, AlertTriangle, Info, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import type { RapportCSV, RapportLigne, CompteCourant } from "@/types";
import { analyserRapport } from "@/lib/analytics";
import { exporterRapportExcel } from "@/lib/excelExport";
import { formatEUR, formatDate, monthLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  rapport: RapportCSV;
  lignes: RapportLigne[];
  compte?: CompteCourant;
}

export default function RapportAnalytique({ rapport, lignes, compte }: Props) {
  const analyse = useMemo(() => analyserRapport(lignes), [lignes]);

  const dataPie = analyse.parCategorie.map((c) => ({
    name: c.categorie,
    value: c.total,
    fill: c.couleur,
  }));

  const dataEvolution = analyse.evolutionJournaliere.map((e) => ({
    date: e.date.slice(8, 10) + "/" + e.date.slice(5, 7),
    debit: e.debit,
    credit: e.credit,
  }));

  const dataBar = analyse.parCategorie.slice(0, 8).map((c) => ({
    name: c.categorie.length > 18 ? c.categorie.slice(0, 17) + "…" : c.categorie,
    montant: c.total,
    fill: c.couleur,
  }));

  return (
    <div className="space-y-4">
      {/* Header KPIs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs text-muted-foreground">
            {compte?.nom ?? "Compte inconnu"} • {monthLabel(rapport.mois)} •{" "}
            {rapport.nbLignes} opérations
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exporterRapportExcel(rapport, lignes, analyse, compte?.nom)}
        >
          <Download className="h-4 w-4" />
          Exporter Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label="Crédits"
          value={formatEUR(analyse.totalCredit)}
          accent="positif"
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
        />
        <Kpi
          label="Débits"
          value={formatEUR(analyse.totalDebit)}
          accent="negatif"
          icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
        />
        <Kpi
          label="Solde net"
          value={formatEUR(analyse.solde)}
          accent={analyse.solde >= 0 ? "positif" : "negatif"}
        />
      </div>

      <Tabs defaultValue="repartition">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="top">Top dépenses</TabsTrigger>
          <TabsTrigger value="abos">Abonnements</TabsTrigger>
          <TabsTrigger value="pistes">Pistes éco</TabsTrigger>
        </TabsList>

        <TabsContent value="repartition" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Camembert par catégorie</CardTitle>
                <CardDescription>Répartition des dépenses</CardDescription>
              </CardHeader>
              <CardContent>
                {dataPie.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucune dépense.
                  </p>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={dataPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={110}
                          paddingAngle={2}
                        >
                          {dataPie.map((d, i) => (
                            <Cell key={i} fill={d.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => formatEUR(Number(v))}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top catégories</CardTitle>
                <CardDescription>Les 8 premiers postes</CardDescription>
              </CardHeader>
              <CardContent>
                {dataBar.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucune dépense.
                  </p>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer>
                      <BarChart data={dataBar} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={140}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(v) => formatEUR(Number(v))}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="montant">
                          {dataBar.map((d, i) => (
                            <Cell key={i} fill={d.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Détail par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Nb</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">% des dépenses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyse.parCategorie.map((c) => {
                    const pct =
                      analyse.totalDebit > 0 ? (c.total / analyse.totalDebit) * 100 : 0;
                    return (
                      <TableRow key={c.categorie}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: c.couleur }}
                            />
                            {c.categorie}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {c.nbOperations}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatEUR(c.total)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {pct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution journalière</CardTitle>
              <CardDescription>Débits vs crédits par jour</CardDescription>
            </CardHeader>
            <CardContent>
              {dataEvolution.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune donnée.
                </p>
              ) : (
                <div className="h-[360px] w-full">
                  <ResponsiveContainer>
                    <LineChart data={dataEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v) => formatEUR(Number(v))}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="debit"
                        name="Débits"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="credit"
                        name="Crédits"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              {analyse.topDepenses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucune dépense.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyse.topDepenses.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell className="font-medium">{t.libelle}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.categorie ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-rose-600">
                          {formatEUR(t.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Abonnements et dépenses récurrentes détectés</CardTitle>
              <CardDescription>
                Libellés similaires avec montants stables
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyse.abonnementsSuspects.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucun abonnement détecté sur cette période.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="text-right">Occurrences</TableHead>
                      <TableHead className="text-right">Montant moyen</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyse.abonnementsSuspects.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{a.libelle}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{a.occurrences}×</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatEUR(a.montant)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatEUR(a.montant * a.occurrences)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pistes" className="mt-4">
          <div className="space-y-3">
            {analyse.pistesEconomie.map((p, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3 py-4">
                  <div className="mt-0.5">
                    {p.niveau === "fort" && (
                      <AlertCircle className="h-5 w-5 text-rose-600" />
                    )}
                    {p.niveau === "moyen" && (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    {p.niveau === "info" && <Info className="h-5 w-5 text-sky-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{p.titre}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {p.description}
                    </div>
                    {p.gainEstime !== undefined && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Gain potentiel : </span>
                        <span className="font-medium text-emerald-600">
                          ~ {formatEUR(p.gainEstime)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: "positif" | "negatif";
  icon?: React.ReactNode;
}) {
  const color =
    accent === "positif" ? "text-emerald-600" : accent === "negatif" ? "text-rose-600" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
