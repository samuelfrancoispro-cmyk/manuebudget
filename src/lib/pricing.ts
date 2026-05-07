// src/lib/pricing.ts
// Source de vérité tiers + matrice features Fluxo.
// Cycle A : structure typée, pas de gating runtime.
// Spec : docs/superpowers/specs/2026-05-05-cycle-a-fondations-design.md §5

export type TierId = "free" | "plus" | "pro";

export interface Tier {
  id: TierId;
  name: string;
  tagline: string;
  monthlyPriceEUR: number;     // 0 pour free
  yearlyPriceEUR: number;       // 0 pour free
  yearlyDiscountPct: number;    // 0 pour free
  trialDays: number;            // 0 pour free
  isHighlighted?: boolean;      // mise en avant visuelle dans la grille
}

export const tiers: Tier[] = [
  {
    id: "free",
    name: "Gratuit",
    tagline: "Pour découvrir Fluxo, sans engagement.",
    monthlyPriceEUR: 0,
    yearlyPriceEUR: 0,
    yearlyDiscountPct: 0,
    trialDays: 0,
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Tout ce qu'il faut au quotidien, sans limite.",
    monthlyPriceEUR: 2.99,
    yearlyPriceEUR: 24,
    yearlyDiscountPct: 33,
    trialDays: 14,
    isHighlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Sync bancaire automatique et tout l'arsenal.",
    monthlyPriceEUR: 4.99,
    yearlyPriceEUR: 39,
    yearlyDiscountPct: 35,
    trialDays: 14,
  },
];

export type FeatureValue = boolean | number | "unlimited" | string;

export type FeatureKey =
  | "comptes_courants"
  | "comptes_epargne"
  | "transactions_mois"
  | "recurrentes"
  | "objectifs"
  | "projets"
  | "categories_perso"
  | "appareils_simultanes"
  | "install_pwa"
  | "dark_mode"
  | "import_csv"
  | "analyse_rapports"
  | "export_excel"
  | "export_json"
  | "sync_bancaire"
  | "categorisation_auto"
  | "support"
  | "trial";

/** Retourne la valeur d'une feature pour un tier donné. */
export function getFeatureValue(key: FeatureKey, tier: TierId): FeatureValue {
  const feat = features.find((f) => f.key === key);
  return feat ? feat.values[tier] : false;
}

/** Retourne le tier minimal qui débloque une feature (premier tier où la valeur est truthy/non-zéro). */
export function getRequiredTier(key: FeatureKey): TierId {
  const order: TierId[] = ["free", "plus", "pro"];
  for (const tier of order) {
    const val = getFeatureValue(key, tier);
    if (val !== false && val !== 0) return tier;
  }
  return "pro";
}

export interface Feature {
  key: string;
  label: string;
  section: "limits" | "usage" | "reports" | "banking" | "support";
  values: Record<TierId, FeatureValue>;
}

export const features: Feature[] = [
  // Limites d'utilisation
  { key: "comptes_courants", label: "Comptes courants", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "comptes_epargne", label: "Comptes épargne", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "transactions_mois", label: "Transactions / mois", section: "limits",
    values: { free: 50, plus: "unlimited", pro: "unlimited" } },
  { key: "recurrentes", label: "Charges récurrentes", section: "limits",
    values: { free: 5, plus: "unlimited", pro: "unlimited" } },
  { key: "objectifs", label: "Objectifs épargne", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "projets", label: "Projets simulateur", section: "limits",
    values: { free: 1, plus: 5, pro: "unlimited" } },
  { key: "categories_perso", label: "Catégories personnalisées", section: "limits",
    values: { free: false, plus: true, pro: true } },

  // Restrictions d'usage
  { key: "appareils_simultanes", label: "Appareils simultanés", section: "usage",
    values: { free: 1, plus: "unlimited", pro: "unlimited" } },
  { key: "install_pwa", label: "Installation app (PWA)", section: "usage",
    values: { free: false, plus: true, pro: true } },
  { key: "dark_mode", label: "Mode sombre", section: "usage",
    values: { free: true, plus: true, pro: true } },

  // Rapports & analyse
  { key: "import_csv", label: "Import CSV bancaire", section: "reports",
    values: { free: false, plus: "5 / mois", pro: "unlimited" } },
  { key: "analyse_rapports", label: "Analyse rapports (5 onglets)", section: "reports",
    values: { free: false, plus: true, pro: true } },
  { key: "export_excel", label: "Export Excel multi-feuilles", section: "reports",
    values: { free: false, plus: true, pro: true } },
  { key: "export_json", label: "Export JSON sauvegarde", section: "reports",
    values: { free: true, plus: true, pro: true } },

  // Banking & sync
  { key: "sync_bancaire", label: "Sync auto GoCardless", section: "banking",
    values: { free: false, plus: false, pro: true } },
  { key: "categorisation_auto", label: "Catégorisation auto transactions", section: "banking",
    values: { free: false, plus: false, pro: true } },

  // Support
  { key: "support", label: "Support", section: "support",
    values: { free: "FAQ", plus: "Email 48h", pro: "Email priorité 24h" } },
  { key: "trial", label: "Essai gratuit 14j sans CB", section: "support",
    values: { free: false, plus: true, pro: true } },
];

export const sectionLabels: Record<Feature["section"], string> = {
  limits: "Limites d'utilisation",
  usage: "Restrictions d'usage",
  reports: "Rapports & analyse",
  banking: "Banking & sync",
  support: "Support & garanties",
};

/** Format un prix tier (helper utilisé par PriceTag) */
export function formatTierPrice(eur: number): string {
  if (eur === 0) return "0 €";
  return `${eur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
