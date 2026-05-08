import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { MODULE_REGISTRY } from '@/workspace/ModuleRegistry';

const MAX_DOCK_ITEMS = 5;

export function MobileDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const isModuleActive = useStore((s) => s.isModuleActive);

  const activeModules = MODULE_REGISTRY.filter(
    (m) => m.navEntry && isModuleActive(m.key)
  );

  const visibleModules = activeModules.slice(0, MAX_DOCK_ITEMS - 1);
  const hasMore = activeModules.length >= MAX_DOCK_ITEMS;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-[24px] px-2 py-2 shadow-2xl md:hidden"
      style={{ background: '#1c1b19' }}
    >
      {/* Accueil */}
      <button
        onClick={() => navigate('/dashboard')}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
          location.pathname === '/dashboard'
            ? 'bg-white/20 text-white'
            : 'text-white/50 hover:bg-white/10 hover:text-white'
        )}
        aria-label="Accueil"
      >
        <LayoutDashboard className="h-5 w-5" />
      </button>

      {visibleModules.map((m) => {
        const isCurrent = m.route ? location.pathname === m.route : false;
        return (
          <button
            key={m.key}
            onClick={() => {
              if (!m.route) {
                toast.info('Disponible prochainement');
                return;
              }
              navigate(m.route);
            }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
              isCurrent
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            )}
            aria-label={m.name}
          >
            <m.icon className="h-5 w-5" />
          </button>
        );
      })}

      {hasMore && (
        <button
          onClick={() => navigate('/modules')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Plus de modules"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
