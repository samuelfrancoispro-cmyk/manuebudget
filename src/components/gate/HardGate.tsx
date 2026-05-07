import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlement } from "@/hooks/useEntitlement";
import { type FeatureKey, tiers } from "@/lib/pricing";

interface HardGateProps {
  featureKey: FeatureKey;
  current: number;
  children: React.ReactNode;
}

export function HardGate({ featureKey, current, children }: HardGateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allowed, limit, requiredTier } = useEntitlement(featureKey, current);

  if (allowed) return <>{children}</>;

  const tierName = tiers.find((ti) => ti.id === requiredTier)?.name ?? requiredTier;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm text-ink-muted">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        <div className="space-y-2">
          <p className="text-ink">
            {limit !== undefined
              ? t("gate.limitReached", { current, limit })
              : t("gate.upgradeTo", { tier: tierName })}
          </p>
          <p className="text-xs">{t("gate.upgradeTo", { tier: tierName })}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/parametres#abonnement")}
          >
            {t("gate.seePlans")}
          </Button>
        </div>
      </div>
    </div>
  );
}
