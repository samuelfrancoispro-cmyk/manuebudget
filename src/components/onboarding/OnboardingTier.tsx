import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tiers, formatTierPrice, type TierId } from "@/lib/pricing";
import { ProBadge } from "@/components/brand/ProBadge";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";


export default function OnboardingTier() {
  const { t } = useTranslation();
  const { updateProfile, completeOnboarding } = useStore();
  const [selected, setSelected] = useState<TierId | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const tier = selected;
      const trialDays = tiers.find((t) => t.id === tier)?.trialDays ?? 0;
      const trialEndsAt =
        trialDays > 0
          ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Non connecté");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ tier, trialEndsAt })
        .eq("user_id", authData.user.id);

      if (updateError) throw updateError;

      await updateProfile({ tier, trialEndsAt });
      await completeOnboarding();
    } catch {
      toast.error(t("common.error"));
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <span className="font-semibold text-sm text-ink">Fluxo</span>
        <span className="text-sm text-ink-muted">
          {t("onboarding.stepOf", { step: 7, total: 7 })}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {t("onboarding.step7.title")}
            </h1>
            <p className="text-ink-muted">{t("onboarding.step7.description")}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tiers.map((tier) => {
              const isSelected = selected === tier.id;
              const isHighlighted = !!tier.isHighlighted;

              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelected(tier.id)}
                  className={cn(
                    "flex flex-col gap-5 rounded-2xl border p-5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                    isSelected
                      ? "border-ink bg-ink text-paper ring-2 ring-ink"
                      : isHighlighted
                      ? "border-ink/30 bg-surface hover:border-ink"
                      : "border-border bg-surface hover:border-ink-muted"
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold", isSelected ? "text-paper" : "text-ink")}>
                        {tier.name}
                      </span>
                      {tier.id === "pro" && <ProBadge />}
                    </div>
                    <p className={cn("text-xs", isSelected ? "text-paper/70" : "text-ink-muted")}>
                      {tier.monthlyPriceEUR === 0
                        ? t("onboarding.step7.free")
                        : `${formatTierPrice(tier.monthlyPriceEUR)} / mois`}
                    </p>
                  </div>

                  <ul className="space-y-1.5">
                    {(t(`onboarding.step7.highlights.${tier.id}`, { returnObjects: true }) as string[]).map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs">
                        <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", isSelected ? "text-paper" : "text-positive")} />
                        <span className={isSelected ? "text-paper/90" : "text-ink"}>{h}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="flex shrink-0 items-center justify-end border-t border-border bg-paper px-6 py-4">
        <Button onClick={handleConfirm} disabled={!selected || saving} size="sm">
          {saving
            ? t("onboarding.step7.saving")
            : selected === "free"
            ? t("onboarding.step7.ctaFree")
            : t("onboarding.step7.ctaTrial")}
        </Button>
      </footer>
    </div>
  );
}
