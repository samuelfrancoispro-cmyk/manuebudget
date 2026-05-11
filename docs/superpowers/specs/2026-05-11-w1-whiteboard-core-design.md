# W1 — Whiteboard Core Design

**Date :** 2026-05-11
**Statut :** Validé

---

## Vision

Fluxo = bac à sable financier libre. L'utilisateur construit son environnement en glissant des **modules** sur un **whiteboard** (canvas infini). Pas de pages fixes, pas de colonnes imposées. Chaque module est configurable, redimensionnable, repositionnable.

---

## Scope W1

| Inclus | Hors scope W1 |
|---|---|
| Whiteboard engine (zoom, pan, drag, resize, collision) | Landing refonte visuelle |
| Barre flottante draggable (catalogue, recherche, catégories) | Magnétisme toggle |
| 4 modules MVP fonctionnels | Compte famille |
| Multi-sheets (créer, renommer, supprimer) | GoCardless sync bancaire |
| Onboarding guidé (welcome, identité, tutorial, pricing) | Export données |
| Page Modules (catalogue statique) | B2B entreprise |
| Page Paramètres épurée | Layouts presets panel |
| Gating tier (sheets, modules) | Micro-animations page Modules |
| Cleanup codebase (workspace/, Aide.tsx) | — |
| Nouvelles tables Supabase | — |

---

## Routes

| Route | Composant | Note |
|---|---|---|
| `/` | `Landing.tsx` | Conservée |
| `/login` | `Login.tsx` | Conservée |
| `/auth/callback` | `AuthCallback.tsx` | Inchangée |
| `/onboarding` | `Onboarding.tsx` | Refonte 4 étapes |
| `/dashboard` | `Dashboard.tsx` | Shell whiteboard |
| `/modules` | `Modules.tsx` | Catalogue modules |
| `/parametres` | `Parametres.tsx` | Épurée |

---

## Arborescence src/

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── i18n.ts
├── vite-env.d.ts
├── pages/
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── AuthCallback.tsx
│   ├── Onboarding.tsx
│   ├── Dashboard.tsx
│   ├── Modules.tsx
│   └── Parametres.tsx
├── whiteboard/
│   ├── WhiteboardCanvas.tsx      ← engine zoom/pan
│   ├── WhiteboardModule.tsx      ← wrapper drag/resize par module
│   ├── SheetTabs.tsx             ← onglets sheets en haut
│   ├── DropZoneLayer.tsx         ← feedback vert/rouge au drop
│   └── collisionUtils.ts         ← AABB helpers
├── toolbar/
│   ├── FloatingToolbar.tsx       ← barre flottante draggable
│   ├── ModuleSearch.tsx          ← input + filtre
│   └── ModuleCategoryList.tsx    ← catégories collapsibles
├── modules/
│   ├── _base/
│   │   └── ModuleShell.tsx       ← shell commun (header, resize, config)
│   ├── solde/
│   │   ├── ModuleSolde.tsx
│   │   └── ModuleSoldeConfig.tsx
│   ├── depenses/
│   │   ├── ModuleDepenses.tsx
│   │   └── ModuleDepensesConfig.tsx
│   ├── recurrentes/
│   │   ├── ModuleRecurrentes.tsx
│   │   └── ModuleRecurrentesConfig.tsx
│   └── objectif-epargne/
│       ├── ModuleObjectif.tsx
│       └── ModuleObjectifConfig.tsx
├── components/
│   ├── brand/
│   ├── gate/
│   ├── ui/
│   └── Layout.tsx
├── store/
│   ├── useStore.ts
│   └── slices/
│       ├── profileSlice.ts
│       ├── metierSlice.ts
│       ├── whiteboardSlice.ts
│       └── modulesSlice.ts
├── hooks/
│   └── useEntitlement.ts
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── theme.ts
│   ├── pricing.ts
│   ├── stripe.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── locales/
    ├── fr.json
    └── en.json
