import { useState } from "react";
import { Plus, Trash2, Download, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import type { CompteCourant } from "@/types";
import type { Tier } from "@/types";
import { formatEUR, todayISO } from "@/lib/utils";
import { setTierDirect } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { SectionHeader, DataRow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const TIER_NAMES: Record<Tier, string> = { free: "Gratuit", plus: "Plus", pro: "Pro" };
const TIERS: Tier[] = ["free", "plus", "pro"];

export default function ParametresPage() {
  const { t } = useTranslation();
  const store = useStore();

  // Catégories
  const [nom, setNom] = useState("");
  const [type, setType] = useState<"revenu" | "depense">("depense");
  const [couleur, setCouleur] = useState("#94a3b8");

  // Comptes courants
  const [ccOpen, setCcOpen] = useState(false);
  const [ccEdit, setCcEdit] = useState<CompteCourant | null>(null);

  const profile = useStore((s) => s.profile);
  const loadProfile = useStore((s) => s.loadProfile);
  const [tierSaving, setTierSaving] = useState<Tier | null>(null);

  const handleSetTier = async (tierId: Tier) => {
    if (tierId === profile?.tier) return;
    setTierSaving(tierId);
    try {
      await setTierDirect(tierId);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await loadProfile(user.id);
      toast.success(`Plan ${TIER_NAMES[tierId]} activé`);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setTierSaving(null);
    }
  };

  const ajouter = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    store.addCategorie({ userId: "", nom: nom.trim(), type, couleur });
    setNom("");
    toast.success("Catégorie ajoutée");
  };

  const exporter = () => {
    const data = {
      categories: store.categories,
      transactions: store.transactions,
      recurrentes: store.recurrentes,
      comptesCourants: store.comptesCourants,
      comptes: store.comptes,
      mouvements: store.mouvements,
      objectifs: store.objectifs,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fluxo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé");
  };

  const supprimerCat = (id: string, catNom: string) => {
    if (confirm(`Supprimer la catégorie "${catNom}" ?`)) {
      store.deleteCategorie(id);
      toast.success("Catégorie supprimée");
    }
  };

  const supprimerCompteCourant = (cc: CompteCourant) => {
    if (confirm(`Supprimer "${cc.nom}" ?`)) {
      store.deleteCompteCourant(cc.id);
      toast.success("Compte supprimé");
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("settings.title", { defaultValue: "Paramètres" })}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("settings.description", { defaultValue: "Gérez vos comptes, catégories et préférences." })}</p>
      </div>

      <div className="space-y-6">
        {/* Comptes courants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comptes courants</CardTitle>
                <CardDescription>Plusieurs comptes : perso, joint…</CardDescription>
              </div>
              <Button onClick={() => { setCcEdit(null); setCcOpen(true); }}>
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {store.comptesCourants.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                Aucun compte. Ajoutes-en un pour commencer.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {store.comptesCourants.map((cc) => (
                  <div key={cc.id} className="flex items-center justify-between rounded-md border bg-surface px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{cc.nom}</span>
                      <div className="text-xs text-ink-muted">
                        Solde initial : {formatEUR(cc.soldeInitial)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setCcEdit(cc); setCcOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => supprimerCompteCourant(cc)}>
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catégories */}
        <Card>
          <CardHeader>
            <CardTitle>Catégories</CardTitle>
            <CardDescription>Personnalise tes catégories de revenus et de dépenses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <Label className="mb-1.5 block">Nom</Label>
                <Input placeholder="Ex: Restaurant" value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
              <div className="w-[140px]">
                <Label className="mb-1.5 block">Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "revenu" | "depense")}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="depense">Dépense</option>
                  <option value="revenu">Revenu</option>
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block">Couleur</Label>
                <Input type="color" value={couleur} onChange={(e) => setCouleur(e.target.value)} className="w-16 cursor-pointer p-1" />
              </div>
              <Button onClick={ajouter}><Plus className="h-4 w-4" />Ajouter</Button>
            </div>

            <Separator />

            <div className="grid gap-2 sm:grid-cols-2">
              {store.categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border bg-surface px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.couleur }} />
                    <span className="text-sm font-medium">{c.nom}</span>
                    <span className="text-xs text-ink-muted">
                      {c.type === "revenu" ? "Revenu" : "Dépense"}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => supprimerCat(c.id, c.nom)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle>Sauvegarde des données</CardTitle>
            <CardDescription>Exporter une copie locale en JSON.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={exporter}>
              <Download className="h-4 w-4" />
              Exporter en JSON
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader><SectionHeader title="Statistiques" align="left" /></CardHeader>
          <CardContent className="divide-y">
            <DataRow label="Comptes courants" value={store.comptesCourants.length} />
            <DataRow label="Transactions" value={store.transactions.length} />
            <DataRow label="Récurrents" value={store.recurrentes.length} />
            <DataRow label="Catégories" value={store.categories.length} />
            <DataRow label="Comptes épargne" value={store.comptes.length} />
            <DataRow label="Objectifs" value={store.objectifs.length} />
          </CardContent>
        </Card>

        {/* Abonnement */}
        <section id="abonnement" className="space-y-4 scroll-mt-20">
          <SectionHeader title={t("subscription.sectionTitle", { defaultValue: "Abonnement" })} />
          <p className="text-sm text-ink-muted">
            Plan actuel : <strong>{TIER_NAMES[profile?.tier ?? "free"]}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {TIERS.map((tid) => {
              const isActive = (profile?.tier ?? "free") === tid;
              return (
                <Button
                  key={tid}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  disabled={tierSaving !== null}
                  onClick={() => handleSetTier(tid)}
                >
                  {tierSaving === tid ? "…" : TIER_NAMES[tid]}
                  {isActive && " ✓"}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-ink-muted">Mode test — paiement Stripe activé au lancement.</p>
        </section>
      </div>

      <CompteCourantForm
        open={ccOpen}
        onOpenChange={setCcOpen}
        edit={ccEdit}
        onSave={(data) => {
          if (ccEdit) {
            store.updateCompteCourant(ccEdit.id, data);
            toast.success("Compte modifié");
          } else {
            store.addCompteCourant(data);
            toast.success("Compte ajouté");
          }
          setCcOpen(false);
        }}
      />
    </>
  );
}

function CompteCourantForm({
  open,
  onOpenChange,
  edit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  edit: CompteCourant | null;
  onSave: (c: Omit<CompteCourant, "id">) => void;
}) {
  const [nom, setNom] = useState(edit?.nom ?? "");
  const [solde, setSolde] = useState(edit ? String(edit.soldeInitial) : "0");

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setNom(edit?.nom ?? "");
      setSolde(edit ? String(edit.soldeInitial) : "0");
    }
    onOpenChange(b);
  };

  const valider = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    const s = parseFloat(solde);
    if (isNaN(s)) return toast.error("Solde invalide");
    onSave({ userId: "", nom: nom.trim(), soldeInitial: s });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier" : "Nouveau"} compte courant</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label className="mb-1.5 block">Nom</Label>
            <Input placeholder="Ex: Compte BNP" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Solde actuel (€)</Label>
            <Input type="number" step="0.01" value={solde} onChange={(e) => setSolde(e.target.value)} />
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
