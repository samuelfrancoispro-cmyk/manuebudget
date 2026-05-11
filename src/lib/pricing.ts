import type { FeatureKey, Tier } from '../types';
export type { FeatureKey, Tier };

type FeatureValue = number | boolean | string;

const MATRIX: Record<FeatureKey, Record<Tier, FeatureValue>> = {
  whiteboard_sheets:   { free: 1,     plus: 5,      pro: Infinity },
  whiteboard_modules:  { free: 4,     plus: 20,     pro: Infinity },
  active_modules:      { free: 3,     plus: 8,      pro: Infinity },
  layout_presets:      { free: false, plus: true,   pro: true     },
  layout_save_custom:  { free: false, plus: false,  pro: true     },
  famille:             { free: false, plus: false,  pro: true     },
  sync_bancaire:       { free: false, plus: false,  pro: true     },
  export:              { free: false, plus: true,   pro: true     },
  support:             { free: 'FAQ', plus: 'Email 48h', pro: 'Priorité 24h' },
};

export function getFeatureValue(feature: FeatureKey, tier: Tier): FeatureValue {
  return MATRIX[feature][tier];
}

export function canUse(feature: FeatureKey, tier: Tier, count?: number): boolean {
  const val = MATRIX[feature][tier];
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number' && count !== undefined) return count < val;
  return true;
}

/** Mock Stripe — à remplacer Cycle F */
export function setTierDirect(tier: Tier): void {
  localStorage.setItem('fluxo_tier_mock', tier);
  window.location.reload();
}

export function getMockTier(): Tier {
  const v = localStorage.getItem('fluxo_tier_mock');
  return (v === 'plus' || v === 'pro') ? v : 'free';
}