```

**Supprimés :**
- `src/workspace/` (entier)
- `src/pages/Aide.tsx`

---

## Moteur Whiteboard

### Approche : sur mesure (pointer events + refs)

Zéro re-render React pendant toute interaction drag/resize/pan. Update DOM direct via refs, `setState` uniquement au release.

### Zoom / Pan

- Conteneur `overflow: hidden`, enfant "world" avec `transform: scale(zoom) translate(panX, panY)`
- `will-change: transform` sur le world div
- **Pan** : `pointerdown` → `pointermove` → delta → update via `ref`
- **Zoom** : `wheel` event → `zoom *= factor` centré sur position curseur, `ctrlKey` pour pinch trackpad
- Zoom clavier (`+`/`-`) : Framer Motion spring `{ stiffness: 300, damping: 30 }`
- Release → `setState` + save Supabase debounced 500ms

### Drag toolbar → drop canvas

1. dnd-kit `useDraggable` sur chaque module card dans la toolbar
2. `DragOverlay` = mini carte avec `drop-shadow(0 8px 32px rgba(0,0,0,0.25))`
3. Position drop → coordonnées world : `(pointerX - panX - canvasRect.left) / zoom`
4. Check collision AABB → `DropZoneLayer` vert/rouge
5. Drop confirm → `addWbModule()` → Framer Motion `{ scale: [0.85, 1], opacity: [0, 1] }`

### Repositionnement modules

- `pointerdown` header → `pointermove` → `style.transform` direct DOM (0 re-render)
- `pointerup` → `setState` + `flushLayoutUpdates()` → batch upsert Supabase

### Resize

- 8 poignées (coins + milieux des bords)
- Même pattern ref : update DOM direct → setState au release
- Min global : 200×150. Chaque module peut définir son propre `minW`/`minH`

### Collision AABB

```ts
function overlaps(a: Rect, b: Rect, gap = 8): boolean {
  return !(
    a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y
  );
}
```

- Drop : feedback vert (libre) / rouge (collision)
- Repositionnement live : outline rouge si collision, gap minimum 8px

---

## Barre Flottante

### Structure

- `position: fixed`, draggable Framer Motion `drag` + constraints
- Position persistée `localStorage` (`fluxo_toolbar_pos`)
- Snap aux bords si < 16px du bord écran
- Largeur 220px, hauteur auto avec scroll interne

### Sections

```
[🔍 Rechercher...] ← Ctrl+K focus global
─────────────────
▾ Aperçu      — Solde ✅, KPI, Net Worth
▾ Budget      — Dépenses ✅, Récurrentes ✅, Catégories
▾ Épargne     — Objectif ✅, Pots, Projets
▾ Investissement — PEA/CTO, Performance
▾ Fiscal      — TMI, IR, PER
▾ Collaboration  — Famille, Partage
─────────────────
[⚙]
```

- ✅ = MVP draggable
- Autres = badge "Bientôt", `pointer-events: none` au drag
- Modules tier restreint → drag OK → drop → HardGate modale

### Tooltip modules

- Hover → icône `?` fade-in 150ms
- Click → floating-ui tooltip : nom + description + tier requis

---

## Modules

### ModuleShell (commun)

```
┌─[≡]──[Titre éditable]────[⚙][✕]─┐
│         Contenu module             │
└─────────────────────────[↘]───────┘
```

- Header `cursor: grab` (drag handle ≡)
- Titre double-click éditable inline
- ⚙ ouvre config drawer (Framer Motion slide depuis bord droit du module)
- ✕ supprime le module du whiteboard
- Resize handle ↘ coin SE, 8 poignées complètes en `shift+hover`
- Shadow : `shadow-md` repos → `shadow-2xl` pendant drag
- `rounded-2xl`, `bg-surface` (dark/light)

### Module Solde

- **Données** : `comptesCourants` → `soldeCompteCourant()`
- **Config** : comptes à afficher, variation mensuelle on/off
- **Min size** : 240×160
- **Affiche** : nom compte, solde, variation mensuelle, CTA ajouter compte

### Module Dépenses du mois

- **Données** : `transactions` mois courant groupées par `categorieId`
- **Config** : mois (défaut courant), plafond budget optionnel, catégories visibles
- **Min size** : 280×200
- **Affiche** : total, barre progression budget, top catégories avec barres

### Module Récurrentes

- **Données** : `transactionsRecurrentes` + `expandRecurrentesPourMois()`
- **Config** : mois, afficher revenus récurrents, tri date/montant
- **Min size** : 260×180
- **Affiche** : total charges fixes, liste avec montant + date prélèvement

### Module Objectif Épargne

- **Données** : `objectifs` + `comptes` épargne liés
- **Config** : choisir objectif, afficher conseil mensuel
- **Min size** : 260×180
- **Affiche** : nom objectif, barre progression, montant restant, date cible, conseil mensuel

---

## Sheets

- Onglets `SheetTabs` en haut du whiteboard
- Bouton `+` → nouvelle sheet (nom auto "Sheet N")
- Double-click onglet → renommer inline
- Clic droit → menu : renommer / dupliquer / supprimer
- Drag onglets pour réordonner
- **Gating** : Free=1, Plus=5, Pro=∞

---

## Data Layer

### SQL (fichier à runner manuellement)

```sql
-- Supprimer tables obsolètes
DROP TABLE IF EXISTS dashboard_widgets;
DROP TABLE IF EXISTS dashboard_pages;
DROP TABLE IF EXISTS projets;
DROP TABLE IF EXISTS "achatsProjet";
DROP TABLE IF EXISTS rapports;
DROP TABLE IF EXISTS "rapportLignes";
DROP TABLE IF EXISTS "bankProfiles";
DROP TABLE IF EXISTS "virementsRecurrents";
DROP TABLE IF EXISTS actifs;

