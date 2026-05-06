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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TypeCompteCourant } from "@/types";

const STEP = 2;
const TOTAL = 7;

type Draft = { nom: string; type: TypeCompteCourant; soldeInitial: number };
const EMPTY_DRAFT: Draft = { nom: "", type: "perso", soldeInitial: 0 };

export default function OnboardingComptesCourants() {
  const { t } = useTranslation();
  const { comptesCourants, addCompteCourant, deleteCompteCourant, setOnboardingStep } = useStore();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(comptesCourants.length === 0);
  const [loading, setLoading] = useState(false);

  const addAndReset = async () => {
    if (!draft.nom.trim()) return;
    setLoading(true);
    try {
      await addCompteCourant({
        nom: draft.nom.trim(),
        type: draft.type,
        soldeInitial: draft.soldeInitial,
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (comptesCourants.length === 0) return;
    setLoading(true);
    try {
      await setOnboardingStep(STEP + 1);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => setOnboardingStep(STEP - 1);

  return (
    <OnboardingStep
      step={STEP}
      total={TOTAL}
      title={t("onboarding.step2.title")}
      description={t("onboarding.step2.description")}
      canProceed={comptesCourants.length > 0}
      onBack={handleBack}
      onNext={handleNext}
      loading={loading}
    >
      <div className="space-y-3">
        {comptesCourants.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{c.nom}</span>
                <span className="text-xs capitalize text-muted-foreground">{c.type}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteCompteCourant(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="mb-1.5 block">{t("onboarding.step2.accountName")}</Label>
              <Input
                value={draft.nom}
                onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                placeholder="Ex: Compte BNP"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step2.accountType")}</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) => setDraft((d) => ({ ...d, type: v as TypeCompteCourant }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perso">{t("onboarding.step2.typePerso")}</SelectItem>
                    <SelectItem value="joint">{t("onboarding.step2.typeJoint")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("onboarding.step2.balance")}</Label>
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
              <Button
                size="sm"
                onClick={addAndReset}
                disabled={!draft.nom.trim() || loading}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
              {comptesCourants.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("onboarding.step2.addAccount")}
          </Button>
        )}

        {comptesCourants.length === 0 && !showForm && (
          <p className="text-center text-sm text-muted-foreground">
            {t("onboarding.step2.minError")}
          </p>
        )}
      </div>
    </OnboardingStep>
  );
}
