import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type {
  CompteEpargne,
  MouvementEpargne,
  Objectif,
  ActifBoursier,
  TypeCompteEpargne,
} from "@/types";
import { formatEUR, formatDate, todayISO } from "@/lib/utils";
import { soldeCompte, totalEpargne, progressionObjectif } from "@/lib/calculs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/brand";
import { HardGate } from "@/components/gate/HardGate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const TYPE_LABELS: Record<TypeCompteEpargne, string> = {
  livret: "Livret",
  "assurance-vie": "Assurance-vie",
  boursier: "Compte boursier",
  autre: "Autre",
};

export default function EpargnePage({ embedded = false }: { embedded?: boolean } = {}) {
  const {
    comptes,
    mouvements,
    virementsRecurrents,
    actifs,
    objectifs,
    addCompte,
    updateCompte,
    deleteCompte,
    addMouvement,
    deleteMouvement,
    addObjectif,
    updateObjectif,
    deleteObjectif,
    addActif,
    updateActif,
    deleteActif,
  } = useStore();

  const [dlgCompte, setDlgCompte] = useState(false);
  const [editCompte, setEditCompte] = useState<CompteEpargne | null>(null);
  const [dlgMvt, setDlgMvt] = useState(false);
  const [compteSelMvt, setCompteSelMvt] = useState<string | null>(null);
  const [dlgObj, setDlgObj] = useState(false);
  const [editObj, setEditObj] = useState<Objectif | null>(null);
  const [dlgActif, setDlgActif] = useState(false);
  const [editActif, setEditActif] = useState<ActifBoursier | null>(null);
  const [compteSelActif, setCompteSelActif] = useState<string | null>(null);

  const total = useMemo(
    () => totalEpargne(comptes, mouvements, virementsRecurrents, actifs),
    [comptes, mouvements, virementsRecurrents, actifs]
  );

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Épargne"
          description="Tes comptes, mouvements et objectifs."
          action={
            <Badge variant="outline" className="text-base px-3 py-1.5">
              Total : <span className="ml-1.5 font-semibold">{formatEUR(total)}</span>
            </Badge>
          }
        />
      )}

      <Tabs defaultValue="comptes">
        <TabsList>
          <TabsTrigger value="comptes">Comptes</TabsTrigger>
          <TabsTrigger value="objectifs">Objectifs</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="comptes" className="space-y-4">
          <div className="flex justify-end">
            <HardGate featureKey="comptes_epargne" current={comptes.length}>
              <Button
                onClick={() => {
                  setEditCompte(null);
                  setDlgCompte(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Nouveau compte
              </Button>
            </HardGate>
          </div>
          {comptes.length === 0 ? (
            <EmptyState
              title="Aucun compte d'épargne"
              description="Crée-en un pour commencer."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {comptes.map((c) => {
                const actifsCpte = actifs.filter((a) => a.compteId === c.id);
                const isBoursier = c.type === "boursier";
                const solde = soldeCompte(c, mouvements, virementsRecurrents, undefined, actifs);
                const fondEuros = c.fondEuros ?? 0;
                const valeurPositions = actifsCpte.reduce(
                  (s, a) => s + a.quantite * (a.prixActuel ?? a.prixAchat),
                  0
                );
                const tousAvecPrixActuel = actifsCpte.length > 0 && actifsCpte.every((a) => a.prixActuel != null);
                const plusValue = tousAvecPrixActuel
                  ? valeurPositions - actifsCpte.reduce((s, a) => s + a.quantite * a.prixAchat, 0)
                  : null;
                return (
                  <Card key={c.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{c.nom}</CardTitle>
                            {c.type && c.type !== "livret" && (
                              <Badge variant="outline" className="text-xs">
                                {TYPE_LABELS[c.type]}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {isBoursier ? "Portefeuille boursier" : `Taux : ${c.tauxAnnuel}% / an`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditCompte(c);
                              setDlgCompte(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Supprimer "${c.nom}" et tous ses mouvements ?`)) {
                                deleteCompte(c.id);
                                toast.success("Compte supprimé");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isBoursier ? (
                        <div className="space-y-1">
                          <div className="text-2xl font-semibold">{formatEUR(solde)}</div>
                          <div className="text-xs text-ink-muted">
                            {actifsCpte.length > 0
                              ? `${actifsCpte.length} position${actifsCpte.length > 1 ? "s" : ""}`
                              : "Cash uniquement"}
                            {fondEuros > 0 && (
                              <> · Cash : {formatEUR(fondEuros)}</>
                            )}
                            {actifsCpte.length > 0 && (
                              <> · Titres : {formatEUR(valeurPositions)}</>
                            )}
                          </div>
                          {plusValue != null && (
                            <div className={`text-sm font-medium ${plusValue >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {plusValue >= 0 ? "+" : ""}{formatEUR(plusValue)} plus-value latente
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-2xl font-semibold">{formatEUR(solde)}</div>
                      )}
                      {c.description && (
                        <p className="mt-1 text-sm text-ink-muted">{c.description}</p>
                      )}

                      {/* Positions boursières */}
                      {isBoursier && actifsCpte.length > 0 && (
                        <div className="mt-3 divide-y rounded-md border text-xs">
                          {actifsCpte.map((a) => {
                            const valAchat = a.quantite * a.prixAchat;
                            const valActuel = a.prixActuel != null ? a.quantite * a.prixActuel : null;
                            const pv = valActuel != null ? valActuel - valAchat : null;
                            return (
                              <div key={a.id} className="flex items-center justify-between px-2 py-1.5">
                                <div>
                                  <span className="font-medium">{a.nom}</span>
                                  {a.isin && <span className="ml-1.5 text-ink-muted">{a.isin}</span>}
                                  <div className="text-ink-muted">
                                    {a.quantite} × {formatEUR(a.prixAchat)} = {formatEUR(valAchat)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-right">
                                  {pv != null && (
                                    <span className={pv >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                      {pv >= 0 ? "+" : ""}{formatEUR(pv)}
                                    </span>
                                  )}
                                  <div className="flex gap-0.5">
                                    <Button variant="ghost" size="icon" className="h-6 w-6"
                                      onClick={() => { setEditActif(a); setCompteSelActif(c.id); setDlgActif(true); }}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6"
                                      onClick={() => { if (confirm(`Supprimer "${a.nom}" ?`)) { deleteActif(a.id); toast.success("Actif supprimé"); } }}>
                                      <Trash2 className="h-3 w-3 text-rose-600" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {!isBoursier && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => { setCompteSelMvt(c.id); setDlgMvt(true); }}
                          >
                            <ArrowDownToLine className="h-4 w-4" />
                            Mouvement
                          </Button>
                        )}
                        {isBoursier && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditActif(null); setCompteSelActif(c.id); setDlgActif(true); }}
                          >
                            <BarChart3 className="h-4 w-4" />
                            Ajouter position
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="objectifs" className="space-y-4">
          <div className="flex justify-end">
            <HardGate featureKey="objectifs" current={objectifs.length}>
              <Button
                onClick={() => { setEditObj(null); setDlgObj(true); }}
              >
                <Plus className="h-4 w-4" />
                Nouvel objectif
              </Button>
            </HardGate>
          </div>
          {objectifs.length === 0 ? (
            <EmptyState
              title="Aucun objectif"
              description="Définis-en un (voyage, achat, fonds d'urgence...)."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {objectifs.map((o) => {
                const compte = o.compteId ? comptes.find((c) => c.id === o.compteId) : null;
                const actuel = compte ? soldeCompte(compte, mouvements, virementsRecurrents, undefined, actifs) : 0;
                const { pct, restant } = progressionObjectif(o.montantCible, actuel);
                return (
                  <Card key={o.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-ink-muted" />
                          <CardTitle>{o.nom}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon"
                            onClick={() => { setEditObj(o); setDlgObj(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            onClick={() => { if (confirm("Supprimer cet objectif ?")) { deleteObjectif(o.id); toast.success("Objectif supprimé"); } }}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </div>
                      {compte && <CardDescription>Lié à : {compte.nom}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-end justify-between">
                        <span className="text-2xl font-semibold">{formatEUR(actuel)}</span>
                        <span className="text-sm text-ink-muted">/ {formatEUR(o.montantCible)}</span>
                      </div>
                      <div className="space-y-1">
                        <Progress value={pct} className="h-1.5" />
                        <div className="flex justify-between text-xs text-ink-muted">
                          <span>{pct.toFixed(1)}% atteint</span>
                          <span>Reste {formatEUR(restant)}</span>
                        </div>
                      </div>
                      {o.dateCible && (
                        <p className="mt-2 text-xs text-ink-muted">Cible : {formatDate(o.dateCible)}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardContent className="p-0">
              {mouvements.length === 0 ? (
                <EmptyState
                  title="Aucun mouvement enregistré"
                />
              ) : (
                <div className="divide-y">
                  {[...mouvements]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((m) => {
                      const compte = comptes.find((c) => c.id === m.compteId);
                      const isPositif = m.type !== "retrait";
                      const isVirtuel = !!m.virementEpargneId;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-surface/50"
                        >
                          <div className="flex items-center gap-3">
                            {isPositif ? (
                              <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4 text-rose-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 text-sm font-medium">
                                {compte?.nom ?? "—"}{" "}
                                <span className="font-normal text-ink-muted">· {m.type}</span>
                                {isVirtuel && (
                                  <Badge variant="outline" className="text-[10px] py-0">auto</Badge>
                                )}
                              </div>
                              <div className="text-xs text-ink-muted">
                                {formatDate(m.date)}
                                {m.description ? ` · ${m.description}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`font-semibold ${isPositif ? "text-emerald-600" : "text-rose-600"}`}>
                              {isPositif ? "+" : "−"} {formatEUR(m.montant)}
                            </div>
                            {!isVirtuel && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Supprimer ce mouvement ?")) {
                                    deleteMouvement(m.id);
                                    toast.success("Mouvement supprimé");
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-rose-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CompteForm
        key={editCompte?.id ?? "new-compte"}
        open={dlgCompte}
        onOpenChange={setDlgCompte}
        edit={editCompte}
        onSave={(data) => {
          if (editCompte) {
            updateCompte(editCompte.id, data);
            toast.success("Compte modifié");
          } else {
            addCompte(data);
            toast.success("Compte créé");
          }
          setDlgCompte(false);
        }}
      />
      <MouvementForm
        open={dlgMvt}
        onOpenChange={setDlgMvt}
        compteId={compteSelMvt}
        comptes={comptes.filter((c) => c.type !== "boursier")}
        onSave={(data) => {
          addMouvement(data);
          toast.success("Mouvement ajouté");
          setDlgMvt(false);
        }}
      />
      <ObjectifForm
        key={editObj?.id ?? "new-obj"}
        open={dlgObj}
        onOpenChange={setDlgObj}
        edit={editObj}
        comptes={comptes}
        onSave={(data) => {
          if (editObj) {
            updateObjectif(editObj.id, data);
            toast.success("Objectif modifié");
          } else {
            addObjectif(data);
            toast.success("Objectif créé");
          }
          setDlgObj(false);
        }}
      />
      <ActifForm
        key={editActif?.id ?? "new-actif"}
        open={dlgActif}
        onOpenChange={setDlgActif}
        edit={editActif}
        compteId={compteSelActif}
        onSave={(data) => {
          if (editActif) {
            updateActif(editActif.id, data);
            toast.success("Position modifiée");
          } else {
            addActif(data);
            toast.success("Position ajoutée");
          }
          setDlgActif(false);
        }}
      />
    </>
  );
}

// ─── CompteForm ──────────────────────────────────────────────────────────────

function CompteForm({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: CompteEpargne | null;
  onSave: (c: Omit<CompteEpargne, "id">) => void;
}) {
  const [nom, setNom] = useState(edit?.nom ?? "");
  const [solde, setSolde] = useState(edit ? String(edit.soldeInitial) : "0");
  const [fondEuros, setFondEuros] = useState(
    edit?.fondEuros != null ? String(edit.fondEuros) : "0"
  );
  const [dateReference, setDateReference] = useState(edit?.dateReference ?? todayISO());
  const [type, setType] = useState<TypeCompteEpargne>(edit?.type ?? "livret");
  const [modeTaux, setModeTaux] = useState<"annuel" | "mensuel">("annuel");
  const [taux, setTaux] = useState(edit ? String(edit.tauxAnnuel) : "3");
  const [desc, setDesc] = useState(edit?.description ?? "");

  // Conversion taux
  const tauxAnnuelCalcule = modeTaux === "mensuel"
    ? (Math.pow(1 + parseFloat(taux || "0") / 100, 12) - 1) * 100
    : parseFloat(taux || "0");
  const tauxMensuelCalcule = modeTaux === "annuel"
    ? (Math.pow(1 + parseFloat(taux || "0") / 100, 1 / 12) - 1) * 100
    : parseFloat(taux || "0");

  const valider = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    const isBoursier = type === "boursier";
    const s = parseFloat(solde);
    if (!isBoursier && isNaN(s)) return toast.error("Solde invalide");
    const fe = parseFloat(fondEuros);
    if (isBoursier && isNaN(fe)) return toast.error("Fond euros invalide");
    const t = parseFloat(taux);
    if (!isBoursier && isNaN(t)) return toast.error("Taux invalide");
    onSave({
      nom: nom.trim(),
      soldeInitial: isBoursier ? 0 : s,
      tauxAnnuel: isBoursier ? 0 : parseFloat(tauxAnnuelCalcule.toFixed(4)),
      type,
      dateReference: dateReference || undefined,
      fondEuros: isBoursier ? fe : undefined,
      description: desc || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouveau"} compte épargne</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Nom</Label>
              <Input
                placeholder="Livret A, PEL, CTO…"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TypeCompteEpargne)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="livret">Livret</SelectItem>
                  <SelectItem value="assurance-vie">Assurance-vie</SelectItem>
                  <SelectItem value="boursier">Compte boursier</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {type === "boursier" ? (
              <div>
                <Label className="mb-1.5 block">Cash dispo / fond € (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fondEuros}
                  onChange={(e) => setFondEuros(e.target.value)}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Liquidités non investies. Les positions s'ajoutent ensuite.
                </p>
              </div>
            ) : (
              <div>
                <Label className="mb-1.5 block">Solde actuel (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={solde}
                  onChange={(e) => setSolde(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label className="mb-1.5 block">Date de référence</Label>
              <Input
                type="date"
                value={dateReference}
                onChange={(e) => setDateReference(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-muted">
                Date où ce solde est constaté. Avant = historique informatif.
              </p>
            </div>
          </div>
          {type !== "boursier" && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Taux d'intérêt</Label>
                <div className="flex rounded-md border text-xs">
                  <button
                    type="button"
                    onClick={() => setModeTaux("annuel")}
                    className={`px-2 py-1 rounded-l-md ${modeTaux === "annuel" ? "bg-ink text-paper" : "hover:bg-surface"}`}
                  >
                    Annuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeTaux("mensuel")}
                    className={`px-2 py-1 rounded-r-md ${modeTaux === "mensuel" ? "bg-ink text-paper" : "hover:bg-surface"}`}
                  >
                    Mensuel
                  </button>
                </div>
              </div>
              <Input
                type="number"
                step="0.001"
                value={taux}
                onChange={(e) => setTaux(e.target.value)}
                placeholder={modeTaux === "annuel" ? "Ex : 3 (% / an)" : "Ex : 0.25 (% / mois)"}
              />
              {parseFloat(taux) > 0 && (
                <p className="mt-1 text-xs text-ink-muted">
                  {modeTaux === "annuel"
                    ? `≈ ${tauxMensuelCalcule.toFixed(3)}% / mois`
                    : `≈ ${tauxAnnuelCalcule.toFixed(3)}% / an`}
                </p>
              )}
            </div>
          )}
          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={valider}>{edit ? "Modifier" : "Créer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── MouvementForm ────────────────────────────────────────────────────────────

function MouvementForm({
  open,
  onOpenChange,
  compteId,
  comptes,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  compteId: string | null;
  comptes: CompteEpargne[];
  onSave: (m: Omit<MouvementEpargne, "id">) => void;
}) {
  const [selCompte, setSelCompte] = useState<string>("");
  const [type, setType] = useState<"versement" | "retrait" | "interet">("versement");
  const [date, setDate] = useState(todayISO());
  const [montant, setMontant] = useState("");
  const [desc, setDesc] = useState("");

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setSelCompte(compteId ?? comptes[0]?.id ?? "");
      setType("versement");
      setDate(todayISO());
      setMontant("");
      setDesc("");
    }
    onOpenChange(b);
  };

  const valider = () => {
    if (!selCompte) return toast.error("Choisis un compte");
    const m = parseFloat(montant);
    if (!m || m <= 0) return toast.error("Montant invalide");
    onSave({ compteId: selCompte, type, date, montant: m, description: desc || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouveau mouvement</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Compte</Label>
            <Select value={selCompte} onValueChange={setSelCompte}>
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {comptes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="versement">Versement</SelectItem>
                  <SelectItem value="retrait">Retrait</SelectItem>
                  <SelectItem value="interet">Intérêts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
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
          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={valider}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ObjectifForm ─────────────────────────────────────────────────────────────

function ObjectifForm({
  open,
  onOpenChange,
  edit,
  comptes,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: Objectif | null;
  comptes: CompteEpargne[];
  onSave: (o: Omit<Objectif, "id">) => void;
}) {
  const [nom, setNom] = useState(edit?.nom ?? "");
  const [cible, setCible] = useState(edit ? String(edit.montantCible) : "");
  const [dateCible, setDateCible] = useState(edit?.dateCible ?? "");
  const [compteId, setCompteId] = useState(edit?.compteId ?? "");
  const [desc, setDesc] = useState(edit?.description ?? "");

  const valider = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    const c = parseFloat(cible);
    if (!c || c <= 0) return toast.error("Montant cible invalide");
    onSave({
      nom: nom.trim(),
      montantCible: c,
      dateCible: dateCible || undefined,
      compteId: compteId || undefined,
      description: desc || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{edit ? "Modifier" : "Nouvel"} objectif</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Nom</Label>
            <Input
              placeholder="Voyage, voiture, fonds d'urgence..."
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Montant cible (€)</Label>
              <Input type="number" step="0.01" value={cible} onChange={(e) => setCible(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Date cible (optionnelle)</Label>
              <Input type="date" value={dateCible} onChange={(e) => setDateCible(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Compte lié (optionnel)</Label>
            <Select value={compteId || "none"} onValueChange={(v) => setCompteId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {comptes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={valider}>{edit ? "Modifier" : "Créer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ActifForm ────────────────────────────────────────────────────────────────

function ActifForm({
  open,
  onOpenChange,
  edit,
  compteId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: ActifBoursier | null;
  compteId: string | null;
  onSave: (a: Omit<ActifBoursier, "id">) => void;
}) {
  const [nom, setNom] = useState(edit?.nom ?? "");
  const [isin, setIsin] = useState(edit?.isin ?? "");
  const [quantite, setQuantite] = useState(edit ? String(edit.quantite) : "");
  const [prixAchat, setPrixAchat] = useState(edit ? String(edit.prixAchat) : "");
  const [dateAchat, setDateAchat] = useState(edit?.dateAchat ?? todayISO());
  const [prixActuel, setPrixActuel] = useState(edit?.prixActuel != null ? String(edit.prixActuel) : "");
  const [dateMAJ, setDateMAJ] = useState(edit?.dateMAJ ?? "");
  const [desc, setDesc] = useState(edit?.description ?? "");

  const qte = parseFloat(quantite) || 0;
  const pa = parseFloat(prixAchat) || 0;
  const pc = parseFloat(prixActuel) || 0;
  const valAchat = qte * pa;
  const valActuel = pc > 0 ? qte * pc : null;
  const plusValue = valActuel != null ? valActuel - valAchat : null;

  const valider = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    if (!compteId) return toast.error("Compte non défini");
    const q = parseFloat(quantite);
    if (!q || q <= 0) return toast.error("Quantité invalide");
    const p = parseFloat(prixAchat);
    if (isNaN(p) || p < 0) return toast.error("Prix d'achat invalide");
    onSave({
      compteId,
      nom: nom.trim(),
      isin: isin.trim() || undefined,
      quantite: q,
      prixAchat: p,
      dateAchat,
      prixActuel: prixActuel ? parseFloat(prixActuel) : undefined,
      dateMAJ: dateMAJ || undefined,
      description: desc || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Ajouter"} une position</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Nom / Ticker</Label>
              <Input
                placeholder="Apple, MSCI World, Obligations…"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">ISIN (optionnel)</Label>
              <Input
                placeholder="FR0010315770"
                value={isin}
                onChange={(e) => setIsin(e.target.value.toUpperCase())}
                maxLength={12}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Quantité</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Prix d'achat unitaire (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={prixAchat}
                onChange={(e) => setPrixAchat(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Date d'achat</Label>
            <Input type="date" value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} />
          </div>
          {valAchat > 0 && (
            <div className="rounded-md bg-surface/60 px-3 py-2 text-xs text-ink-muted">
              Valeur d'achat : <span className="font-medium text-ink">{formatEUR(valAchat)}</span>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Prix actuel (optionnel — pour calculer la plus-value)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Prix actuel unitaire (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prixActuel}
                  onChange={(e) => setPrixActuel(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Date mise à jour</Label>
                <Input type="date" value={dateMAJ} onChange={(e) => setDateMAJ(e.target.value)} />
              </div>
            </div>
            {plusValue != null && (
              <div className={`mt-2 flex items-center gap-2 text-sm font-medium ${plusValue >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {plusValue >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                Plus-value latente : {plusValue >= 0 ? "+" : ""}{formatEUR(plusValue)}
                {valAchat > 0 && <span className="text-xs font-normal text-ink-muted">({((plusValue / valAchat) * 100).toFixed(1)}%)</span>}
              </div>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={valider}>{edit ? "Modifier" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
