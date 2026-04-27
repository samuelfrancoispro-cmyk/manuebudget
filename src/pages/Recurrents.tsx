import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { TransactionRecurrente, TypeTransaction } from "@/types";
import { formatEUR, monthKey, monthLabel } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function RecurrentsPage() {
  const {
    recurrentes,
    categories,
    comptesCourants,
    addRecurrente,
    updateRecurrente,
    deleteRecurrente,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<TransactionRecurrente | null>(null);

  const totalMois = useMemo(() => {
    const moisCourant = monthKey(new Date().toISOString());
    let revenus = 0;
    let depenses = 0;
    for (const r of recurrentes) {
      if (r.moisDebut > moisCourant) continue;
      if (r.moisFin && r.moisFin < moisCourant) continue;
      if (r.type === "revenu") revenus += r.montant;
      else depenses += r.montant;
    }
    return { revenus, depenses, solde: revenus - depenses };
  }, [recurrentes]);

  return (
    <>
      <PageHeader
        title="Charges & revenus récurrents"
        description="Loyer, crédit, salaire, abonnements… tout ce qui tombe chaque mois automatiquement."
        action={
          <Button onClick={() => { setEdit(null); setOpen(true); }} disabled={comptesCourants.length === 0}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Mini label="Revenus mensuels" valeur={formatEUR(totalMois.revenus)} className="text-emerald-600" />
        <Mini label="Charges mensuelles" valeur={formatEUR(totalMois.depenses)} className="text-rose-600" />
        <Mini
          label="Net mensuel récurrent"
          valeur={formatEUR(totalMois.solde)}
          className={totalMois.solde >= 0 ? "text-emerald-600" : "text-rose-600"}
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
                  <TableHead>Jour</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[100px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurrentes.map((r) => {
                  const cat = categories.find((c) => c.id === r.categorieId);
                  const cc = comptesCourants.find((c) => c.id === r.compteCourantId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4 font-medium">{r.libelle}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === "revenu" ? "success" : "secondary"}>
                          {r.type === "revenu" ? "Revenu" : "Charge"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cc?.nom ?? "—"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat?.couleur ?? "#94a3b8" }}
                          />
                          {cat?.nom ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Le {r.jourMois}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        Depuis {monthLabel(r.moisDebut)}
                        {r.moisFin ? ` → ${monthLabel(r.moisFin)}` : ""}
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
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecurrentForm
        open={open}
        onOpenChange={setOpen}
        edit={edit}
        onSave={(data) => {
          if (edit) {
            updateRecurrente(edit.id, data);
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

function Mini({ label, valeur, className }: { label: string; valeur: string; className?: string }) {
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
  const moisAuj = monthKey(new Date().toISOString());

  const [libelle, setLibelle] = useState(edit?.libelle ?? "");
  const [type, setType] = useState<TypeTransaction>(edit?.type ?? "depense");
  const [montant, setMontant] = useState(edit ? String(edit.montant) : "");
  const [categorieId, setCategorieId] = useState(edit?.categorieId ?? "");
  const [compteCourantId, setCompteCourantId] = useState(
    edit?.compteCourantId ?? comptesCourants[0]?.id ?? ""
  );
  const [jourMois, setJourMois] = useState(edit ? String(edit.jourMois) : "1");
  const [moisDebut, setMoisDebut] = useState(edit?.moisDebut ?? moisAuj);
  const [moisFin, setMoisFin] = useState(edit?.moisFin ?? "");
  const [description, setDescription] = useState(edit?.description ?? "");

  const catsFiltrees = categories.filter((c) => c.type === type);

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setLibelle(edit?.libelle ?? "");
      setType(edit?.type ?? "depense");
      setMontant(edit ? String(edit.montant) : "");
      setCategorieId(edit?.categorieId ?? "");
      setCompteCourantId(edit?.compteCourantId ?? comptesCourants[0]?.id ?? "");
      setJourMois(edit ? String(edit.jourMois) : "1");
      setMoisDebut(edit?.moisDebut ?? moisAuj);
      setMoisFin(edit?.moisFin ?? "");
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
    const j = parseInt(jourMois);
    if (!j || j < 1 || j > 28) return toast.error("Jour entre 1 et 28");
    if (!/^\d{4}-\d{2}$/.test(moisDebut)) return toast.error("Mois début invalide");
    if (moisFin && !/^\d{4}-\d{2}$/.test(moisFin)) return toast.error("Mois fin invalide");
    onSave({
      libelle: libelle.trim(),
      type,
      montant: m,
      categorieId,
      compteCourantId,
      jourMois: j,
      moisDebut,
      moisFin: moisFin || undefined,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouveau"} récurrent</DialogTitle>
          <DialogDescription>
            Tombe automatiquement chaque mois au jour indiqué.
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block">Jour du mois</Label>
              <Input
                type="number"
                min="1"
                max="28"
                value={jourMois}
                onChange={(e) => setJourMois(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Mois début</Label>
              <Input
                type="month"
                value={moisDebut}
                onChange={(e) => setMoisDebut(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Mois fin (opt.)</Label>
              <Input
                type="month"
                value={moisFin}
                onChange={(e) => setMoisFin(e.target.value)}
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
