import { useStore } from '@/store/useStore';
import { canUse, getFeatureValue } from '@/lib/pricing';
import type { FeatureKey } from '@/types';

export function useWbEntitlement() {
  const profile = useStore((s) => s.profile);
  const tier = profile?.tier ?? 'free';
  return {
    tier,
    can: (feature: FeatureKey, count?: number) => canUse(feature, tier, count),
    value: (feature: FeatureKey) => getFeatureValue(feature, tier),
    isPro: tier === 'pro',
    isPlus: tier === 'plus' || tier === 'pro',
  };
}
