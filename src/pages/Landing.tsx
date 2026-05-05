import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wallet, LayoutDashboard, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignIn = () => navigate("/login?mode=signin");
  const handleSignUp = () => navigate("/login?mode=signup");

  const features = [
    { id: "f1", icon: LayoutDashboard, label: t("landing.feature1"), desc: t("landing.feature1Desc") },
    { id: "f2", icon: Zap,             label: t("landing.feature2"), desc: t("landing.feature2Desc") },
    { id: "f3", icon: ShieldCheck,     label: t("landing.feature3"), desc: t("landing.feature3Desc") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">{t("nav.appName")}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignIn}>
          {t("landing.signIn")}
        </Button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="space-y-3 max-w-lg">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.tagline")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("landing.subtitle")}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={handleSignUp}>
            {t("landing.createAccount")}
          </Button>
          <Button size="lg" variant="outline" onClick={handleSignIn}>
            {t("landing.signIn")}
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4 max-w-2xl w-full">
          {features.map(({ id, icon: Icon, label, desc }) => (
            <div key={id} className="rounded-lg border border-border p-4 text-left space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
