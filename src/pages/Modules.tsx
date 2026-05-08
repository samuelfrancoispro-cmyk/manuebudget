import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import { HardGate } from '@/components/gate/HardGate';
import { useEntitlement } from '@/hooks/useEntitlement';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_MODULES, OPTIONAL_MODULES } from '@/workspace/ModuleRegistry';
import type { ModuleDefinition } from '@/workspace/ModuleRegistry';
import { ModulePreview } from '@/workspace/ModulePreviews';

function ModuleCard({ module }: { module: ModuleDefinition }) {
  const isModuleActive = useStore((s) => s.isModuleActive);
  const toggleModule = useStore((s) => s.toggleModule);
  const modules = useStore((s) => s.modules);

  const active = isModuleActive(module.key);
  const optionalActiveCount = OPTIONAL_MODULES.filter((m) => modules[m.key]).length;
  const { allowed: canActivateMore } = useEntitlement('optional_modules', optionalActiveCount);

  const isOptional = !module.defaultActive;
  const canToggle = module.defaultActive || canActivateMore || active;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition ${
        !active && isOptional ? 'opacity-75' : ''
      }`}
    >
      {/* Mini preview 72px */}
      <div className="flex h-[72px] items-center justify-center overflow-hidden bg-paper px-3">
        <ModulePreview moduleKey={module.key} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <module.icon className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="text-sm font-semibold text-ink">{module.name}</span>
          </div>
          {module.requiredTier !== 'free' && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {module.requiredTier === 'plus' ? 'Plus' : 'Pro'}
            </Badge>
          )}
        </div>

        <p className="flex-1 text-xs text-ink-muted">{module.description}</p>

        <div className="flex items-center justify-between">
          {!canToggle && !active ? (
            <HardGate featureKey="optional_modules" current={optionalActiveCount}>
              <Switch checked={active} disabled />
            </HardGate>
          ) : (
            <Switch
              checked={active}
              onCheckedChange={() => toggleModule(module.key)}
              disabled={module.defaultActive}
              aria-label={`Activer ${module.name}`}
            />
          )}
          {module.defaultActive && (
            <span className="text-[11px] text-ink-muted">Inclus</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Modules() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">{t('nav.modules')}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Active ou désactive les modules selon tes besoins. Les modules inclus sont toujours disponibles.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Modules inclus
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_MODULES.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Modules optionnels
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OPTIONAL_MODULES.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
