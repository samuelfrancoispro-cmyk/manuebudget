// src/hooks/useEntitlement.ts
import { useStore } from "@/store/useStore";
import {
  type FeatureKey,
  type TierId,
  type FeatureValue,
  getFeatureValue,
  getRequiredTier,
} from "@/lib/pricing";

export interface EntitlementResult {
  allowed: boolean;
  limit?: number;
  effectiveTier: TierId;
  reason?: "feature" | "limit" | "trial_expired";
  requiredTier: TierId;
}

/**
 * Calcule l'accès effectif à une feature selon le tier actif de l'utilisateur.
 * Synchrone — basé uniquement sur le store Zustand, zéro appel réseau.
 *
 * @param featureKey  Clé de feature définie dans pricing.ts
 * @param current     Nombre actuel d'éléments (pour les features à limite numérique)
 */
export function useEntitlement(featureKey: FeatureKey, current?: number): EntitlementResult {
  const profile = useStore((s) => s.profile);

  const effectiveTier: TierId = (() => {
    if (!profile) return "free";
    if (profile.subscriptionStatus === "active") return profile.tier;
    if (profile.subscriptionStatus === "past_due") return profile.tier;
    if (profile.trialEndsAt && new Date(profile.trialEndsAt) > new Date()) return profile.tier;
    return "free";
  })();

  const trialExpired =
    !!profile?.trialEndsAt &&
    new Date(profile.trialEndsAt) <= new Date() &&
    !profile?.subscriptionStatus;

  const value: FeatureValue = getFeatureValue(featureKey, effectiveTier);
  const requiredTier = getRequiredTier(featureKey);

  if (value === false) {
    return {
      allowed: false,
      effectiveTier,
      reason: trialExpired ? "trial_expired" : "feature",
      requiredTier,
    };
  }

  if (value === "unlimited" || typeof value === "string") {
    return { allowed: true, effectiveTier, requiredTier };
  }

  if (typeof value === "boolean") {
    return { allowed: true, effectiveTier, requiredTier };
  }

  if (typeof value === "number") {
    const limit = value;
    const underLimit = current === undefined || current < limit;
    return {
      allowed: underLimit,
      limit,
      effectiveTier,
      reason: underLimit ? undefined : (trialExpired ? "trial_expired" : "limit"),
      requiredTier,
    };
  }

  return { allowed: true, effectiveTier, requiredTier };
}
