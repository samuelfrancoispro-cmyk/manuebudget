import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/store/useStore";
import type { Categorie, CompteCourant, TypeCompteCourant, TypeTransaction } from "@/types";
import { formatEUR, todayISO, cn } from "@/lib/utils";
import { tiers, features, formatTierPrice } from "@/lib/pricing";
import type { TierId } from "@/lib/pricing";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import { SectionHeader, DataRow } from "@/components/brand";
import { HardGate } from "@/components/gate/HardGate";
import { KPICard } from "@/components/brand/KPICard";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function ParametresPage() {
  const { t } = useTranslation();
  const store = useStore();

  // Catégories
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypeTransaction>("depense");
  const [couleur, setCouleur] = useState("#94a3b8");

  // Comptes courants
  const [ccOpen, setCcOpen] = useState(false);
  const [ccEdit, setCcEdit] = useState<CompteCourant | null>(null);

  const profile = useStore((s) => s.profile);
  const loadProfile = useStore((s) => s.loadProfile);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<"plus" | "pro" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success(t("subscription.checkoutSuccess"));
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await loadProfile(user.id);
      }, 2000);
      setSearchParams({});
    } else if (checkout === "cancel") {
      toast.info(t("subscription.checkoutCancel"));
      setSearchParams({});
    }
  }, [searchParams]);

  const handleUpgrade = async (tierId: "plus" | "pro") => {
    setCheckoutLoading(tierId);
    try {
      const { url } = await createCheckoutSession(tierId, period);
      window.location.href = url;
    } catch {
      toast.error(t("common.error"));
      setCheckoutLoading(null);
    }
  };

  const handlePortalSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch {
      toast.error(t("common.error"));
      setPortalLoading(false);
    }
  };

  const subscriptionLabel = (() => {
    if (!profile) return "";
    if (profile.subscriptionStatus === "active") return t("subscription.statusActive");
    if (profile.subscriptionStatus === "past_due") return t("subscription.statusPastDue");
    if (profile.subscriptionStatus === "canceled") return t("subscription.statusCanceled");
    if (profile.trialEndsAt && new Date(profile.trialEndsAt) > new Date()) {
      const days = Math.ceil((new Date(profile.trialEndsAt).getTime() - Date.now()) / 86400000);
      return t("subscription.trialActive", { days });
    }
    return t("subscription.statusFree");
  })();

  const isSubscribed =
    profile?.subscriptionStatus === "active" ||
    profile?.subscriptionStatus === "past_due";

  const tierName = tiers.find((ti) => ti.id === (profile?.tier ?? "free"))?.name ?? "Gratuit";

  const ajouter = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    store.addCategorie({ nom: nom.trim(), type, couleur });
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
      projets: store.projets,
      achatsProjet: store.achatsProjet,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé");
  };

  const supprimerCat = (c: Categorie) => {
    const utilisee =
      store.transactions.some((t) => t.categorieId === c.id) ||
      store.recurrentes.some((r) => r.categorieId === c.id);
    if (utilisee) {
      return toast.error("Catégorie utilisée par des transactions");
    }
    if (confirm(`Supprimer la catégorie "${c.nom}" ?`)) {
      store.deleteCategorie(c.id);
      toast.success("Catégorie supprimée");
    }
  };

  const supprimerCompteCourant = (cc: CompteCourant) => {
    const txs = store.transactions.filter((t) => t.compteCourantId === cc.id).length;
    const recs = store.recurrentes.filter((r) => r.compteCourantId === cc.id).length;
    const msg =
      txs + recs > 0
        ? `Supprimer "${cc.nom}" ? ${txs} transaction(s) et ${recs} récurrent(s) seront détaché(s).`
        : `Supprimer "${cc.nom}" ?`;
    if (confirm(msg)) {
      store.deleteCompteCourant(cc.id);
      toast.success("Compte supprimé");
    }
  };

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comptes courants</CardTitle>
                <CardDescription>
                  Plusieurs comptes : perso, joint… chaque transaction est rattachée à un compte.
                </CardDescription>
              </div>
              <HardGate featureKey="comptes_courants" current={store.comptesCourants.length}>
                <Button
                  onClick={() => {
                    setCcEdit(null);
                    setCcOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </HardGate>
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
                  <div
                    key={cc.id}
                    className="flex items-center justify-between rounded-md border bg-surface px-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cc.nom}</span>
                        <Badge variant={cc.type === "joint" ? "secondary" : "outline"}>
                          {cc.type === "joint" ? "Joint" : "Perso"}
                        </Badge>
                      </div>
                      <div className="text-xs text-ink-muted">
                        Solde initial : {formatEUR(cc.soldeInitial)}
                        {cc.description ? ` · ${cc.description}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCcEdit(cc);
                          setCcOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => supprimerCompteCourant(cc)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catégories</CardTitle>
            <CardDescription>
              Personnalise tes catégories de revenus et de dépenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <Label className="mb-1.5 block">Nom</Label>
                <Input
                  placeholder="Ex: Restaurant"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                />
              </div>
              <div className="w-[140px]">
                <Label className="mb-1.5 block">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TypeTransaction)}>
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
                <Label className="mb-1.5 block">Couleur</Label>
                <Input
                  type="color"
                  value={couleur}
                  onChange={(e) => setCouleur(e.target.value)}
                  className="w-16 cursor-pointer p-1"
                />
              </div>
              <Button onClick={ajouter}>
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            <Separator />

            <div className="grid gap-2 sm:grid-cols-2">
              {store.categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border bg-surface px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.couleur }}
                    />
                    <span className="text-sm font-medium">{c.nom}</span>
                    <span className="text-xs text-ink-muted">
                      {c.type === "revenu" ? "Revenu" : "Dépense"}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => supprimerCat(c)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sauvegarde des données</CardTitle>
            <CardDescription>
              Tes données sont synchronisées dans le cloud. Tu peux exporter une copie locale en JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exporter}>
              <Download className="h-4 w-4" />
              Exporter en JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader title="Statistiques" align="left" />
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow label="Comptes courants" value={store.comptesCourants.length} />
            <DataRow label="Transactions" value={store.transactions.length} />
            <DataRow label="Récurrents" value={store.recurrentes.length} />
            <DataRow label="Catégories" value={store.categories.length} />
            <DataRow label="Comptes épargne" value={store.comptes.length} />
            <DataRow label="Mouvements" value={store.mouvements.length} />
            <DataRow label="Objectifs" value={store.objectifs.length} />
            <DataRow label="Projets" value={store.projets.length} />
          </CardContent>
        </Card>

        {/* ── Section Abonnement ── */}
        <section id="abonnement" className="space-y-4 scroll-mt-20">
          <SectionHeader title={t("subscription.sectionTitle")} />

          <KPICard label={tierName} value={subscriptionLabel} />

          {!isSubscribed && (
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-medium transition-colors",
                  period === "monthly" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
                )}
              >
                {t("subscription.periodMonthly")}
              </button>
              <button
                type="button"
                onClick={() => setPeriod("yearly")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                  period === "yearly" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
                )}
              >
                {t("subscription.periodYearly")}
                <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                  {t("subscription.yearlySaving", { pct: 33 })}
                </span>
              </button>
            </div>
          )}

          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePortalSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? t("subscription.portalLoading") : t("subscription.manageSubscription")}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleUpgrade("plus")}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === "plus" ? t("subscription.loading") : t("subscription.upgradePlus")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpgrade("pro")}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === "pro" ? t("subscription.loading") : t("subscription.upgradePro")}
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {features
              .filter((f) => f.section !== "support")
              .map((f) => {
                const val = f.values[profile?.tier ?? "free"];
                const displayVal =
                  val === true ? "✓" :
                  val === false ? "—" :
                  val === "unlimited" ? "∞" :
                  String(val);
                return <DataRow key={f.key} label={f.label} value={displayVal} />;
              })}
          </div>
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
  const [type, setType] = useState<TypeCompteCourant>(edit?.type ?? "perso");
  const [solde, setSolde] = useState(edit ? String(edit.soldeInitial) : "0");
  const [dateReference, setDateReference] = useState(edit?.dateReference ?? todayISO());
  const [desc, setDesc] = useState(edit?.description ?? "");

  const handleOpenChange = (b: boolean) => {
    if (b) {
      setNom(edit?.nom ?? "");
      setType(edit?.type ?? "perso");
      setSolde(edit ? String(edit.soldeInitial) : "0");
      setDateReference(edit?.dateReference ?? todayISO());
      setDesc(edit?.description ?? "");
    }
    onOpenChange(b);
  };

  const valider = () => {
    if (!nom.trim()) return toast.error("Nom requis");
    const s = parseFloat(solde);
    if (isNaN(s)) return toast.error("Solde invalide");
    onSave({
      nom: nom.trim(),
      type,
      soldeInitial: s,
      dateReference: dateReference || undefined,
      description: desc || undefined,
    });
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
            <Input
              placeholder="Ex: Compte courant principal"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TypeCompteCourant)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perso">Personnel</SelectItem>
                  <SelectItem value="joint">Joint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Solde actuel (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={solde}
                onChange={(e) => setSolde(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Date de référence</Label>
            <Input
              type="date"
              value={dateReference}
              onChange={(e) => setDateReference(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Date où ce solde est constaté. Les transactions/récurrences avant cette date sont
              traitées comme historique (n'impactent pas le solde actuel).
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block">Description (optionnelle)</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
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
