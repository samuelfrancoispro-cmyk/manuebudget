import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { MODULE_CATALOGUE, MODULE_CATEGORIES } from '@/store/slices/modulesSlice';
import { cn } from '@/lib/utils';
import type { ModuleMeta } from '@/store/slices/modulesSlice';

interface Props {
  search: string;
}

export default function ModuleCategoryList({ search }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Récupère le tier depuis useStore directement pour éviter dépendance hook
  const tier = (() => {
    try {
      const v = localStorage.getItem('fluxo_tier_mock');
      return (v === 'plus' || v === 'pro') ? v : 'free';
    } catch { return 'free'; }
  })();

  const toggle = (cat: string) =>
    setCollapsed((s) => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  const filtered = search.trim()
    ? MODULE_CATALOGUE.filter((m) => m.key.includes(search.toLowerCase()) || m.category.includes(search.toLowerCase()))
    : null;

  if (filtered) {
    return (
      <div className="flex flex-col gap-0.5">
        {filtered.map((m) => <ModuleCard key={m.key} meta={m} tier={tier} />)}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground px-2 py-2">Aucun résultat</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {MODULE_CATEGORIES.map(({ key }) => {
        const items = MODULE_CATALOGUE.filter((m) => m.category === key);
        const isCollapsed = collapsed.has(key);
        return (
          <div key={key}>
            <button
              onClick={() => toggle(key)}
              className="flex items-center gap-1 w-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
              <span className="uppercase tracking-wide">{key}</span>
            </button>
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 pl-1">
                {items.map((m) => <ModuleCard key={m.key} meta={m} tier={tier} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ModuleCard({ meta, tier }: { meta: ModuleMeta; tier: string }) {
  const isSoon = meta.status === 'soon';
  const isLocked = !isSoon && (meta.tier === 'pro' && tier !== 'pro' || meta.tier === 'plus' && tier === 'free');
  const isDraggable = !isSoon;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbar-${meta.key}`,
    data: { moduleKey: meta.key, meta },
    disabled: !isDraggable,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
      className={cn(
        'flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors',
        isDraggable ? 'cursor-grab hover:bg-muted' : 'cursor-default opacity-50',
        isDragging && 'opacity-30',
      )}
    >
      <span className="truncate text-xs capitalize">{meta.key.replace(/-/g, ' ')}</span>
      <div className="flex items-center gap-1 shrink-0">
        {isSoon && <span className="text-[10px] px-1 bg-muted rounded text-muted-foreground">Bientôt</span>}
        {isLocked && !isSoon && <Lock size={10} className="text-muted-foreground" />}
        {meta.tier !== 'free' && !isSoon && (
          <span className={cn('text-[10px] px-1 rounded', meta.tier === 'pro' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30')}>
            {meta.tier === 'pro' ? 'Pro' : 'Plus'}
          </span>
        )}
      </div>
    </div>
  );
}
