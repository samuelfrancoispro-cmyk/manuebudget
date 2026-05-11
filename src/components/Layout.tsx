// src/components/Layout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, DollarSign, PiggyBank, Settings, HelpCircle, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/argent',    icon: DollarSign,       labelKey: 'nav.argent' },
  { to: '/epargne',   icon: PiggyBank,         labelKey: 'nav.epargne' },
  { to: '/modules',   icon: Grid3X3,           labelKey: 'nav.modules' },
  { to: '/parametres',icon: Settings,          labelKey: 'nav.parametres' },
  { to: '/aide',      icon: HelpCircle,        labelKey: 'nav.aide' },
];

export default function Layout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[184px] border-r border-border bg-paper px-3 py-6 gap-1">
        <span className="px-3 mb-4 font-semibold text-base text-ink">Fluxo</span>
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-ink text-paper font-medium"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey, { defaultValue: labelKey })}
          </NavLink>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden md:ml-[184px]">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile dock */}
      <nav className="fixed bottom-0 left-0 right-0 flex md:hidden border-t border-border bg-paper px-2 pb-safe">
        {NAV_ITEMS.slice(0, 5).map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                isActive ? "text-ink font-medium" : "text-ink-muted"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {t(labelKey, { defaultValue: '' })}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
