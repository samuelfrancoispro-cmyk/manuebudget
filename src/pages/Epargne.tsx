import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, Target } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { CompteEpargne, MouvementEpargne, Objectif } from "@/types";
import { formatEUR, formatDate, todayISO } from "@/lib/utils";
import { soldeCompte, totalEpargne, progressionObjectif } from "@/lib/calculs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function EpargnePage() {
  const {
    comptes,
    mouvements,
    objectifs,
    addCompte,
    updateCompte,
    deleteCompte,
    addMouvement,
    deleteMouvement,
    addObjectif,
    updateObjectif,
    deleteObjectif,
  } = useStore();

  const [dlgCompte, setDlgCompte] = useState(false);
  const [editCompte, setEditCompte] = useState<CompteEpargne | null>(null);
  const [dlgMvt, setDlgMvt] = useState(false);
  const [compteSelMvt, setCompteSelMvt] = useState<string | null>(null);
  const [dlgObj, setDlgObj] = useState(false);
  const [editObj, setEditObj] = useState<Objectif | null>(null);

  const total = useMemo(() => totalEpargne(comptes, mouvements), [comptes, mouvements]);

  return (
    <>
      <PageHeader
        title="Épargne"
        description="Tes comptes, mouvements et objectifs."
        action={
          <Badge variant="outline" className="text-base px-3 py-1.5">
            Total : <span className="ml-1.5 font-semibold">{formatEUR(total)}</span>
          </Badge>
        }
      />

      <Tabs defaultValue="comptes">
        <TabsList>
          <TabsTrigger value="comptes">Comptes</TabsTrigger>
          <TabsTrigger value="objectifs">Objectifs</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="comptes" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditCompte(null);
                setDlgCompte(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nouveau compte
            </Button>
          </div>
          {comptes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Aucun compte d'épargne. Crée-en un pour commencer.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {comptes.map((c) => {
                const solde = soldeCompte(c, mouvements);
                return (
                  <Card key={c.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{c.nom}</CardTitle>
                          <CardDescription>
                            Taux : {c.tauxAnnuel}% / an
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
                              if (
                                confirm(
                                  `Supprimer "${c.nom}" et tous ses mouvements ?`
                                )
                              ) {
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
                      <div className="text-2xl font-semibold">{formatEUR(solde)}</div>
                      {c.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setCompteSelMvt(c.id);
                            setDlgMvt(true);
                          }}
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                          Mouvement
                        </Button>
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
            <Button
              onClick={() => {
                setEditObj(null);
                setDlgObj(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nouvel objectif
            </Button>
          </div>
          {objectifs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Aucun objectif. Définis-en un (voyage, achat, fonds d'urgence...).
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {objectifs.map((o) => {
                const compte = o.compteId ? comptes.find((c) => c.id === o.compteId) : null;
                const actuel = compte ? soldeCompte(compte, mouvements) : 0;
                const { pct, restant } = progressionObjectif(o.montantCible, actuel);
                return (
                  <Card key={o.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <CardTitle>{o.nom}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditObj(o);
                              setDlgObj(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Supprimer cet objectif ?")) {
                                deleteObjectif(o.id);
                                toast.success("Objectif supprimé");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </div>
                      {compte && <CardDescription>Lié à : {compte.nom}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 flex items-end justify-between">
                        <span className="text-2xl font-semibold">{formatEUR(actuel)}</span>
                        <span className="text-sm text-muted-foreground">
                          / {formatEUR(o.montantCible)}
                        </span>
                      </div>
                      <Progress value={pct} />
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{pct.toFixed(1)}% atteint</span>
                        <span className="font-medium">Reste {formatEUR(restant)}</span>
                      </div>
                      {o.dateCible && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Cible : {formatDate(o.dateCible)}
                        </p>
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
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Aucun mouvement enregistré.
                </p>
              ) : (
                <div className="divide-y">
                  {[...mouvements]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((m) => {
                      const compte = comptes.find((c) => c.id === m.compteId);
                      const isPositif = m.type !== "retrait";
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            {isPositif ? (
                              <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4 text-rose-600" />
                            )}
                            <div>
                              <div className="text-sm font-medium">
                                {compte?.nom ?? "—"}{" "}
                                <span className="font-normal text-muted-foreground">
                                  · {m.type}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(m.date)}
                                {m.description ? ` · ${m.description}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`font-semibold ${
                                isPositif ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {isPositif ? "+" : "−"} {formatEUR(m.montant)}
                            </div>
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
        comptes={comptes}
        onSave={(data) => {
          addMouvement(data);
          toast.success("Mouvement ajouté");
          setDlgMvt(false);
        }}
      />
      <ObjectifForm
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
    </>
  );
}

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
  const [taux, setTaux] = useState(edit ? String(edit.tauxAnnuel) : "3");
  const [desc, setDesc] = useState(edit?.description ?? "");

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setNom(edit?.nom ?? "");
      setSolde(edit ? String(edit.soldeInitial) : "0");
      setTaux(edit ? String(edit.tauxAnnuel) : "3");
      setDesc(edit?.description ?? "");
    }
    onOpenChange(b);
  };

  const valider = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    const s = parseFloat(solde);
    const t = parseFloat(taux);
    if (isNaN(s)) return toast.error("Solde invalide");
    if (isNaN(t)) return toast.error("Taux invalide");
    onSave({ nom: nom.trim(), soldeInitial: s, tauxAnnuel: t, description: desc || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouveau"} compte épargne</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Nom</Label>
            <Input
              placeholder="Livret A, PEL..."
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Solde initial (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={solde}
                onChange={(e) => setSolde(e.target.value)}
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
        <DialogHeader>
          <DialogTitle>Nouveau mouvement</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Compte</Label>
            <Select value={selCompte} onValueChange={setSelCompte}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {comptes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setNom(edit?.nom ?? "");
      setCible(edit ? String(edit.montantCible) : "");
      setDateCible(edit?.dateCible ?? "");
      setCompteId(edit?.compteId ?? "");
      setDesc(edit?.description ?? "");
    }
    onOpenChange(b);
  };

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouvel"} objectif</DialogTitle>
        </DialogHeader>
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
              <Input
                type="number"
                step="0.01"
                value={cible}
                onChange={(e) => setCible(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Date cible (optionnelle)</Label>
              <Input
                type="date"
                value={dateCible}
                onChange={(e) => setDateCible(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Compte lié (optionnel)</Label>
            <Select
              value={compteId || "none"}
              onValueChange={(v) => setCompteId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {comptes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>{edit ? "Modifier" : "Créer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
