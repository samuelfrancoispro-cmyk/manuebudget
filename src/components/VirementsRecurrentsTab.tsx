import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowRightLeft, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { VirementRecurrent, Frequence } from "@/types";
import { formatEUR, formatDate, todayISO, monthKey } from "@/lib/utils";
import {
  expandVirementsTransactionsPourMois,
  labelFrequence,
  prochaineOccurrence,
} from "@/lib/calculs";
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

export default function VirementsRecurrentsTab() {
  const {
    virementsRecurrents,
    comptesCourants,
    comptes,
    addVirementRecurrent,
    updateVirementRecurrent,
    deleteVirementRecurrent,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<VirementRecurrent | null>(null);

  const totalMois = useMemo(() => {
    const moisCourant = monthKey(new Date().toISOString());
    const all = expandVirementsTransactionsPourMois(virementsRecurrents, comptes, moisCourant);
    return all.reduce((sum, t) => sum + t.montant, 0);
  }, [virementsRecurrents, comptes]);

  const dispoComptes = comptesCourants.length > 0 && comptes.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Virements ce mois" valeur={formatEUR(totalMois)} />
        <Mini
          label="Programmés"
          valeur={`${virementsRecurrents.length} virement${virementsRecurrents.length > 1 ? "s" : ""}`}
        />
        <div className="flex items-center justify-end">
          <Button
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            disabled={!dispoComptes}
          >
            <Plus className="h-4 w-4" />
            Nouveau virement
          </Button>
        </div>
      </div>

      {!dispoComptes && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-ink-muted">
            Crée d'abord un compte courant ET un compte épargne pour pouvoir programmer un virement.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {virementsRecurrents.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-muted">
              Aucun virement automatique. Programme un mouvement régulier d'un compte courant
              vers un compte épargne (mise de côté mensuelle, épargne projet…).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Libellé</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Vers</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Prochaine</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[100px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {virementsRecurrents.map((v) => {
                  const cc = comptesCourants.find((c) => c.id === v.compteCourantId);
                  const ce = comptes.find((c) => c.id === v.compteEpargneId);
                  const proch = prochaineOccurrence(
                    v.dateDebut,
                    v.dateFin ?? null,
                    v.frequence,
                    v.intervalle
                  );
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="pl-4 font-medium">{v.libelle}</TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {cc?.nom ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <ArrowRightLeft className="h-3 w-3 text-ink-muted" />
                          {ce?.nom ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted">
                        {labelFrequence(v.frequence, v.intervalle)}
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted">
                        {proch ? formatDate(proch) : "Terminé"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatEUR(v.montant)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEdit(v);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Supprimer "${v.libelle}" ?`)) {
                                deleteVirementRecurrent(v.id);
                                toast.success("Virement supprimé");
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

      <VirementForm
        key={edit?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        edit={edit}
        onSave={(data) => {
          if (edit) {
            updateVirementRecurrent(edit.id, data);
            toast.success("Virement modifié");
          } else {
            addVirementRecurrent(data);
            toast.success("Virement programmé");
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

function Mini({ label, valeur }: { label: string; valeur: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold">{valeur}</div>
      </CardContent>
    </Card>
  );
}

function VirementForm({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: VirementRecurrent | null;
  onSave: (v: Omit<VirementRecurrent, "id">) => void;
}) {
  const { comptesCourants, comptes } = useStore();

  const [libelle, setLibelle] = useState(edit?.libelle ?? "");
  const [compteCourantId, setCompteCourantId] = useState(
    edit?.compteCourantId ?? comptesCourants[0]?.id ?? ""
  );
  const [compteEpargneId, setCompteEpargneId] = useState(
    edit?.compteEpargneId ?? comptes[0]?.id ?? ""
  );
  const [montant, setMontant] = useState(edit ? String(edit.montant) : "");
  const [frequence, setFrequence] = useState<Frequence>(edit?.frequence ?? "mois");
  const [intervalle, setIntervalle] = useState(edit ? String(edit.intervalle) : "1");
  const [dateDebut, setDateDebut] = useState(edit?.dateDebut ?? todayISO());
  const [dateFin, setDateFin] = useState(edit?.dateFin ?? "");
  const [description, setDescription] = useState(edit?.description ?? "");

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setLibelle(edit?.libelle ?? "");
      setCompteCourantId(edit?.compteCourantId ?? comptesCourants[0]?.id ?? "");
      setCompteEpargneId(edit?.compteEpargneId ?? comptes[0]?.id ?? "");
      setMontant(edit ? String(edit.montant) : "");
      setFrequence(edit?.frequence ?? "mois");
      setIntervalle(edit ? String(edit.intervalle) : "1");
      setDateDebut(edit?.dateDebut ?? todayISO());
      setDateFin(edit?.dateFin ?? "");
      setDescription(edit?.description ?? "");
    }
    onOpenChange(b);
  };

  const valider = () => {
    if (!libelle.trim()) return toast.error("Libellé requis");
    if (!compteCourantId) return toast.error("Compte source requis");
    if (!compteEpargneId) return toast.error("Compte épargne requis");
    const m = parseFloat(montant);
    if (!m || m <= 0) return toast.error("Montant invalide");
    const i = parseInt(intervalle);
    if (!i || i < 1) return toast.error("Intervalle invalide (≥ 1)");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDebut)) return toast.error("Date de début invalide");
    if (dateFin && !/^\d{4}-\d{2}-\d{2}$/.test(dateFin)) return toast.error("Date de fin invalide");
    if (dateFin && dateFin < dateDebut) return toast.error("Date fin avant début");
    onSave({
      libelle: libelle.trim(),
      compteCourantId,
      compteEpargneId,
      montant: m,
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
          <DialogTitle>{edit ? "Modifier" : "Nouveau"} virement automatique</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Sort de ton compte courant et alimente le compte épargne choisi à la fréquence définie.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Libellé</Label>
            <Input
              placeholder="Mise de côté, Épargne projet voyage…"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Compte source (courant)</Label>
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
              <Label className="mb-1.5 block">Compte épargne destinataire</Label>
              <Select value={compteEpargneId} onValueChange={setCompteEpargneId}>
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
          <div className="text-xs text-ink-muted">
            → {labelFrequence(frequence, parseInt(intervalle) || 1)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Date 1ère échéance</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Date de fin (optionnelle)</Label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
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
          <Button onClick={valider}>{edit ? "Modifier" : "Programmer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

void Badge;
