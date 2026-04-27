import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Calculator,
  Settings,
  Wallet,
  Repeat,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/comptes", label: "Mes comptes", icon: Wallet },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/recurrents", label: "Récurrents", icon: Repeat },
  { to: "/epargne", label: "Épargne", icon: PiggyBank },
  { to: "/simulateur", label: "Simulateur", icon: Calculator },
  { to: "/parametres", label: "Paramètres", icon: Settings },
  { to: "/aide", label: "Aide", icon: HelpCircle },
];

export default function Layout() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <span className="font-semibold">Budget</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Changer le thème">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80%] border-r bg-background shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="font-semibold">Budget</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavList onClick={() => setMobileOpen(false)} />
            <div className="mt-2 space-y-2 border-t p-3">
              {user?.email && (
                <div className="truncate px-1 text-xs text-muted-foreground" title={user.email}>
                  {user.email}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={toggle}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Wallet className="h-5 w-5" />
          <span className="font-semibold">Budget</span>
        </div>
        <NavList />
        <div className="mt-auto space-y-2 border-t p-3">
          {user?.email && (
            <div className="truncate px-1 text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </div>
          )}
          <Button variant="outline" className="w-full justify-start" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavList({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
