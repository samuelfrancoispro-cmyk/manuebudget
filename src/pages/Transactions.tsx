import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { Transaction, TypeTransaction } from "@/types";
import { formatEUR, formatDate, monthKey, monthLabel, todayISO } from "@/lib/utils";
import { moisDisponibles } from "@/lib/calculs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    comptesCourants,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useStore();

  const [filtreMois, setFiltreMois] = useState<string>("all");
  const [filtreType, setFiltreType] = useState<string>("all");
  const [filtreCat, setFiltreCat] = useState<string>("all");
  const [filtreCompte, setFiltreCompte] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Transaction | null>(null);

  const moisListe = useMemo(() => moisDisponibles(transactions), [transactions]);

  const filtrees = useMemo(() => {
    return [...transactions]
      .filter((t) => filtreMois === "all" || monthKey(t.date) === filtreMois)
      .filter((t) => filtreType === "all" || t.type === filtreType)
      .filter((t) => filtreCat === "all" || t.categorieId === filtreCat)
      .filter((t) => filtreCompte === "all" || t.compteCourantId === filtreCompte)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filtreMois, filtreType, filtreCat, filtreCompte]);

  const totaux = useMemo(() => {
    const r = filtrees.filter((t) => t.type === "revenu").reduce((s, t) => s + t.montant, 0);
    const d = filtrees.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0);
    return { revenus: r, depenses: d, solde: r - d };
  }, [filtrees]);

  const ouvrirAjout = () => {
    setEdit(null);
    setOpen(true);
  };
  const ouvrirEdit = (t: Transaction) => {
    setEdit(t);
    setOpen(true);
  };
  const supprimer = (id: string) => {
    if (confirm("Supprimer cette transaction ?")) {
      deleteTransaction(id);
      toast.success("Transaction supprimée");
    }
  };

  return (
    <>
      <PageHeader
        title="Transactions ponctuelles"
        description="Dépenses et revenus exceptionnels (les récurrents sont gérés à part)."
        action={
          <Button onClick={ouvrirAjout} disabled={comptesCourants.length === 0}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex-1 min-w-[160px]">
            <Label className="mb-1.5 block text-xs">Mois</Label>
            <Select value={filtreMois} onValueChange={setFiltreMois}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {moisListe.map((m) => (
                  <SelectItem key={m} value={m}>
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <Label className="mb-1.5 block text-xs">Type</Label>
            <Select value={filtreType} onValueChange={setFiltreType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="revenu">Revenus</SelectItem>
                <SelectItem value="depense">Dépenses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <Label className="mb-1.5 block text-xs">Compte</Label>
            <Select value={filtreCompte} onValueChange={setFiltreCompte}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {comptesCourants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <Label className="mb-1.5 block text-xs">Catégorie</Label>
            <Select value={filtreCat} onValueChange={setFiltreCat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 text-sm">
            <Recap label="Revenus" valeur={formatEUR(totaux.revenus)} className="text-emerald-600" />
            <Recap label="Dépenses" valeur={formatEUR(totaux.depenses)} className="text-rose-600" />
            <Recap
              label="Solde"
              valeur={formatEUR(totaux.solde)}
              className={totaux.solde >= 0 ? "text-emerald-600" : "text-rose-600"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtrees.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {comptesCourants.length === 0
                ? "Crée d'abord un compte courant dans Paramètres."
                : "Aucune transaction. Clique sur « Ajouter »."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[100px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrees.map((t) => {
                  const cat = categories.find((c) => c.id === t.categorieId);
                  const cc = comptesCourants.find((c) => c.id === t.compteCourantId);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="pl-4 text-muted-foreground">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.type === "revenu" ? "success" : "secondary"}>
                          {t.type === "revenu" ? "Revenu" : "Dépense"}
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
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => ouvrirEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => supprimer(t.id)}>
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

      <TransactionForm
        open={open}
        onOpenChange={setOpen}
        edit={edit}
        onSave={(data) => {
          if (edit) {
            updateTransaction(edit.id, data);
            toast.success("Transaction modifiée");
          } else {
            addTransaction(data);
            toast.success("Transaction ajoutée");
          }
          setOpen(false);
        }}
      />
    </>
  );
}

function Recap({ label, valeur, className }: { label: string; valeur: string; className?: string }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${className ?? ""}`}>{valeur}</div>
    </div>
  );
}

function TransactionForm({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: Transaction | null;
  onSave: (t: Omit<Transaction, "id">) => void;
}) {
  const { categories, comptesCourants } = useStore();
  const [type, setType] = useState<TypeTransaction>(edit?.type ?? "depense");
  const [date, setDate] = useState<string>(edit?.date ?? todayISO());
  const [montant, setMontant] = useState<string>(edit ? String(edit.montant) : "");
  const [categorieId, setCategorieId] = useState<string>(edit?.categorieId ?? "");
  const [compteCourantId, setCompteCourantId] = useState<string>(
    edit?.compteCourantId ?? comptesCourants[0]?.id ?? ""
  );
  const [description, setDescription] = useState<string>(edit?.description ?? "");

  const catsFiltrees = categories.filter((c) => c.type === type);

  const reinit = () => {
    setType(edit?.type ?? "depense");
    setDate(edit?.date ?? todayISO());
    setMontant(edit ? String(edit.montant) : "");
    setCategorieId(edit?.categorieId ?? "");
    setCompteCourantId(edit?.compteCourantId ?? comptesCourants[0]?.id ?? "");
    setDescription(edit?.description ?? "");
  };

  const handleOpenChange = (b: boolean) => {
    if (b) reinit();
    onOpenChange(b);
  };

  const valider = () => {
    const m = parseFloat(montant);
    if (!m || m <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!categorieId) {
      toast.error("Choisis une catégorie");
      return;
    }
    if (!compteCourantId) {
      toast.error("Choisis un compte");
      return;
    }
    onSave({
      type,
      date,
      montant: m,
      categorieId,
      compteCourantId,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouvelle"} transaction</DialogTitle>
          <DialogDescription>
            Renseigne les informations puis valide.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
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
                  <SelectItem value="depense">Dépense</SelectItem>
                  <SelectItem value="revenu">Revenu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Montant (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
              />
            </div>
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
          <div>
            <Label className="mb-1.5 block">Description (optionnelle)</Label>
            <Textarea
              placeholder="Note, libellé…"
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
