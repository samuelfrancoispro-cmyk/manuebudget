import { useMemo, useState } from "react";
import { Wallet, Pencil, Coins } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import type { CompteCourant } from "@/types";
import { formatEUR, monthKey, monthLabel } from "@/lib/utils";
import { soldeCompteCourant, totauxMois } from "@/lib/calculs";
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

export default function ComptesPage({ embedded = false }: { embedded?: boolean } = {}) {
  const {
    comptesCourants,
    transactions,
    recurrentes,
    virementsRecurrents,
    comptes,
    setSoldeActuelCompte,
  } = useStore();
  const [editCompte, setEditCompte] = useState<CompteCourant | null>(null);
  const [soldeInput, setSoldeInput] = useState("");

  const moisCourant = monthKey(new Date().toISOString());

  const data = useMemo(() => {
    return comptesCourants.map((c) => {
      const solde = soldeCompteCourant(c, transactions, recurrentes, undefined, virementsRecurrents, comptes);
      const t = totauxMois(transactions, moisCourant, recurrentes, c.id, virementsRecurrents, comptes);
      return { compte: c, solde, totaux: t };
    });
  }, [comptesCourants, transactions, recurrentes, virementsRecurrents, comptes, moisCourant]);

  const totalAll = data.reduce((s, x) => s + x.solde, 0);

  const ouvrir = (c: CompteCourant) => {
    const solde = data.find((d) => d.compte.id === c.id)?.solde ?? 0;
    setSoldeInput(String(solde.toFixed(2)));
    setEditCompte(c);
  };

  const valider = () => {
    if (!editCompte) return;
    const v = parseFloat(soldeInput);
    if (isNaN(v)) return toast.error("Solde invalide");
    setSoldeActuelCompte(editCompte.id, v);
    toast.success("Solde mis à jour — toutes les stats sont recalculées");
    setEditCompte(null);
  };

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Mes comptes"
          description="Saisis le solde réel de chaque compte : tout est recalculé automatiquement."
        />
      )}

      <Card className="mb-4">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <div className="text-xs text-muted-foreground">Solde total (tous comptes)</div>
            <div className={`text-3xl font-semibold ${totalAll >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatEUR(totalAll)}
            </div>
          </div>
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>

      {comptesCourants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun compte. Crée-en un dans Paramètres.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map(({ compte, solde, totaux }) => (
            <Card key={compte.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{compte.nom}</CardTitle>
                      <Badge variant={compte.type === "joint" ? "secondary" : "outline"}>
                        {compte.type === "joint" ? "Joint" : "Perso"}
                      </Badge>
                    </div>
                    {compte.description && (
                      <CardDescription className="mt-1">{compte.description}</CardDescription>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => ouvrir(compte)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Solde réel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Solde aujourd'hui</div>
                  <div className={`text-2xl font-semibold ${solde >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatEUR(solde)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border bg-muted/30 p-2">
                    <div className="text-muted-foreground">Revenus mois</div>
                    <div className="font-semibold text-emerald-600">
                      {formatEUR(totaux.revenus)}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-2">
                    <div className="text-muted-foreground">Dépenses mois</div>
                    <div className="font-semibold text-rose-600">
                      {formatEUR(totaux.depenses)}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-2">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3" /> Reste
                    </div>
                    <div
                      className={`font-semibold ${totaux.solde >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatEUR(totaux.solde)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Mois de référence : {monthLabel(moisCourant)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editCompte !== null} onOpenChange={(b) => !b && setEditCompte(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solde réel — {editCompte?.nom}</DialogTitle>
            <DialogDescription>
              Saisis le montant qu'il y a réellement sur ce compte aujourd'hui. Le solde
              initial sera ajusté pour que le cumul des transactions corresponde.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className="mb-1.5 block">Solde actuel (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={soldeInput}
                onChange={(e) => setSoldeInput(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompte(null)}>
              Annuler
            </Button>
            <Button onClick={valider}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
