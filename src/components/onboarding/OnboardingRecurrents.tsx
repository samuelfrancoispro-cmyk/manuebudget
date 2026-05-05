import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TypeTransaction } from "@/types";

const STEP = 5;
const TOTAL = 6;

type Draft = { libelle: string; montant: number; jourMois: number; categorieId: string };
const EMPTY_DRAFT: Draft = { libelle: "", montant: 0, jourMois: 1, categorieId: "" };

function dateDebutFromJour(jour: number): string {
  const now = new Date();
  const day = Math.min(Math.max(1, jour), 28);
  const candidate = new Date(now.getFullYear(), now.getMonth(), day);
  if (candidate < now) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate.toISOString().slice(0, 10);
}

export default function OnboardingRecurrents() {
  const { t } = useTranslation();
  const { categories, recurrentes, addRecurrente, deleteRecurrente, setOnboardingStep } =
    useStore();
  const [activeTab, setActiveTab] = useState<TypeTransaction>("revenu");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const revenues = recurrentes.filter((r) => r.type === "revenu");
  const expenses = recurrentes.filter((r) => r.type === "depense");
  const currentList = activeTab === "revenu" ? revenues : expenses;
  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const addAndReset = async () => {
    if (!draft.libelle.trim() || !draft.categorieId) return;
    setLoading(true);
    try {
      await addRecurrente({
        libelle: draft.libelle.trim(),
        type: activeTab,
        montant: draft.montant,
        categorieId: draft.categorieId,
        frequence: "mois",
        intervalle: 1,
        dateDebut: dateDebutFromJour(draft.jourMois),
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val as TypeTransaction);
    setDraft(EMPTY_DRAFT);
    setShowForm(false);
  };

  const nav = (step: number) => setOnboardingStep(step);

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step5.title")}
      description={t("onboarding.step5.description")}
      skippable
      canProceed={recurrentes.length > 0}
      onBack={() => nav(STEP - 1)}
      onNext={() => nav(STEP + 1)}
      onSkip={() => nav(STEP + 1)}
      loading={loading}
    >
      <p className="mb-4 text-xs text-muted-foreground">{t("onboarding.step5.skipNote")}</p>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="revenu" className="flex-1">
            {t("onboarding.step5.revenues")}
            {revenues.length > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                {revenues.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="depense" className="flex-1">
            {t("onboarding.step5.expenses")}
            {expenses.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                {expenses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {(["revenu", "depense"] as TypeTransaction[]).map((tabType) => (
          <TabsContent key={tabType} value={tabType} className="space-y-3">
            {currentList.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">{r.libelle}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteRecurrente(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {showForm && activeTab === tabType ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <Label className="mb-1.5 block">{t("onboarding.step5.label")}</Label>
                  <Input
                    value={draft.libelle}
                    onChange={(e) => setDraft((d) => ({ ...d, libelle: e.target.value }))}
                    placeholder={tabType === "revenu" ? "Ex: Salaire" : "Ex: Loyer"}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block">{t("onboarding.step5.amount")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.montant}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, montant: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">{t("onboarding.step5.dayOfMonth")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={draft.jourMois}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          jourMois: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">{t("onboarding.step5.category")}</Label>
                  <Select
                    value={draft.categorieId}
                    onValueChange={(v) => setDraft((d) => ({ ...d, categorieId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addAndReset}
                    disabled={!draft.libelle.trim() || !draft.categorieId || loading}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {t("common.add")}
                  </Button>
                  {currentList.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                      {t("common.cancel")}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tabType === "revenu"
                  ? t("onboarding.step5.addRevenue")
                  : t("onboarding.step5.addExpense")}
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </OnboardingStep>
  );
}
