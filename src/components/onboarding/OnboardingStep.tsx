import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingStepProps {
  step: number;
  total: number;
  title: string;
  description: string;
  skippable?: boolean;
  canProceed: boolean;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  loading?: boolean;
  children: ReactNode;
}

export function OnboardingStep({
  step,
  total,
  title,
  description,
  skippable,
  canProceed,
  onNext,
  onBack,
  onSkip,
  loading,
  children,
}: OnboardingStepProps) {
  const { t } = useTranslation();
  const isLast = step === total;
  const showPasser = skippable && !canProceed;
  const showNext = !showPasser;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <span className="font-semibold text-sm text-ink">Fluxo</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-muted">
            {t("onboarding.stepOf", { step, total })}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors",
                  i < step ? "bg-ink" : "bg-surface-strong"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mb-8 text-ink-muted">{description}</p>
          {children}
        </div>
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-border bg-paper px-6 py-4">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("common.back")}
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {showPasser && onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} disabled={loading}>
              {isLast ? t("common.finish") : `${t("common.skip")} →`}
            </Button>
          )}
          {showNext && (
            <Button size="sm" onClick={onNext} disabled={!canProceed || loading}>
              {isLast ? t("common.finish") : `${t("common.next")} →`}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
