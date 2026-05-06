// src/components/brand/PricingTable.tsx
import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tiers, features, sectionLabels, type TierId, type FeatureValue } from "@/lib/pricing";
import { PriceTag } from "./PriceTag";
import { ProBadge } from "./ProBadge";
import { Eyebrow } from "./Eyebrow";

const HIGHLIGHTS: Record<TierId, string[]> = {
  free: [
    "1 compte courant",
    "1 compte épargne",
    "50 transactions / mois",
    "5 charges récurrentes",
    "Export JSON sauvegarde",
  ],
  plus: [
    "5 comptes courants & épargne",
    "Transactions illimitées",
    "Import CSV bancaire (5/mois)",
    "Export Excel multi-feuilles",
    "Essai 14j sans CB",
  ],
  pro: [
    "Comptes illimités",
    "Sync automatique GoCardless",
    "Catégorisation auto des transactions",
    "Support prioritaire 24h",
    "Essai 14j sans CB",
  ],
};

function renderFeatureValue(val: FeatureValue): React.ReactNode {
  if (val === true) return <Check className="h-4 w-4 text-positive mx-auto" />;
  if (val === false) return <Minus className="h-4 w-4 text-ink-muted mx-auto" />;
  if (val === "unlimited") return <span className="text-ink">Illimité</span>;
  return <span className="text-ink">{String(val)}</span>;
}

interface PricingTableProps {
  onSelectTier?: (tierId: TierId) => void;
  ctaLabel?: (tierId: TierId) => string;
  className?: string;
}

export function PricingTable({ onSelectTier, ctaLabel, className }: PricingTableProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className={cn("space-y-10", className)}>
      {/* Toggle mensuel / annuel */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setBilling("monthly")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            billing === "monthly"
              ? "bg-ink text-paper"
              : "text-ink-muted hover:text-ink"
          )}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            billing === "yearly"
              ? "bg-ink text-paper"
              : "text-ink-muted hover:text-ink"
          )}
        >
          Annuel
        </button>
      </div>

      {/* Cartes tiers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiers.map((tier) => {
          const isHighlighted = !!tier.isHighlighted;
          const price =
            billing === "yearly" && tier.yearlyPriceEUR > 0
              ? tier.yearlyPriceEUR / 12
              : tier.monthlyPriceEUR;
          const yearlyPrice = tier.yearlyPriceEUR;

          return (
            <div
              key={tier.id}
              className={cn(
                "flex flex-col gap-6 rounded-2xl border p-6",
                isHighlighted
                  ? "border-ink bg-ink text-paper"
                  : "border-border bg-surface"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-base font-semibold",
                      isHighlighted ? "text-paper" : "text-ink"
                    )}
                  >
                    {tier.name}
                  </span>
                  {tier.id === "pro" && <ProBadge />}
                </div>
                <p
                  className={cn(
                    "text-sm",
                    isHighlighted ? "text-paper/70" : "text-ink-muted"
                  )}
                >
                  {tier.tagline}
                </p>
              </div>

              <div>
                {tier.monthlyPriceEUR === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-4xl font-bold tracking-[-0.025em]",
                        isHighlighted ? "text-paper" : "text-ink"
                      )}
                    >
                      0 €
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        isHighlighted ? "text-paper/60" : "text-ink-muted"
                      )}
                    >
                      / pour toujours
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-4xl font-bold tracking-[-0.025em] tabular-nums",
                          isHighlighted ? "text-paper" : "text-ink"
                        )}
                      >
                        {price.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          isHighlighted ? "text-paper/60" : "text-ink-muted"
                        )}
                      >
                        / mois
                      </span>
                    </div>
                    {billing === "yearly" && yearlyPrice > 0 && (
                      <p
                        className={cn(
                          "text-xs",
                          isHighlighted ? "text-paper/70" : "text-ink-muted"
                        )}
                      >
                        Facturé {yearlyPrice} € / an — économisez {tier.yearlyDiscountPct}%
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-2">
                {HIGHLIGHTS[tier.id].map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        isHighlighted ? "text-paper" : "text-positive"
                      )}
                    />
                    <span className={isHighlighted ? "text-paper/90" : "text-ink"}>
                      {h}
                    </span>
                  </li>
                ))}
              </ul>

              {onSelectTier && (
                <Button
                  variant={isHighlighted ? "secondary" : "outline"}
                  className={cn(
                    "mt-auto w-full",
                    isHighlighted &&
                      "bg-paper text-ink hover:bg-surface"
                  )}
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

      {/* Tableau comparatif complet */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Fonctionnalité</th>
              {tiers.map((t) => (
                <th key={t.id} className="px-4 py-3 text-center font-medium text-ink">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(sectionLabels).map(([section, sectionLabel]) => {
              const sectionFeatures = features.filter((f) => f.section === section);
              if (sectionFeatures.length === 0) return null;
              return (
                <>
                  <tr key={`section-${section}`} className="border-b border-border bg-surface/50">
                    <td colSpan={4} className="px-4 py-2">
                      <Eyebrow>{sectionLabel}</Eyebrow>
                    </td>
                  </tr>
                  {sectionFeatures.map((feature) => (
                    <tr
                      key={feature.key}
                      className="border-b border-border last:border-0 hover:bg-surface/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-ink">{feature.label}</td>
                      {tiers.map((t) => (
                        <td key={t.id} className="px-4 py-3 text-center">
                          {renderFeatureValue(feature.values[t.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
