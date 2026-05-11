# W1-05 — Dashboard + App + Onboarding + Pages

> **Prérequis :** Plans 01–04 terminés.
> **Sub-skill recommandé :** superpowers:subagent-driven-development

**Goal:** Assembler toutes les pièces — Dashboard whiteboard complet, App.tsx nettoyée, Onboarding 4 étapes, pages Modules et Paramètres.

---

### Task 1: Dashboard.tsx (shell whiteboard + DndContext + HardGate)

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Réécrire `src/pages/Dashboard.tsx`**

```tsx
import React, { useCallback } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useEntitlement } from '@/hooks/useEntitlement';
import { canUse } from '@/lib/pricing';
import WhiteboardCanvas from '@/whiteboard/WhiteboardCanvas';
import WhiteboardModule from '@/whiteboard/WhiteboardModule';
import DropZoneLayer from '@/whiteboard/DropZoneLayer';
import SheetTabs from '@/whiteboard/SheetTabs';
import FloatingToolbar from '@/toolbar/FloatingToolbar';
import ModuleSolde from '@/modules/solde/ModuleSolde';
import ModuleDepenses from '@/modules/depenses/ModuleDepenses';
import ModuleRecurrentes from '@/modules/recurrentes/ModuleRecurrentes';
import ModuleObjectif from '@/modules/objectif-epargne/ModuleObjectif';
import { screenToWorld, hasCollision } from '@/whiteboard/collisionUtils';
import { MODULE_CATALOGUE } from '@/store/slices/modulesSlice';
import type { WbModule, ModuleKey } from '@/types';
import { useState, useRef } from 'react';

// Registre module → composant
const MODULE_COMPONENTS: Partial<Record<ModuleKey, React.ComponentType<{ module: WbModule }>>> = {
  'solde':            ModuleSolde,
  'depenses':         ModuleDepenses,
  'recurrentes':      ModuleRecurrentes,
  'objectif-epargne': ModuleObjectif,
};

export default function Dashboard() {
  const activeSheetId = useStore((s) => s.activeSheetId);
  const sheets = useStore((s) => s.sheets);
  const wbModules = useStore((s) => s.wbModules);
  const addWbModule = useStore((s) => s.addWbModule);
  const profile = useStore((s) => s.profile);
  const { can, value } = useEntitlement();

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  // dnd-kit état drag en cours
  const [draggingKey, setDraggingKey] = useState<ModuleKey | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragOver = useCallback((e: { active: { data: { current?: { moduleKey: ModuleKey } } }; over: unknown }) => {
    const mk = e.active.data.current?.moduleKey;
    if (!mk) return;
    setIsOver(true);
    // Vérif gating + collision (simplified — collision précise faite au drop)
    const modCount = wbModules.filter((m) => m.sheetId === activeSheetId).length;
    const maxMods = value('whiteboard_modules') as number;
    setCanDrop(canUse('whiteboard_modules', profile?.tier ?? 'free', modCount) && modCount < maxMods);
  }, [wbModules, activeSheetId, value, profile]);

  const handleDragEnd = useCallback(async (e: { active: { data: { current?: { moduleKey: ModuleKey; meta: { defaultW: number; defaultH: number } } } }; delta: { x: number; y: number }; activatorEvent: Event }) => {
    setIsOver(false);
    setDraggingKey(null);
    const mk = e.active.data.current?.moduleKey;
    const meta = e.active.data.current?.meta;
    if (!mk || !meta || !activeSheetId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const zoom = activeSheet?.zoom ?? 1;
    const panX = activeSheet?.panX ?? 0;
    const panY = activeSheet?.panY ?? 0;

    // Position de drop = centre de l'event pointer
    const pointerEvent = e.activatorEvent as PointerEvent;
    const worldPos = screenToWorld(pointerEvent.clientX, pointerEvent.clientY, canvasRect, panX, panY, zoom);

    const rect = { x: worldPos.x - meta.defaultW / 2, y: worldPos.y - meta.defaultH / 2, w: meta.defaultW, h: meta.defaultH };
    const others = wbModules.filter((m) => m.sheetId === activeSheetId).map(({ x, y, w, h }) => ({ x, y, w, h }));

    if (hasCollision(rect, others)) return; // Drop refusé

    // Gating : vérifier limite modules
    const modCount = wbModules.filter((m) => m.sheetId === activeSheetId).length;
    if (!canUse('whiteboard_modules', profile?.tier ?? 'free', modCount)) {
      // TODO: ouvrir modale upgrade
      return;
    }

    // Vérifier tier du module
    const moduleMeta = MODULE_CATALOGUE.find((m) => m.key === mk);
    if (moduleMeta && moduleMeta.tier === 'pro' && profile?.tier !== 'pro') {
      // TODO: ouvrir modale upgrade
      return;
    }
    if (moduleMeta && moduleMeta.tier === 'plus' && profile?.tier === 'free') {
      // TODO: ouvrir modale upgrade
      return;
    }

    await addWbModule(activeSheetId, { moduleKey: mk, ...rect, config: {} });
  }, [activeSheetId, activeSheet, wbModules, addWbModule, canUse, value, profile]);

  const activeModules = activeSheetId
    ? wbModules.filter((m) => m.sheetId === activeSheetId)
    : [];

  if (!activeSheetId) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <SheetTabs />

      <DndContext sensors={sensors} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragStart={(e) => setDraggingKey(e.active.data.current?.moduleKey ?? null)}>
        <div ref={canvasRef} className="flex-1 relative">
          <WhiteboardCanvas sheetId={activeSheetId}>
            {activeModules.map((mod) => {
              const Component = MODULE_COMPONENTS[mod.moduleKey];
              return Component ? (
                <WhiteboardModule key={mod.id} module={mod} zoom={activeSheet?.zoom ?? 1}>
                  <Component module={mod} />
                </WhiteboardModule>
              ) : null;
            })}
          </WhiteboardCanvas>

          {/* DropZone feedback overlay */}
          <DropZoneLayer isOver={isOver} canDrop={canDrop} />
        </div>

        {/* DragOverlay — mini carte pendant le drag */}
        <DragOverlay>
          {draggingKey && (
            <motion.div
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm font-medium shadow-2xl opacity-90"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              {draggingKey}
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>

      <FloatingToolbar />
    </div>
  );
}
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build
git add src/pages/Dashboard.tsx
git commit -m "feat(w1): Dashboard — shell whiteboard complet + DnD"
```

