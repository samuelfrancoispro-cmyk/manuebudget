// src/components/brand/PricingTable.tsx
import React, { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tier } from "@/types";
import { ProBadge } from "./ProBadge";
import { Eyebrow } from "./Eyebrow";

// ── Tier definitions (inline — new pricing matrix W1) ──────────────────────
interface TierDef {
  id: Tier;
  name: string;
  tagline: string;
  monthlyPriceEUR: number;
  yearlyPriceEUR: number;
  yearlyDiscountPct: number;
  trialDays: number;
  isHighlighted?: boolean;
}

const TIERS: TierDef[] = [
  { id: "free",  name: "Gratuit", tagline: "Pour découvrir Fluxo, sans engagement.", monthlyPriceEUR: 0,    yearlyPriceEUR: 0,  yearlyDiscountPct: 0,  trialDays: 0 },
  { id: "plus",  name: "Plus",    tagline: "Tout ce qu'il faut au quotidien.",       monthlyPriceEUR: 2.99, yearlyPriceEUR: 24, yearlyDiscountPct: 33, trialDays: 14, isHighlighted: true },
  { id: "pro",   name: "Pro",     tagline: "Sync bancaire automatique et tout l'arsenal.", monthlyPriceEUR: 4.99, yearlyPriceEUR: 39, yearlyDiscountPct: 35, trialDays: 14 },
];

const HIGHLIGHTS: Record<Tier, string[]> = {
  free: ["1 sheet whiteboard", "4 modules max", "3 modules actifs", "Export basique"],
  plus: ["5 sheets whiteboard", "20 modules max", "8 modules actifs", "Essai 14j sans CB"],
  pro:  ["Sheets illimitées", "Modules illimités", "Sync bancaire GoCardless", "Support prioritaire 24h"],
};

// ── Feature matrix (simplified for display) ─────────────────────────────────
type FeatureValue = boolean | number | string;

interface Feature {
  label: string;
  section: string;
  values: Record<Tier, FeatureValue>;
}

const FEATURES: Feature[] = [
  { label: "Sheets whiteboard",   section: "Whiteboard",  values: { free: 1,     plus: 5,      pro: "∞" } },
  { label: "Modules sur canvas",  section: "Whiteboard",  values: { free: 4,     plus: 20,     pro: "∞" } },
  { label: "Modules actifs",      section: "Whiteboard",  values: { free: 3,     plus: 8,      pro: "∞" } },
  { label: "Presets de layout",   section: "Whiteboard",  values: { free: false, plus: true,   pro: true  } },
  { label: "Layout custom sauvegardé", section: "Whiteboard", values: { free: false, plus: false, pro: true } },
  { label: "Espace famille",      section: "Fonctions",   values: { free: false, plus: false,  pro: true  } },
  { label: "Sync bancaire",       section: "Fonctions",   values: { free: false, plus: false,  pro: true  } },
  { label: "Export données",      section: "Fonctions",   values: { free: false, plus: true,   pro: true  } },
  { label: "Support",             section: "Support",     values: { free: "FAQ", plus: "Email 48h", pro: "Priorité 24h" } },
];

const SECTIONS = ["Whiteboard", "Fonctions", "Support"];

function renderValue(val: FeatureValue): React.ReactNode {
  if (val === true)  return <Check className="h-4 w-4 text-positive mx-auto" />;
  if (val === false) return <Minus className="h-4 w-4 text-ink-muted mx-auto" />;
  return <span className="text-ink">{String(val)}</span>;
}

interface PricingTableProps {
  onSelectTier?: (tierId: Tier) => void;
  ctaLabel?: (tierId: Tier) => string;
  className?: string;
}

export function PricingTable({ onSelectTier, ctaLabel, className }: PricingTableProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className={cn("space-y-10", className)}>
      {/* Toggle mensuel / annuel */}
      <div className="flex items-center justify-center gap-2">
        {(["monthly", "yearly"] as const).map((b) => (
          <button
            key={b}
            onClick={() => setBilling(b)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              billing === b ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
            )}
          >
            {b === "monthly" ? "Mensuel" : "Annuel"}
          </button>
        ))}
      </div>

      {/* Cartes tiers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const isHighlighted = !!tier.isHighlighted;
          const price =
            billing === "yearly" && tier.yearlyPriceEUR > 0
              ? tier.yearlyPriceEUR / 12
              : tier.monthlyPriceEUR;

          return (
            <div
              key={tier.id}
              className={cn(
                "flex flex-col gap-6 rounded-2xl border p-6",
                isHighlighted ? "border-ink bg-ink text-paper" : "border-border bg-surface"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-base font-semibold", isHighlighted ? "text-paper" : "text-ink")}>
                    {tier.name}
                  </span>
                  {tier.id === "pro" && <ProBadge />}
                </div>
                <p className={cn("text-sm", isHighlighted ? "text-paper/70" : "text-ink-muted")}>
                  {tier.tagline}
                </p>
              </div>

              <div>
                {tier.monthlyPriceEUR === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-4xl font-bold tracking-[-0.025em]", isHighlighted ? "text-paper" : "text-ink")}>0 €</span>
                    <span className={cn("text-sm", isHighlighted ? "text-paper/60" : "text-ink-muted")}>/ pour toujours</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-4xl font-bold tracking-[-0.025em] tabular-nums", isHighlighted ? "text-paper" : "text-ink")}>
                        {price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </span>
                      <span className={cn("text-sm", isHighlighted ? "text-paper/60" : "text-ink-muted")}>/ mois</span>
                    </div>
                    {billing === "yearly" && tier.yearlyPriceEUR > 0 && (
                      <p className={cn("text-xs", isHighlighted ? "text-paper/70" : "text-ink-muted")}>
                        Facturé {tier.yearlyPriceEUR} € / an — économisez {tier.yearlyDiscountPct}%
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-2">
                {HIGHLIGHTS[tier.id].map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm">
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", isHighlighted ? "text-paper" : "text-positive")} />
                    <span className={isHighlighted ? "text-paper/90" : "text-ink"}>{h}</span>
                  </li>
                ))}
              </ul>

              {onSelectTier && (
                <Button
                  variant={isHighlighted ? "secondary" : "outline"}
                  className={cn("mt-auto w-full", isHighlighted && "bg-paper text-ink hover:bg-surface")}
                  onClick={() => onSelectTier(tier.id)}
                >
                  {ctaLabel
                    ? ctaLabel(tier.id)
                    : tier.trialDays > 0
                    ? "Essayer 14 jours gratuit"
                    : "Commencer gratuitement"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Tableau comparatif */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Fonctionnalité</th>
              {TIERS.map((t) => (
                <th key={t.id} className="px-4 py-3 text-center font-medium text-ink">{t.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((section) => {
              const sectionFeatures = FEATURES.filter((f) => f.section === section);
              if (sectionFeatures.length === 0) return null;
              return (
                <React.Fragment key={`section-${section}`}>
                  <tr className="border-b border-border bg-surface/50">
                    <td colSpan={4} className="px-4 py-2">
                      <Eyebrow>{section}</Eyebrow>
                    </td>
                  </tr>
                  {sectionFeatures.map((feature) => (
                    <tr key={feature.label} className="border-b border-border last:border-0 hover:bg-surface/30 transition-colors">
                      <td className="px-4 py-3 text-ink">{feature.label}</td>
                      {TIERS.map((t) => (
                        <td key={t.id} className="px-4 py-3 text-center">
                          {renderValue(feature.values[t.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
