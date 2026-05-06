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

const STEP = 3;
const TOTAL = 7;

type Draft = { nom: string; tauxAnnuel: number; soldeInitial: number };
const EMPTY_DRAFT: Draft = { nom: "", tauxAnnuel: 0, soldeInitial: 0 };

export default function OnboardingEpargne() {
  const { t } = useTranslation();
  const { comptes, addCompte, deleteCompte, setOnboardingStep } = useStore();
  const epargneComptes = comptes.filter((c) => c.type !== "boursier");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim()) return;
    setLoading(true);
    try {
      await addCompte({
        nom: draft.nom.trim(),
        tauxAnnuel: draft.tauxAnnuel,
        soldeInitial: draft.soldeInitial,
        type: "livret",
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const nav = (step: number) => setOnboardingStep(step);

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step3.title")}
      description={t("onboarding.step3.description")}
      skippable
      canProceed={epargneComptes.length > 0}
      onBack={() => nav(STEP - 1)}
      onNext={() => nav(STEP + 1)}
      onSkip={() => nav(STEP + 1)}
      loading={loading}
    >
      <p className="mb-4 text-xs text-ink-muted">{t("onboarding.step3.skipNote")}</p>
      <div className="space-y-3">
        {epargneComptes.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{c.nom}</span>
                <span className="text-xs text-ink-muted">{c.tauxAnnuel}%</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-ink-muted hover:text-destructive"
                onClick={() => deleteCompte(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step3.accountName")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Livret A"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step3.rate")}</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={draft.tauxAnnuel}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, tauxAnnuel: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step3.balance")}</Label>
                <Input
                  type="number"
                  value={draft.soldeInitial}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, soldeInitial: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addAndReset} disabled={!draft.nom.trim() || loading}>
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {epargneComptes.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step3.addAccount")}
          </Button>
        )}
      </div>
    </OnboardingStep>
  );
}