---

### Task 2: App.tsx + Layout.tsx (cleanup + routes + guard)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Lire `src/App.tsx` actuel et identifier les routes obsolètes**

Supprimer : routes vers Argent, Epargne, Rapports, Simulateur, Transactions, Aide, et toute route vers workspace ou pages supprimées.

Garder : `/`, `/login`, `/auth/callback`, `/onboarding`, `/dashboard`, `/modules`, `/parametres`.

- [ ] **Step 2: Réécrire `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Modules from '@/pages/Modules';
import Parametres from '@/pages/Parametres';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const profile = useStore((s) => s.profile);
  const loaded = useStore((s) => s.loaded);
  const loadAll = useStore((s) => s.loadAll);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadAll(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadAll(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [loadAll]);

  if (!loaded) return <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Chargement…</div>;

  // Guard onboarding : si step < 4 et pas déjà sur /onboarding
  if (profile && profile.onboardingStep < 4 && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Routes protégées */}
        <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/modules" element={<AuthGuard><Modules /></AuthGuard>} />
        <Route path="/parametres" element={<AuthGuard><Parametres /></AuthGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Simplifier `src/components/Layout.tsx`**

Supprimer toute référence à FloatingSidebar, MobileDock, sidebar/navigation. Layout = simple wrapper full-height qui transmet les enfants.

```tsx
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
```

- [ ] **Step 4: Build check + commit**

```bash
npm run build
git add src/App.tsx src/components/Layout.tsx
git commit -m "feat(w1): App.tsx routes nettoyées + guard onboarding"
```

---

### Task 3: Onboarding.tsx (4 étapes)

**Files:**
- Modify: `src/pages/Onboarding.tsx`

- [ ] **Step 1: Réécrire `src/pages/Onboarding.tsx`**

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { setTierDirect } from '@/lib/pricing';

// ─── Étapes ───────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div className="flex flex-col items-center gap-6 text-center max-w-sm"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
        <span className="text-3xl font-bold text-primary-foreground">F</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Bienvenue sur Fluxo</h1>
        <p className="text-muted-foreground mt-2 text-sm">Construisez votre tableau de bord financier en glissant des modules sur votre whiteboard.</p>
      </div>
      <button onClick={onNext} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
        Commencer
      </button>
    </motion.div>
  );
}

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' }, { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' }, { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' }, { code: 'IE', name: 'Irlande', flag: '🇮🇪' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' }, { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' }, { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
];

function IdentityStep({ onNext }: { onNext: () => void }) {
  const updateProfile = useStore((s) => s.updateProfile);
  const setOnboardingStep = useStore((s) => s.setOnboardingStep);
  const [form, setForm] = useState({ firstName: '', lastName: '', country: 'FR' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.firstName.trim()) return;
    setSaving(true);
    await updateProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), country: form.country });
    await setOnboardingStep(2);
    onNext();
    setSaving(false);
  };

  return (
    <motion.div className="flex flex-col gap-5 w-full max-w-sm"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div>
        <h2 className="text-xl font-bold">Votre identité</h2>
        <p className="text-sm text-muted-foreground mt-1">Pour personnaliser votre expérience.</p>
      </div>
      <input placeholder="Prénom *" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
        className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
      <input placeholder="Nom (optionnel)" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
        className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
      <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
        className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none">
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
      </select>
      <button onClick={submit} disabled={!form.firstName.trim() || saving}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
        {saving ? 'Enregistrement…' : 'Continuer'}
      </button>
    </motion.div>
  );
}

function TutorialStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div className="flex flex-col gap-5 w-full max-w-sm"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div>
        <h2 className="text-xl font-bold">Comment ça marche ?</h2>
        <p className="text-sm text-muted-foreground mt-1">Fluxo fonctionne comme un tableau blanc.</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          { n: '1', text: 'Glissez un module depuis la barre flottante vers le canvas.' },
          { n: '2', text: 'Repositionnez et redimensionnez chaque module librement.' },
          { n: '3', text: 'Configurez chaque module via l\'icône ⚙.' },
          { n: '4', text: 'Créez plusieurs sheets pour organiser vos vues.' },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
            <p className="text-sm">{text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onNext} className="flex-1 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
          J'ai compris
        </button>
      </div>
    </motion.div>
  );
}

const PLANS = [
  { tier: 'free' as const, name: 'Gratuit', price: '0€', features: ['1 sheet', '4 modules', '3 modules actifs'] },
  { tier: 'plus' as const, name: 'Plus', price: '2,99€/mois', features: ['5 sheets', '20 modules', 'Export données'], highlight: false },
  { tier: 'pro' as const, name: 'Pro', price: '4,99€/mois', features: ['Sheets illimitées', 'Modules illimités', 'Sync bancaire GoCardless', 'Support prioritaire'], highlight: true },
];

function PricingStep({ onComplete }: { onComplete: (tier: 'free' | 'plus' | 'pro') => void }) {
  return (
    <motion.div className="flex flex-col gap-5 w-full max-w-lg"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div className="text-center">
        <h2 className="text-xl font-bold">Choisissez votre plan</h2>
        <p className="text-sm text-muted-foreground mt-1">Changez à tout moment. 14 jours d'essai gratuit.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PLANS.map(({ tier, name, price, features, highlight }) => (
          <div key={tier} className={`flex flex-col gap-3 p-4 rounded-2xl border ${highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
            <div>
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-lg font-bold mt-0.5">{price}</p>
            </div>
            <ul className="flex flex-col gap-1">
              {features.map((f) => <li key={f} className="text-xs text-muted-foreground">• {f}</li>)}
            </ul>
            <button
              onClick={() => onComplete(tier)}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border hover:bg-muted'}`}
            >
              {tier === 'free' ? 'Continuer gratuitement' : 'Essayer 14 jours'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Orchestrateur ────────────────────────────────────────
const STEPS = ['welcome', 'identity', 'tutorial', 'pricing'] as const;

export default function Onboarding() {
  const profile = useStore((s) => s.profile);
  const setOnboardingStep = useStore((s) => s.setOnboardingStep);
  const navigate = useNavigate();

  // Reprendre là où on s'est arrêté
  const [step, setStep] = useState(() => Math.min(profile?.onboardingStep ?? 0, STEPS.length - 1));

  const next = async () => {
    const nextStep = step + 1;
    await setOnboardingStep(nextStep);
    setStep(nextStep);
  };

  const complete = async (tier: 'free' | 'plus' | 'pro') => {
    setTierDirect(tier); // mock — persisté localStorage, reload
    await setOnboardingStep(4);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && <WelcomeStep key="welcome" onNext={next} />}
        {step === 1 && <IdentityStep key="identity" onNext={next} />}
        {step === 2 && <TutorialStep key="tutorial" onNext={next} />}
        {step === 3 && <PricingStep key="pricing" onComplete={complete} />}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build
git add src/pages/Onboarding.tsx
git commit -m "feat(w1): Onboarding — 4 étapes avec reprise"
```

---

### Task 4: Page Modules + Page Paramètres

**Files:**
- Modify: `src/pages/Modules.tsx`
- Modify: `src/pages/Parametres.tsx`

- [ ] **Step 1: Réécrire `src/pages/Modules.tsx`**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { MODULE_CATALOGUE, MODULE_CATEGORIES } from '@/store/slices/modulesSlice';
import { useEntitlement } from '@/hooks/useEntitlement';
import { cn } from '@/lib/utils';

export default function Modules() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { tier } = useEntitlement();

  const filtered = MODULE_CATALOGUE.filter((m) => {
    const matchSearch = !search || m.labelKey.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || m.category === activeCategory;
    return matchSearch && matchCat;
  });

  const statusLabel: Record<string, string> = { mvp: 'Disponible', available: 'Disponible', soon: 'Bientôt' };
  const tierBadge: Record<string, string> = { free: '', plus: 'Plus', pro: 'Pro' };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-xl font-bold">Catalogue des modules</h1>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="pl-7 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setActiveCategory(null)}
            className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', !activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
            Tous
          </button>
          {MODULE_CATEGORIES.map(({ key }) => (
            <button key={key} onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize', activeCategory === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
              {key}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const isSoon = m.status === 'soon';
            const needsUpgrade = m.tier === 'pro' && tier !== 'pro' || m.tier === 'plus' && tier === 'free';
            return (
              <div key={m.key} className={cn('p-4 rounded-2xl border border-border bg-card transition-opacity', isSoon && 'opacity-60')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">{m.key.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isSoon && <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Bientôt</span>}
                    {!isSoon && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 rounded">Dispo</span>}
                    {m.tier !== 'free' && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', m.tier === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>{tierBadge[m.tier]}</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Min {m.minW}×{m.minH}px
                  {needsUpgrade && !isSoon && <span className="ml-2 text-amber-600">→ Mettre à niveau</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Réécrire `src/pages/Parametres.tsx`**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useEntitlement } from '@/hooks/useEntitlement';
import { supabase } from '@/lib/supabase';
import { setTierDirect } from '@/lib/pricing';

export default function Parametres() {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const clearLocal = useStore((s) => s.clearLocal);
  const { tier } = useEntitlement();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: profile?.firstName ?? '', lastName: profile?.lastName ?? '', country: profile?.country ?? 'FR' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateProfile(form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearLocal();
    navigate('/login');
  };

  const tierLabel: Record<string, string> = { free: 'Gratuit', plus: 'Plus', pro: 'Pro' };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={16} /></Link>
          <h1 className="text-xl font-bold">Paramètres</h1>
        </div>

        {/* Profil */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profil</h2>
          <div className="flex gap-3">
            <input placeholder="Prénom" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
            <input placeholder="Nom" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <button onClick={save} disabled={saving}
            className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saved ? 'Enregistré ✓' : saving ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
        </section>

        {/* Abonnement */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Abonnement</h2>
          <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card">
            <div>
              <p className="font-medium">{tierLabel[tier]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tier === 'free' ? 'Passez à Plus ou Pro pour plus de modules' : 'Abonnement actif'}
              </p>
            </div>
            {tier !== 'pro' && (
              <button onClick={() => { setTierDirect('pro'); }}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
                Mettre à niveau
              </button>
            )}
          </div>
          {/* Mock dev — switcher tier rapide */}
          <div className="flex gap-2">
            {(['free', 'plus', 'pro'] as const).map((t) => (
              <button key={t} onClick={() => setTierDirect(t)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${tier === t ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                {t}
              </button>
            ))}
            <span className="text-xs text-muted-foreground self-center ml-1">(dev mock)</span>
          </div>
        </section>

        {/* Mon compte */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mon compte</h2>
          <p className="text-sm text-muted-foreground">{/* email from supabase.auth — lecture seule */}Email : <span className="text-foreground">—</span></p>
          <button onClick={logout} className="self-start px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
            Se déconnecter
          </button>
          <button className="self-start px-4 py-2 border border-destructive/50 rounded-xl text-sm text-destructive hover:bg-destructive/5 transition-colors">
            Supprimer le compte
          </button>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build check final**

```bash
npm run build
```

Attendu : 0 erreur. Si des clés i18n manquent (avertissements console), elles peuvent être ajoutées dans `src/locales/fr.json` et `en.json` en post-déploiement (non bloquant pour W1).

- [ ] **Step 4: Commit final W1**

```bash
git add src/pages/Modules.tsx src/pages/Parametres.tsx
git commit -m "feat(w1): pages Modules + Paramètres"
git tag w1-complete
```

---

### Task 5: Vérification manuelle W1 complet

- [ ] Runner le SQL dans Supabase Dashboard (`docs/sql/2026-05-11-w1-whiteboard.sql`)
- [ ] `npm run dev` — ouvrir http://localhost:5173
- [ ] Vérifier : login → onboarding 4 étapes → dashboard whiteboard vide
- [ ] Glisser module "Solde" depuis toolbar → drop sur canvas → module affiché
- [ ] Drag module → reposistionner → resize → config ⚙ → supprimer ✕
- [ ] Créer 2e sheet → naviguer entre sheets
- [ ] Page /modules → catalogue affiché
- [ ] Page /paramètres → mock tier switcher fonctionne
- [ ] Commit de stabilisation si corrections mineures nécessaires

```bash
git add -A
git commit -m "fix(w1): corrections post-review"
```

---
