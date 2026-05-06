// src/pages/Landing.tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Zap, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { PricingTable } from "@/components/brand/PricingTable";

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goSignUp = () => navigate("/login?mode=signup");
  const goSignIn = () => navigate("/login?mode=signin");

  const featureIcons = [LayoutDashboard, Zap, ShieldCheck, Globe];
  const featureKeys = ["f1", "f2", "f3", "f4"] as const;
  const faqKeys = ["q1", "q2", "q3", "q4", "q5"] as const;

  const stats = [
    { val: t("landing.stats.val1"), label: t("landing.stats.label1") },
    { val: t("landing.stats.val2"), label: t("landing.stats.label2") },
    { val: t("landing.stats.val3"), label: t("landing.stats.label3") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-paper/90 px-6 py-3 backdrop-blur-sm">
        <BrandLogo variant="full" className="h-7" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goSignIn}>
            {t("landing.signIn")}
          </Button>
          <Button size="sm" onClick={goSignUp}>
            {t("landing.tryFree")}
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center gap-8 px-4 py-20 text-center">
          <Eyebrow>{t("landing.eyebrow")}</Eyebrow>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-bold tracking-[-0.025em] sm:text-5xl leading-tight">
              {t("landing.tagline")}
            </h1>
            <p className="text-base text-ink-muted sm:text-lg max-w-xl mx-auto">
              {t("landing.subtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={goSignUp}>
              {t("landing.tryFree")}
            </Button>
            <Button size="lg" variant="outline" onClick={goSignIn}>
              {t("landing.signIn")}
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-10">
            <SectionHeader
              eyebrow={t("landing.features.eyebrow")}
              title={t("landing.features.title")}
              description={t("landing.features.subtitle")}
              align="center"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featureKeys.map((key, i) => {
                const Icon = featureIcons[i];
                return (
                  <div
                    key={key}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-paper p-5"
                  >
                    <div className="rounded-lg bg-surface p-2 shrink-0">
                      <Icon className="h-5 w-5 text-ink-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {t(`landing.features.${key}Title`)}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {t(`landing.features.${key}Desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-t border-border px-4 py-10 sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 sm:flex-row sm:justify-around">
            {stats.map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold tracking-[-0.025em] text-ink tabular-nums">
                  {val}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-10">
            <SectionHeader
              eyebrow={t("landing.pricing.eyebrow")}
              title={t("landing.pricing.title")}
              description={t("landing.pricing.subtitle")}
              align="center"
            />
            <PricingTable
              onSelectTier={() => goSignUp()}
              ctaLabel={(id) =>
                id === "free"
                  ? t("landing.pricing.ctaFree")
                  : t("landing.pricing.ctaTrial")
              }
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-8">
            <SectionHeader
              eyebrow={t("landing.faq.eyebrow")}
              title={t("landing.faq.title")}
              align="center"
            />
            <Accordion type="single" collapsible className="space-y-2">
              {faqKeys.map((key, i) => (
                <AccordionItem
                  key={key}
                  value={key}
                  className="rounded-xl border border-border px-4"
                >
                  <AccordionTrigger className="text-sm font-medium text-ink hover:no-underline">
                    {t(`landing.faq.${key}`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-ink-muted pb-4">
                    {t(`landing.faq.a${i + 1}`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-ink-muted">{t("landing.footer")}</p>
          <div className="flex gap-4">
            <a href="/legal/terms" className="text-xs text-ink-muted hover:text-ink transition-colors">
              {t("landing.legal.terms")}
            </a>
            <a href="/legal/privacy" className="text-xs text-ink-muted hover:text-ink transition-colors">
              {t("landing.legal.privacy")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
