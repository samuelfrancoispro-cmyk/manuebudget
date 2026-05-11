// src/hooks/useEntitlement.ts
import { useStore } from "@/store/useStore";
import { type FeatureKey, type Tier, getFeatureValue } from "@/lib/pricing";

export interface EntitlementResult {
  allowed: boolean;
  limit?: number;
  effectiveTier: Tier;
  reason?: "feature" | "limit";
  requiredTier: Tier;
}

/** Calcule l'accès effectif à une feature selon le tier actif de l'utilisateur. */
export function useEntitlement(featureKey: FeatureKey, current?: number): EntitlementResult {
  const profile = useStore((s) => s.profile);
  const effectiveTier: Tier = (profile?.tier as Tier) ?? "free";

  const value = getFeatureValue(featureKey, effectiveTier);

  // Determine requiredTier: first tier where feature is unlocked
  const tiers: Tier[] = ["free", "plus", "pro"];
  let requiredTier: Tier = "pro";
  for (const t of tiers) {
    const v = getFeatureValue(featureKey, t);
    if (v !== false && v !== 0) {
      requiredTier = t;
      break;
    }
  }

  if (value === false) {
    return { allowed: false, effectiveTier, reason: "feature", requiredTier };
  }

  if (typeof value === "number") {
    const limit = value;
    if (!isFinite(limit)) return { allowed: true, effectiveTier, requiredTier };
    const underLimit = current === undefined || current < limit;
    return {
      allowed: underLimit,
      limit,
      effectiveTier,
      reason: underLimit ? undefined : "limit",
      requiredTier,
    };
  }

  return { allowed: true, effectiveTier, requiredTier };
}
