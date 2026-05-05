import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { OnboardingStep } from "./OnboardingStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STEP = 1;
const TOTAL = 6;

export default function OnboardingProfil() {
  const { t } = useTranslation();
  const { profile, updateProfile, setOnboardingStep } = useStore();
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [currency, setCurrency] = useState(profile?.preferredCurrency ?? "EUR");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!firstName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ firstName: firstName.trim(), preferredCurrency: currency });
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
      <p className="mb-6 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
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
        <div>
          <Label className="mb-1.5 block">{t("onboarding.step1.currency")}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR €</SelectItem>
              <SelectItem value="GBP">GBP £</SelectItem>
              <SelectItem value="USD">USD $</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </OnboardingStep>
  );
}
