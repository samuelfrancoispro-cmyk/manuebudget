// src/components/gate/UpgradeBadge.tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEntitlement } from "@/hooks/useEntitlement";
import { ProBadge } from "@/components/brand/ProBadge";
import { type FeatureKey } from "@/lib/pricing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TIER_NAMES: Record<string, string> = { free: "Gratuit", plus: "Plus", pro: "Pro" };

interface UpgradeBadgeProps {
  featureKey: FeatureKey;
  force?: boolean;
}

export function UpgradeBadge({ featureKey, force = false }: UpgradeBadgeProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allowed, requiredTier } = useEntitlement(featureKey);

  if (allowed && !force) return null;

  const tierName = TIER_NAMES[requiredTier] ?? requiredTier;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => navigate("/parametres#abonnement")}
            className="inline-flex items-center"
            aria-label={t("gate.availableIn", { tier: tierName })}
          >
            <ProBadge />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("gate.availableIn", { tier: tierName })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
