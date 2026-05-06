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

const STEP = 4;
const TOTAL = 7;

type Draft = { nom: string; soldeInitial: number };
const EMPTY_DRAFT: Draft = { nom: "", soldeInitial: 0 };

export default function OnboardingBourse() {
  const { t } = useTranslation();
  const { comptes, addCompte, deleteCompte, setOnboardingStep } = useStore();
  const bourseComptes = comptes.filter((c) => c.type === "boursier");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim()) return;
    setLoading(true);
    try {
      await addCompte({
        nom: draft.nom.trim(),
        tauxAnnuel: 0,
        soldeInitial: draft.soldeInitial,
        type: "boursier",
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
      title={t("onboarding.step4.title")}
      description={t("onboarding.step4.description")}
      skippable
      canProceed={bourseComptes.length > 0}
      onBack={() => nav(STEP - 1)}
      onNext={() => nav(STEP + 1)}
      onSkip={() => nav(STEP + 1)}
      loading={loading}
    >
      <p className="mb-4 text-xs text-muted-foreground">{t("onboarding.step4.skipNote")}</p>
      <div className="space-y-3">
        {bourseComptes.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{c.nom}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
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
              <Label className="mb-1.5 block">{t("onboarding.step4.accountName")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: PEA Boursorama"
                autoFocus
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step4.balance")}</Label>
              <Input
                type="number"
                value={draft.soldeInitial}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, soldeInitial: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("onboarding.step4.isinNote")}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={addAndReset} disabled={!draft.nom.trim() || loading}>
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {bourseComptes.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step4.addAccount")}
          </Button>
        )}
      </div>
    </OnboardingStep>
  );
}