-- Modifier profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "firstName" text,
  ADD COLUMN IF NOT EXISTS "lastName"  text,
  ADD COLUMN IF NOT EXISTS country     text,
  ADD COLUMN IF NOT EXISTS "onboardingStep" integer DEFAULT 0;

-- Créer whiteboard_sheets
CREATE TABLE IF NOT EXISTS whiteboard_sheets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users NOT NULL,
  name       text NOT NULL DEFAULT 'Ma sheet',
  "order"    integer DEFAULT 0,
  zoom       float DEFAULT 1,
  pan_x      float DEFAULT 0,
  pan_y      float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Créer whiteboard_modules
CREATE TABLE IF NOT EXISTS whiteboard_modules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id   uuid REFERENCES whiteboard_sheets ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users NOT NULL,
  module_key text NOT NULL,
  x          float NOT NULL DEFAULT 0,
  y          float NOT NULL DEFAULT 0,
  w          float NOT NULL DEFAULT 320,
  h          float NOT NULL DEFAULT 240,
  config     jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whiteboard_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sheets" ON whiteboard_sheets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own modules" ON whiteboard_modules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wb_sheets_user ON whiteboard_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_modules_sheet ON whiteboard_modules(sheet_id);
CREATE INDEX IF NOT EXISTS idx_wb_modules_user ON whiteboard_modules(user_id);
```

**Conserver sans modification :** `user_modules`, `categories`, `transactions`, `transactionsRecurrentes`, `comptesCourants`, `comptes`, `mouvements`, `objectifs`

### Types TypeScript

```ts
export interface Sheet {
  id: string;
  name: string;
  order: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface WbModule {
  id: string;
  sheetId: string;
  moduleKey: ModuleKey;
  x: number;
  y: number;
  w: number;
  h: number;
  config: Record<string, unknown>;
}

export type Rect = { x: number; y: number; w: number; h: number };

export type ModuleKey =
  | 'solde' | 'depenses' | 'recurrentes' | 'objectif-epargne'
  | 'kpi-mensuel' | 'net-worth' | 'categories' | 'pots' | 'projets'
  | 'pea-cto' | 'performance' | 'tmi' | 'ir' | 'per' | 'famille' | 'partage';
```

### Zustand — whiteboardSlice

```ts
interface WhiteboardSlice {
  sheets: Sheet[];
  activeSheetId: string | null;
  wbModules: WbModule[];

  loadWhiteboard: (userId: string) => Promise<void>;
  createSheet: (name?: string) => Promise<Sheet>;
  deleteSheet: (id: string) => Promise<void>;
  renameSheet: (id: string, name: string) => Promise<void>;
  setActiveSheet: (id: string) => void;

