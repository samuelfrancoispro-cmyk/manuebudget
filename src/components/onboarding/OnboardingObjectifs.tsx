import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEP = 6;
const TOTAL = 6;

type Draft = { nom: string; montantCible: number; dateCible: string };
const EMPTY_DRAFT: Draft = { nom: "", montantCible: 0, dateCible: "" };

export default function OnboardingObjectifs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { objectifs, addObjectif, deleteObjectif, completeOnboarding, setOnboardingStep } =
    useStore();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim()) return;
    setLoading(true);
    try {
      await addObjectif({
        nom: draft.nom.trim(),
        montantCible: draft.montantCible,
        ...(draft.dateCible ? { dateCible: draft.dateCible } : {}),
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step6.title")}
      description={t("onboarding.step6.description")}
      skippable
      canProceed={objectifs.length > 0}
      onBack={() => setOnboardingStep(STEP - 1)}
      onNext={handleFinish}
      onSkip={handleFinish}
      loading={loading}
    >
      <p className="mb-4 text-xs text-muted-foreground">{t("onboarding.step6.skipNote")}</p>
      <div className="space-y-3">
        {objectifs.map((o) => (
          <Card key={o.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{o.nom}</span>
                <span className="text-xs text-muted-foreground">
                  {o.montantCible.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteObjectif(o.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step6.name")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Voyage au Japon"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step6.target")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.montantCible}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, montantCible: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step6.targetDate")}</Label>
                <Input
                  type="date"
                  value={draft.dateCible}
                  onChange={(e) => setDraft((d) => ({ ...d, dateCible: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addAndReset} disabled={!draft.nom.trim() || loading}>
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {objectifs.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step6.addObjectif")}
          </Button>
        )}
      </div>
    </OnboardingStep>
  );
}
