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

const STEP = 5;
const TOTAL = 7;

type TabType = "credit" | "debit";

type Draft = { libelle: string; montant: number; jourPrelevement: number };
const EMPTY_DRAFT: Draft = { libelle: "", montant: 0, jourPrelevement: 1 };

export default function OnboardingRecurrents() {
  const { t } = useTranslation();
  const { recurrentes, addRecurrente, deleteRecurrente, setOnboardingStep } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>("credit");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const credits = recurrentes.filter((r) => r.type === "credit");
  const debits  = recurrentes.filter((r) => r.type === "debit");
  const currentList = activeTab === "credit" ? credits : debits;

  const addAndReset = async () => {
    if (!draft.libelle.trim()) return;
    setLoading(true);
    try {
      await addRecurrente({
        userId: "",
        libelle: draft.libelle.trim(),
        type: activeTab,
        montant: draft.montant,
        jourPrelevement: draft.jourPrelevement,
        actif: true,
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
    setActiveTab(val as TabType);
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
      <p className="mb-4 text-xs text-ink-muted">{t("onboarding.step5.skipNote")}</p>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="credit" className="flex-1">
            {t("onboarding.step5.revenues")}
            {credits.length > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                {credits.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="debit" className="flex-1">
            {t("onboarding.step5.expenses")}
            {debits.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                {debits.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {(["credit", "debit"] as TabType[]).map((tabType) => (
          <TabsContent key={tabType} value={tabType} className="space-y-3">
            {currentList.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">{r.libelle}</span>
                    <span className="text-xs text-ink-muted">
                      {r.montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-ink-muted hover:text-destructive"
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
                    placeholder={tabType === "credit" ? "Ex: Salaire" : "Ex: Loyer"}
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
                      value={draft.jourPrelevement}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          jourPrelevement: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addAndReset} disabled={!draft.libelle.trim() || loading}>
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
              <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {tabType === "credit"
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
