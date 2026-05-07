import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Calculator, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { Projet, AchatProjet } from "@/types";
import { formatEUR, formatDate, todayISO } from "@/lib/utils";
import { simulerProjet, totalAchatsProjet } from "@/lib/calculs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SimulateurPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { projets, achatsProjet, addProjet, updateProjet, deleteProjet } = useStore();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Projet | null>(null);
  const [achatsOpen, setAchatsOpen] = useState<string | null>(null);

  const [test, setTest] = useState({
    nom: "Mon projet",
    montantCible: "20000",
    versementMensuel: "300",
    apportInitial: "0",
    tauxAnnuel: "3",
  });

  const projetTest: Projet = useMemo(
    () => ({
      id: "test",
      nom: test.nom,
      montantCible: parseFloat(test.montantCible) || 0,
      versementMensuel: parseFloat(test.versementMensuel) || 0,
      apportInitial: parseFloat(test.apportInitial) || 0,
      tauxAnnuel: parseFloat(test.tauxAnnuel) || 0,
    }),
    [test]
  );
  const resTest = useMemo(() => simulerProjet(projetTest), [projetTest]);

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Simulateur de projet"
          description="Calcule la durée d'épargne ou simule un projet achat par achat."
        />
      )}

      <Tabs defaultValue="rapide">
        <TabsList>
          <TabsTrigger value="rapide">Simulation d'épargne</TabsTrigger>
          <TabsTrigger value="enregistres">Projets &amp; achats</TabsTrigger>
        </TabsList>

        <TabsContent value="rapide">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
                <CardDescription>Ajuste les valeurs en direct.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="mb-1.5 block">Nom du projet</Label>
                  <Input
                    value={test.nom}
                    onChange={(e) => setTest({ ...test, nom: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block">Montant cible (€)</Label>
                    <Input
                      type="number"
                      value={test.montantCible}
                      onChange={(e) => setTest({ ...test, montantCible: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Apport initial (€)</Label>
                    <Input
                      type="number"
                      value={test.apportInitial}
                      onChange={(e) => setTest({ ...test, apportInitial: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block">Versement / mois (€)</Label>
                    <Input
                      type="number"
                      value={test.versementMensuel}
                      onChange={(e) => setTest({ ...test, versementMensuel: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Taux annuel (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={test.tauxAnnuel}
                      onChange={(e) => setTest({ ...test, tauxAnnuel: e.target.value })}
                    />
                  </div>
                </div>
                <Separator className="my-2" />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    addProjet({
                      nom: projetTest.nom,
                      montantCible: projetTest.montantCible,
                      versementMensuel: projetTest.versementMensuel,
                      apportInitial: projetTest.apportInitial,
                      tauxAnnuel: projetTest.tauxAnnuel,
                    });
                    toast.success("Projet enregistré");
                  }}
                >
                  Enregistrer ce projet
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résultat</CardTitle>
                <CardDescription>Projection avec capitalisation mensuelle.</CardDescription>
              </CardHeader>
              <CardContent>
                {!resTest.atteignable ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    Cible non atteignable avec ces paramètres (versement = 0 ou
                    insuffisant).
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ResultatLigne
                      titre="Durée pour atteindre la cible"
                      valeur={formaterDuree(resTest.moisNecessaires)}
                      gros
                    />
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <ResultatLigne titre="Total versé" valeur={formatEUR(resTest.totalVerse)} />
                      <ResultatLigne
                        titre="Intérêts gagnés"
                        valeur={formatEUR(resTest.interetsGagnes)}
                        accent
                      />
                    </div>
                    <Separator />
                    <ResultatLigne
                      titre="Capital final"
                      valeur={formatEUR(resTest.capitalFinal)}
                    />
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-ink-muted">
                        <span>Apport initial</span>
                        <span>{formatEUR(projetTest.apportInitial)}</span>
                      </div>
                      <Progress
                        value={
                          projetTest.montantCible > 0
                            ? (projetTest.apportInitial / projetTest.montantCible) * 100
                            : 0
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {resTest.atteignable && resTest.evolution.length > 1 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Évolution prévisionnelle</CardTitle>
                <CardDescription>
                  Aperçu de la progression année par année
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvolutionTable evolution={resTest.evolution} cible={projetTest.montantCible} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="enregistres" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEdit(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nouveau projet
            </Button>
          </div>
          {projets.length === 0 ? (
            <EmptyState
              title="Aucun projet enregistré"
              description="Crée-en un pour simuler les achats un par un."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projets.map((p) => {
                const r = simulerProjet(p);
                const achatsP = achatsProjet.filter((a) => a.projetId === p.id);
                const tot = totalAchatsProjet(achatsP);
                const pctReel = p.montantCible > 0 ? (tot.total / p.montantCible) * 100 : 0;
                return (
                  <Card key={p.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-ink-muted" />
                          <CardTitle>{p.nom}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEdit(p);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Supprimer ce projet ?")) {
                                deleteProjet(p.id);
                                toast.success("Projet supprimé");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {formatEUR(p.versementMensuel)} / mois · taux {p.tauxAnnuel}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-muted">Cible</span>
                        <span className="font-semibold">{formatEUR(p.montantCible)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-muted">Durée estimée</span>
                        <span className="font-semibold">
                          {r.atteignable ? formaterDuree(r.moisNecessaires) : "—"}
                        </span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Achats simulés</span>
                          <Badge variant="outline">
                            {achatsP.length} achat{achatsP.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded border bg-surface/50 p-2">
                            <div className="text-ink-muted">Effectués</div>
                            <div className="font-semibold text-emerald-600">
                              {formatEUR(tot.effectue)}
                            </div>
                          </div>
                          <div className="rounded border bg-surface/50 p-2">
                            <div className="text-ink-muted">Prévus</div>
                            <div className="font-semibold">{formatEUR(tot.prevu)}</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-ink-muted">
                            <span>Cumul achats / cible</span>
                            <span>
                              {formatEUR(tot.total)} / {formatEUR(p.montantCible)}
                            </span>
                          </div>
                          <Progress value={Math.min(100, pctReel)} />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setAchatsOpen(p.id)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Gérer les achats
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProjetForm
        open={open}
        onOpenChange={setOpen}
        edit={edit}
        onSave={(data) => {
          if (edit) {
            updateProjet(edit.id, data);
            toast.success("Projet modifié");
          } else {
            addProjet(data);
            toast.success("Projet créé");
          }
          setOpen(false);
        }}
      />

      <AchatsDialog
        projetId={achatsOpen}
        onClose={() => setAchatsOpen(null)}
      />
    </>
  );
}

function AchatsDialog({
  projetId,
  onClose,
}: {
  projetId: string | null;
  onClose: () => void;
}) {
  const {
    projets,
    achatsProjet,
    addAchatProjet,
    updateAchatProjet,
    deleteAchatProjet,
    toggleAchatValide,
  } = useStore();

  const projet = projets.find((p) => p.id === projetId) ?? null;
  const achatsP = projet ? achatsProjet.filter((a) => a.projetId === projet.id) : [];
  const [edit, setEdit] = useState<AchatProjet | null>(null);
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(todayISO());
  const [valide, setValide] = useState(false);
  const [description, setDescription] = useState("");

  const reset = () => {
    setEdit(null);
    setLibelle("");
    setMontant("");
    setDate(todayISO());
    setValide(false);
    setDescription("");
  };

  const ouvrirEdit = (a: AchatProjet) => {
    setEdit(a);
    setLibelle(a.libelle);
    setMontant(String(a.montant));
    setDate(a.date);
    setValide(a.valide);
    setDescription(a.description ?? "");
  };

  const valider = () => {
    if (!projet) return;
    if (!libelle.trim()) return toast.error("Libellé requis");
    const m = parseFloat(montant);
    if (!m || m <= 0) return toast.error("Montant invalide");
    const data = {
      libelle: libelle.trim(),
      montant: m,
      date,
      valide,
      description: description || undefined,
    };
    if (edit) {
      updateAchatProjet(edit.id, data);
      toast.success("Achat modifié");
    } else {
      addAchatProjet(projet.id, data);
      toast.success("Achat ajouté");
    }
    reset();
  };

  if (!projet) return null;

  const tot = totalAchatsProjet(achatsP);
  const restant = projet.montantCible - tot.total;
  const achatsTries = [...achatsP].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Dialog
      open={projetId !== null}
      onOpenChange={(b) => {
        if (!b) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Achats — {projet.nom}</DialogTitle>
          <DialogDescription>
            Simule chaque dépense du projet. Le cumul = coût réel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-2">
          <Mini label="Cible" valeur={formatEUR(projet.montantCible)} />
          <Mini
            label="Cumul achats"
            valeur={formatEUR(tot.total)}
            className="text-emerald-600"
          />
          <Mini
            label="Reste budget"
            valeur={formatEUR(restant)}
            className={restant >= 0 ? "text-emerald-600" : "text-rose-600"}
          />
        </div>

        <div className="rounded-md border">
          {achatsTries.length === 0 ? (
            <EmptyState
              title="Aucun achat"
              description="Ajoute le premier ci-dessous."
              className="rounded-none border-none py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[120px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achatsTries.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="pl-4 text-ink-muted">
                      {formatDate(a.date)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{a.libelle}</div>
                      {a.description && (
                        <div className="text-xs text-ink-muted">{a.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.valide ? (
                        <Badge variant="success">Effectué</Badge>
                      ) : (
                        <Badge variant="outline">Prévu</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatEUR(a.montant)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleAchatValide(a.id)}
                          title={a.valide ? "Marquer prévu" : "Marquer effectué"}
                        >
                          <Check className={`h-4 w-4 ${a.valide ? "text-emerald-600" : "text-ink-muted"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => ouvrirEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Supprimer cet achat ?")) {
                              deleteAchatProjet(a.id);
                              toast.success("Achat supprimé");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm font-medium">
            {edit ? "Modifier l'achat" : "Nouvel achat"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Libellé</Label>
              <Input
                placeholder="Devis cuisine, acompte…"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Montant (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={valide}
                  onChange={(e) => setValide(e.target.checked)}
                  className="h-4 w-4"
                />
                Achat effectué
              </label>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Description (optionnelle)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          {edit && (
            <Button variant="outline" onClick={reset}>
              Annuler l'édition
            </Button>
          )}
          <Button onClick={valider}>{edit ? "Modifier" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Mini({ label, valeur, className }: { label: string; valeur: string; className?: string }) {
  return (
    <div className="rounded-md border bg-surface/50 p-3">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className={`text-lg font-semibold ${className ?? ""}`}>{valeur}</div>
    </div>
  );
}

function ResultatLigne({
  titre,
  valeur,
  gros,
  accent,
}: {
  titre: string;
  valeur: string;
  gros?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-ink-muted">{titre}</div>
      <div
        className={`${gros ? "text-2xl" : "text-lg"} font-semibold ${
          accent ? "text-emerald-600" : ""
        }`}
      >
        {valeur}
      </div>
    </div>
  );
}

function EvolutionTable({
  evolution,
  cible,
}: {
  evolution: Array<{ mois: number; capital: number; verse: number }>;
  cible: number;
}) {
  const lignesAnnuelles = evolution.filter((e) => e.mois % 12 === 0 && e.mois > 0);
  if (evolution.length > 1 && evolution[evolution.length - 1].mois % 12 !== 0) {
    lignesAnnuelles.push(evolution[evolution.length - 1]);
  }
  return (
    <div className="space-y-2">
      {lignesAnnuelles.slice(0, 12).map((e) => {
        const pct = cible > 0 ? Math.min(100, (e.capital / cible) * 100) : 0;
        const annee = (e.mois / 12).toFixed(e.mois % 12 === 0 ? 0 : 1);
        return (
          <div key={e.mois}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">An {annee}</span>
              <span className="text-ink-muted">
                {formatEUR(e.capital)} <span className="text-xs">(versé {formatEUR(e.verse)})</span>
              </span>
            </div>
            <Progress value={pct} />
          </div>
        );
      })}
    </div>
  );
}

function formaterDuree(mois: number): string {
  if (!isFinite(mois)) return "Jamais";
  const annees = Math.floor(mois / 12);
  const reste = mois % 12;
  if (annees === 0) return `${mois} mois`;
  if (reste === 0) return `${annees} an${annees > 1 ? "s" : ""}`;
  return `${annees} an${annees > 1 ? "s" : ""} et ${reste} mois`;
}

function ProjetForm({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: Projet | null;
  onSave: (p: Omit<Projet, "id">) => void;
}) {
  const [nom, setNom] = useState(edit?.nom ?? "");
  const [cible, setCible] = useState(edit ? String(edit.montantCible) : "");
  const [versement, setVersement] = useState(edit ? String(edit.versementMensuel) : "");
  const [apport, setApport] = useState(edit ? String(edit.apportInitial) : "0");
  const [taux, setTaux] = useState(edit ? String(edit.tauxAnnuel) : "3");
  const [desc, setDesc] = useState(edit?.description ?? "");

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setNom(edit?.nom ?? "");
      setCible(edit ? String(edit.montantCible) : "");
      setVersement(edit ? String(edit.versementMensuel) : "");
      setApport(edit ? String(edit.apportInitial) : "0");
      setTaux(edit ? String(edit.tauxAnnuel) : "3");
      setDesc(edit?.description ?? "");
    }
    onOpenChange(b);
  };

  const valider = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    const c = parseFloat(cible);
    const v = parseFloat(versement);
    const a = parseFloat(apport);
    const t = parseFloat(taux);
    if (!c || c <= 0) return toast.error("Cible invalide");
    if (isNaN(v) || v < 0) return toast.error("Versement invalide");
    if (isNaN(a) || a < 0) return toast.error("Apport invalide");
    if (isNaN(t) || t < 0) return toast.error("Taux invalide");
    onSave({
      nom: nom.trim(),
      montantCible: c,
      versementMensuel: v,
      apportInitial: a,
      tauxAnnuel: t,
      description: desc || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouveau"} projet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Nom</Label>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Cible (€)</Label>
              <Input type="number" value={cible} onChange={(e) => setCible(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Apport initial (€)</Label>
              <Input type="number" value={apport} onChange={(e) => setApport(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Versement / mois (€)</Label>
              <Input
                type="number"
                value={versement}
                onChange={(e) => setVersement(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Taux annuel (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={taux}
                onChange={(e) => setTaux(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>{edit ? "Modifier" : "Créer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
