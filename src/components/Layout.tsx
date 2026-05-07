// src/components/Layout.tsx
import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PiggyBank,
  Settings,
  Wallet,
  PieChart,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useStore } from "@/store/useStore";
import { createPortalSession } from "@/lib/stripe";

export default function Layout() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const profile = useStore((s) => s.profile);
  const [portalLoading, setPortalLoading] = useState(false);

  const trialExpired =
    !!profile?.trialEndsAt &&
    new Date(profile.trialEndsAt) <= new Date() &&
    !profile?.subscriptionStatus;
  const isPastDue = profile?.subscriptionStatus === "past_due";

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const nav = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/argent", label: t("nav.money"), icon: Wallet },
    { to: "/epargne", label: t("nav.savings"), icon: PiggyBank },
    { to: "/rapports", label: t("nav.reports"), icon: PieChart },
    { to: "/parametres", label: t("nav.settings"), icon: Settings },
    { to: "/aide", label: t("nav.help"), icon: HelpCircle },
  ];

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-paper px-4 md:hidden">
        <BrandLogo variant="mark" className="h-7" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={t("nav.toggleTheme")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label={t("nav.openMenu")}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80%] border-r border-border bg-paper shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <BrandLogo variant="full" className="h-7" />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label={t("nav.close")}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavList nav={nav} onClick={() => setMobileOpen(false)} />
            <div className="mt-2 space-y-2 border-t border-border p-3">
              {user?.email && (
                <div className="truncate px-1 text-xs text-ink-muted" title={user.email}>
                  {user.email}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={toggle}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}
              </Button>
              <Button variant="ghost" className="w-full" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-paper md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <BrandLogo variant="full" className="h-7" />
        </div>
        <NavList nav={nav} />
        <div className="mt-auto space-y-2 border-t border-border p-3">
          {user?.email && (
            <div className="truncate px-1 text-xs text-ink-muted" title={user.email}>
              {user.email}
            </div>
          )}
          <Button variant="outline" className="w-full justify-start" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        {/* Banner trial expiré */}
        {trialExpired && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <span>{t("subscription.trialExpiredBanner")}</span>
            <Link to="/parametres#abonnement" className="font-medium underline underline-offset-2">
              {t("subscription.trialExpiredCta")}
            </Link>
          </div>
        )}

        {/* Banner paiement échoué */}
        {isPastDue && (
          <div className="flex items-center justify-center gap-2 bg-red-50 px-4 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            <span>{t("subscription.pastDueBanner")}</span>
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="font-medium underline underline-offset-2 disabled:opacity-50"
            >
              {t("subscription.pastDueCta")}
            </button>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavList({
  nav,
  onClick,
}: {
  nav: { to: string; label: string; icon: React.ElementType }[];
  onClick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-surface text-ink"
                : "text-ink-muted hover:bg-surface hover:text-ink"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