  addWbModule: (sheetId: string, m: Omit<WbModule, 'id' | 'sheetId'>) => Promise<WbModule>;
  removeWbModule: (id: string) => Promise<void>;
  updateWbModuleLayout: (id: string, rect: Partial<Rect>) => void; // local only, 0 Supabase
  updateWbModuleConfig: (id: string, config: Record<string, unknown>) => Promise<void>;
  flushLayoutUpdates: () => Promise<void>; // batch upsert au pointerup
}
```

**Pattern persistence :**
- `pointermove` → `updateWbModuleLayout()` → setState uniquement
- `pointerup` → `flushLayoutUpdates()` → 1 requête batch Supabase
- Config → `updateWbModuleConfig()` → upsert immédiat (action rare)

---

## Gating Tier

### Feature keys

```ts
export type FeatureKey =
  | 'whiteboard_sheets'
  | 'whiteboard_modules'
  | 'active_modules'
  | 'layout_presets'
  | 'layout_save_custom'
  | 'famille'
  | 'sync_bancaire'
  | 'export'
  | 'support';
```

### Matrice

| Feature | Gratuit | Plus | Pro |
|---|---|---|---|
| `whiteboard_sheets` | 1 | 5 | ∞ |
| `whiteboard_modules` | 4 | 20 | ∞ |
| `active_modules` | 3 | 8 | ∞ |
| `layout_save_custom` | false | false | true |
| `sync_bancaire` | false | false | true |
| `support` | FAQ | Email 48h | Priorité 24h |

### HardGate

- Limite sheets → toast + modale upgrade
- Limite modules → drop rouge + modale upgrade
- Module Pro en tier free/plus → drag OK → drop → modale upgrade
- Bouton "Mettre à niveau" dashboard top-right (visible si tier = free)
- Mock `setTierDirect()` jusqu'au lancement Stripe réel

---

## Onboarding

### Flow (4 étapes)

```
Étape 0 — Welcome (animée Framer Motion)
Étape 1 — Identité : prénom, nom, pays (select ISO + flag)
Étape 2 — Tutorial interactif :
  2a : présentation sheet (observer ou "J'ai compris")
  2b : highlight barre flottante (clic requis)
  2c : drag module → drop (action réelle)
  2d : clic ⚙ pour configurer (action réelle)
  2e : créer une 2e sheet (action réelle ou Suivant)
Étape 3 — Pricing (3 tiers, toggle mensuel/annuel)
  → "Continuer gratuitement" ou choisir Plus/Pro (mock)
```

### Architecture scalable

```ts
interface OnboardingStep {
  id: string;
  component: React.FC<StepProps>;
  canSkip: boolean;
  requiresAction: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'welcome',  component: WelcomeStep,  canSkip: false, requiresAction: false },
  { id: 'identity', component: IdentityStep, canSkip: false, requiresAction: true  },
  { id: 'tutorial', component: TutorialStep, canSkip: true,  requiresAction: true  },
  { id: 'pricing',  component: PricingStep,  canSkip: true,  requiresAction: false },
];
```

`onboardingStep` dans `profiles` = index courant → reprise à la bonne étape si interruption.

---

## Page Modules

- Catalogue complet (toutes catégories)
- Card par module : icône, nom, description, tier requis, statut (MVP / disponible / bientôt)
- Recherche + filtre par catégorie
- Pas de toggle actif/inactif (le placement sur whiteboard = activation)

---

## Page Paramètres

```
Profil        — prénom, nom, pays          [Sauvegarder]
Préférences   — Langue (FR/EN), Devise
Abonnement    — Tier actuel + CTA upgrade
Mon compte    — Email (lecture seule), Supprimer compte (danger zone)
```

---

## Contraintes de fluidité (non négociables)

- Position/taille modules : update ref + CSS transform direct pendant interaction, **zéro re-render React**
- Save Supabase : debounced 500ms pour pan/zoom, batch au `pointerup` pour layout
- `will-change: transform` sur world div et modules en cours de drag
- Framer Motion pour toutes les animations (pas de CSS transition ad-hoc)
- Classes Tailwind statiques uniquement (pas de CSS-in-JS dynamique)
- framer-motion à installer (`npm install framer-motion`)
