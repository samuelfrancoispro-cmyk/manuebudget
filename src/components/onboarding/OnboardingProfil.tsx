import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEP = 1;
const TOTAL = 7;

export default function OnboardingProfil() {
  const { t } = useTranslation();
  const { profile, updateProfile, setOnboardingStep } = useStore();
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!firstName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ firstName: firstName.trim() });
      await setOnboardingStep(STEP + 1);
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
      title={t("onboarding.step1.title")}
      description={t("onboarding.step1.description")}
      canProceed={firstName.trim().length > 0}
      onNext={handleNext}
      loading={loading}
    >
      <p className="mb-6 rounded-lg bg-surface px-4 py-3 text-sm text-ink-muted">
        {t("onboarding.step1.welcome")}
      </p>
      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 block">{t("onboarding.step1.firstName")}</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("onboarding.step1.firstNamePlaceholder")}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && firstName.trim()) handleNext(); }}
          />
        </div>
      </div>
    </OnboardingStep>
  );
}
