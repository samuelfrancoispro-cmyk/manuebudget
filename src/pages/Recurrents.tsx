import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Repeat, CalendarClock, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { TransactionRecurrente, TypeTransaction, Frequence } from "@/types";
import { formatEUR, formatDate, monthKey, todayISO } from "@/lib/utils";
import {
  expandRecurrentesPourMois,
  expandVirementsTransactionsPourMois,
  labelFrequence,
  prochaineOccurrence,
} from "@/lib/calculs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

function dateDebutOf(r: TransactionRecurrente): string {
  if (r.dateDebut) return r.dateDebut;
  if (r.moisDebut) {
    const j = Math.min(Math.max(r.jourMois ?? 1, 1), 28);
    return `${r.moisDebut}-${String(j).padStart(2, "0")}`;
  }
  return todayISO();
}
function dateFinOf(r: TransactionRecurrente): string | null {
  if (r.dateFin) return r.dateFin;
  if (r.moisFin) {
    const j = Math.min(Math.max(r.jourMois ?? 28, 1), 28);
    return `${r.moisFin}-${String(j).padStart(2, "0")}`;
  }
  return null;
}

export default function RecurrentsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const {
    recurrentes,
    virementsRecurrents,
    comptes,
    categories,
    comptesCourants,
    addRecurrente,
    updateRecurrente,
    deleteRecurrente,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<TransactionRecurrente | null>(null);

  const totalMoisCourant = useMemo(() => {
    const moisCourant = monthKey(new Date().toISOString());
    const recs = expandRecurrentesPourMois(recurrentes, moisCourant);
    const virs = expandVirementsTransactionsPourMois(virementsRecurrents, comptes, moisCourant);
    const all = [...recs, ...virs];
    let revenus = 0;
    let depenses = 0;
    for (const t of all) {
      if (t.type === "revenu") revenus += t.montant;
      else depenses += t.montant;
    }
    return { revenus, depenses, solde: revenus - depenses };
  }, [recurrentes, virementsRecurrents, comptes]);

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Charges & revenus récurrents"
          description="Loyer, salaire, abonnements, course du dimanche… tout ce qui revient à intervalle régulier."
          action={
            <Button
              onClick={() => {
                setEdit(null);
                setOpen(true);
              }}
              disabled={comptesCourants.length === 0}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          }
        />
      )}
      {embedded && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            disabled={comptesCourants.length === 0}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Mini
          label="Revenus du mois (récurrents)"
          valeur={formatEUR(totalMoisCourant.revenus)}
          className="text-emerald-600"
        />
        <Mini
          label="Charges du mois (récurrents)"
          valeur={formatEUR(totalMoisCourant.depenses)}
          className="text-rose-600"
        />
        <Mini
          label="Net mensuel récurrent"
          valeur={formatEUR(totalMoisCourant.solde)}
          className={totalMoisCourant.solde >= 0 ? "text-emerald-600" : "text-rose-600"}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {recurrentes.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucun élément récurrent. Ajoute ton loyer, ton salaire, tes abonnements…
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Prochaine</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[100px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurrentes.map((r) => {
                  const cat = categories.find((c) => c.id === r.categorieId);
                  const cc = comptesCourants.find((c) => c.id === r.compteCourantId);
                  const freq = r.frequence ?? "mois";
                  const intervalle = r.intervalle ?? 1;
                  const debut = dateDebutOf(r);
                  const fin = dateFinOf(r);
                  const proch = prochaineOccurrence(debut, fin, freq, intervalle);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4 font-medium">{r.libelle}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === "revenu" ? "success" : "secondary"}>
                          {r.type === "revenu" ? "Revenu" : "Charge"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cc?.nom ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat?.couleur ?? "#94a3b8" }}
                          />
                          {cat?.nom ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {labelFrequence(freq, intervalle)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {proch ? formatDate(proch) : "Terminée"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          r.type === "revenu" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {r.type === "revenu" ? "+" : "−"} {formatEUR(r.montant)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEdit(r);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Supprimer "${r.libelle}" ?`)) {
                                deleteRecurrente(r.id);
                                toast.success("Récurrent supprimé");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Virements automatiques en lecture seule */}
                {virementsRecurrents.map((v) => {
                  const cc = comptesCourants.find((c) => c.id === v.compteCourantId);
                  const ce = comptes.find((c) => c.id === v.compteEpargneId);
                  const proch = prochaineOccurrence(v.dateDebut, v.dateFin ?? null, v.frequence, v.intervalle);
                  return (
                    <TableRow key={`vir-${v.id}`} className="bg-violet-50/40 dark:bg-violet-950/20">
                      <TableCell className="pl-4 font-medium">
                        <span className="flex items-center gap-1.5">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-violet-500" />
                          {v.libelle}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-violet-300 text-violet-700 dark:text-violet-400">
                          Virement épargne
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cc?.nom ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        → {ce?.nom ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {labelFrequence(v.frequence, v.intervalle)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {proch ? formatDate(proch) : "Terminé"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-violet-600">
                        − {formatEUR(v.montant)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="text-xs text-muted-foreground italic">auto</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecurrentForm
        key={edit?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        edit={edit}
        onSave={(data) => {
          if (edit) {
            // On efface les vieux champs pour ne plus les utiliser
            updateRecurrente(edit.id, {
              ...data,
              jourMois: undefined,
              moisDebut: undefined,
              moisFin: undefined,
            });
            toast.success("Récurrent modifié");
          } else {
            addRecurrente(data);
            toast.success("Récurrent ajouté");
          }
          setOpen(false);
        }}
      />
    </>
  );
}

function Mini({
  label,
  valeur,
  className,
}: {
  label: string;
  valeur: string;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Repeat className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-semibold ${className ?? ""}`}>{valeur}</div>
      </CardContent>
    </Card>
  );
}

function RecurrentForm({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: TransactionRecurrente | null;
  onSave: (r: Omit<TransactionRecurrente, "id">) => void;
}) {
  const { categories, comptesCourants } = useStore();

  const initialDebut = edit ? dateDebutOf(edit) : todayISO();
  const initialFin = edit ? dateFinOf(edit) ?? "" : "";

  const [libelle, setLibelle] = useState(edit?.libelle ?? "");
  const [type, setType] = useState<TypeTransaction>(edit?.type ?? "depense");
  const [montant, setMontant] = useState(edit ? String(edit.montant) : "");
  const [categorieId, setCategorieId] = useState(edit?.categorieId ?? "");
  const [compteCourantId, setCompteCourantId] = useState(
    edit?.compteCourantId ?? comptesCourants[0]?.id ?? ""
  );
  const [frequence, setFrequence] = useState<Frequence>(edit?.frequence ?? "mois");
  const [intervalle, setIntervalle] = useState(edit ? String(edit.intervalle ?? 1) : "1");
  const [dateDebut, setDateDebut] = useState(initialDebut);
  const [dateFin, setDateFin] = useState(initialFin);
  const [description, setDescription] = useState(edit?.description ?? "");

  const catsFiltrees = categories.filter((c) => c.type === type);

  const handleOpenChange = (b: boolean) => {
    if (b) {
      const dd = edit ? dateDebutOf(edit) : todayISO();
      const df = edit ? dateFinOf(edit) ?? "" : "";
      setLibelle(edit?.libelle ?? "");
      setType(edit?.type ?? "depense");
      setMontant(edit ? String(edit.montant) : "");
      setCategorieId(edit?.categorieId ?? "");
      setCompteCourantId(edit?.compteCourantId ?? comptesCourants[0]?.id ?? "");
      setFrequence(edit?.frequence ?? "mois");
      setIntervalle(edit ? String(edit.intervalle ?? 1) : "1");
      setDateDebut(dd);
      setDateFin(df);
      setDescription(edit?.description ?? "");
    }
    onOpenChange(b);
  };

  const valider = () => {
    if (!libelle.trim()) return toast.error("Libellé requis");
    const m = parseFloat(montant);
    if (!m || m <= 0) return toast.error("Montant invalide");
    if (!categorieId) return toast.error("Catégorie requise");
    if (!compteCourantId) return toast.error("Compte requis");
    const i = parseInt(intervalle);
    if (!i || i < 1) return toast.error("Intervalle invalide (≥ 1)");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDebut)) return toast.error("Date début invalide");
    if (dateFin && !/^\d{4}-\d{2}-\d{2}$/.test(dateFin)) return toast.error("Date fin invalide");
    if (dateFin && dateFin < dateDebut) return toast.error("Date fin avant début");
    onSave({
      libelle: libelle.trim(),
      type,
      montant: m,
      categorieId,
      compteCourantId,
      frequence,
      intervalle: i,
      dateDebut,
      dateFin: dateFin || undefined,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouveau"} récurrent</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Choisis une fréquence libre : tous les jours, toutes les 2 semaines, chaque trimestre…
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Libellé</Label>
            <Input
              placeholder="Loyer, Salaire, Netflix…"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as TypeTransaction);
                  setCategorieId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="depense">Charge / Dépense</SelectItem>
                  <SelectItem value="revenu">Revenu</SelectItem>
                </SelectContent>
              </Select>
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
              <Label className="mb-1.5 block">Compte</Label>
              <Select value={compteCourantId} onValueChange={setCompteCourantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {comptesCourants.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} {c.type === "joint" ? "(joint)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Catégorie</Label>
              <Select value={categorieId} onValueChange={setCategorieId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {catsFiltrees.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Fréquence</Label>
              <Select value={frequence} onValueChange={(v) => setFrequence(v as Frequence)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                  <SelectItem value="annee">Année</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Tous les… (intervalle)</Label>
              <Input
                type="number"
                min="1"
                value={intervalle}
                onChange={(e) => setIntervalle(e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            → {labelFrequence(frequence, parseInt(intervalle) || 1)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Date 1ère échéance</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Date de fin (optionnelle)</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={valider}>{edit ? "Modifier" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
