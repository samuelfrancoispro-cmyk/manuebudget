# W1 — Whiteboard Core

**Date :** 2026-05-11
**Statut :** Validé — prêt pour implémentation
**Remplace :** Tous les cycles A, B, C1, D1, D2 précédents

---

## Vision

Fluxo = bac à sable financier libre. L'utilisateur construit son environnement en glissant des **modules** (briques fonctionnelles) sur un **whiteboard** (canvas infini). Pas de pages fixes, pas de colonnes imposées. Chaque module est configurable, redimensionnable, repositionnable. Les modules sont complémentaires et partagent les mêmes données Supabase en temps réel.

---

## Scope W1 (MVP)

| Inclus | Hors scope W1 |
|---|---|
| Whiteboard engine (zoom, pan, drag, resize, collision) | Landing refonte visuelle (W2) |
| Barre flottante déplaçable (catalogue, recherche, catégories) | Layouts presets panel |
| 4 modules MVP fonctionnels | Micro-animations page Mes Modules |
| Multi-sheets (créer, renommer, supprimer) | Magnétisme toggle |
| Onboarding guidé (pays, prénom, nom, tutorial, pricing) | Compte famille |
| Page Mes Modules (catalogue statique) | GoCardless sync bancaire |
| Page Paramètres épurée | Export données |
| Gating tier (sheets, modules, catalogue) | B2B entreprise |
| Cleanup total du codebase existant | — |
| Nouvelles tables Supabase | — |

---

## Architecture globale

### Routes

| Route | Composant | Note |
|---|---|---|
| `/` | `Landing.tsx` | Refonte visuelle W2 — shell conservé |
| `/login` | `Login.tsx` | Conservé, refonte visuelle W2 |
| `/auth/callback` | `AuthCallback.tsx` | Inchangé |
| `/onboarding` | `Onboarding.tsx` | Refonte totale |
| `/dashboard` | `Dashboard.tsx` | = Whiteboard shell |
| `/modules` | `Modules.tsx` | Catalogue modules refonte |
| `/parametres` | `Parametres.tsx` | Refonte épurée |

### Arborescence src/

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
│   ├── WhiteboardCanvas.tsx     ← engine zoom/pan
│   ├── WhiteboardModule.tsx     ← wrapper drag/resize par module
│   ├── SheetTabs.tsx            ← onglets sheets en haut
│   ├── DropZoneLayer.tsx        ← feedback vert/rouge au drop
│   └── collisionUtils.ts        ← AABB helpers
├── toolbar/
│   ├── FloatingToolbar.tsx      ← barre flottante déplaçable
│   ├── ModuleSearch.tsx         ← input + filtre
│   └── ModuleCategoryList.tsx   ← catégories collapsibles
├── modules/
│   ├── _base/
│   │   └── ModuleShell.tsx      ← shell commun (header, resize, config)
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
│   ├── brand/                   ← conservé (BrandLogo, tokens)
│   ├── gate/                    ← conservé (HardGate, UpgradeBadge)
│   ├── ui/                      ← shadcn components
│   └── Layout.tsx               ← shell minimaliste (pas de sidebar)
├── store/
│   ├── useStore.ts              ← compose les slices
│   └── slices/
│       ├── profileSlice.ts
│       ├── metierSlice.ts       ← comptes, transactions, récurrentes, objectifs, catégories
│       ├── whiteboardSlice.ts   ← sheets + wbModules
│       └── modulesSlice.ts      ← user_modules catalogue
├── hooks/
│   └── useEntitlement.ts        ← conservé
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── theme.ts
│   ├── pricing.ts               ← refonte feature keys
│   ├── stripe.ts                ← mock setTierDirect
│   └── utils.ts
├── types/
│   └── index.ts                 ← refonte types
└── locales/
    ├── fr.json
    └── en.json
```

---

## Moteur Whiteboard

### Zoom / Pan

- Conteneur `overflow: hidden`, enfant "world" avec `transform: scale(zoom) translate(panX, panY)`
- `will-change: transform` sur le world div
- **Pan** : `pointerdown` → `pointermove` → delta → update via `ref` (0 re-render React)
- **Zoom** : `wheel` event → `zoom *= factor` centré sur position curseur
- **Trackpad pinch** : `wheel` avec `ctrlKey`
- Zoom clavier (`+`/`-`) : Framer Motion `useMotionValue` + spring `{ stiffness: 300, damping: 30 }`
- Pan/zoom state : `useRef` pendant interaction → `useState` au release (1 setState, save Supabase debounced)

### Drag depuis barre → drop

1. `dnd-kit useDraggable` sur chaque module card dans la barre
2. `DragOverlay` = mini carte avec `drop-shadow(0 8px 32px rgba(0,0,0,0.25))`
3. Position drop → coordonnées world : `(pointerX - panX - canvasRect.left) / zoom`
4. Check collision AABB → `DropZoneLayer` vert/rouge
5. Drop confirm → `addWbModule()` → Framer Motion apparition `{ scale: [0.85, 1], opacity: [0, 1] }`

### Repositionnement modules

- `pointerdown` sur header → capture pointerId → `pointermove` → update `x/y` via `ref` + `style.transform` direct DOM
- **Zéro re-render React** pendant le déplacement
- `pointerup` → `setState` + `flushLayoutUpdates()` → batch upsert Supabase

### Resize

- 8 poignées (coins + milieux des bords)
- `pointerdown` sur poignée → `pointermove` → delta → recalc `w/h` (min 200×150, pas de max)
- Même pattern ref : update DOM direct → setState au release
- Contrainte : certains modules ont `minW`/`minH` spécifiques

### Collision AABB

```ts
function overlaps(a: Rect, b: Rect, gap = 8): boolean {
  return !(
    a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y
  );
}
```

- Au drop : test contre tous les wbModules → feedback couleur
- Au repositionnement live : outline rouge si collision
- Gap minimum 8px entre modules

### Magnétisme (W2)

Non implémenté en W1. Architecture préparée : `useMagnetism` hook stub exporté mais inactif.

---

## Barre flottante

### Structure

- `position: fixed`, draggable via Framer Motion `drag` + constraints
- Position persistée `localStorage` (clé `fluxo_toolbar_pos`)
- Snap aux bords écran si < 16px
- Largeur : 220px, hauteur : auto (scroll interne si dépasse viewport)

### Sections

```
[🔍 Rechercher...]
─────────────────
▾ Aperçu
  [Solde ✅] [KPI] [Net Worth]
▾ Budget
  [Dépenses ✅] [Récurrentes ✅] [Catégories]
▾ Épargne
  [Objectif ✅] [Pots] [Projets]
▾ Investissement
  [PEA/CTO] [Performance]
▾ Fiscal
  [TMI] [IR] [PER]
▾ Collaboration
  [Famille] [Partage]
─────────────────
[Layout]  [⚙]
```

- Modules MVP (✅) = draggables
- Modules futurs = badge "Bientôt", `pointer-events: none` au drag
- Modules tier restreint = badge tier, drag → drop = HardGate modale

### Tooltip "?"

- Hover → icône `?` fade-in 150ms (Framer Motion)
- Click → `floating-ui` tooltip : nom + description + tier requis
- Positionné intelligemment (jamais hors écran)

### Recherche

- Filtre live sur nom + description + catégorie
- `⌘K` / `Ctrl+K` focus depuis n'importe où
- Résultats flat si query active, catégories collapsées

---

## Modules

### ModuleShell (shell commun)

```
┌─[≡]──[Titre éditable]────────[⚙][✕]─┐
│                                        │
│         Contenu module                 │
│                                        │
└───────────────────────────────[↘]─────┘
```

- Header : `cursor: grab` (drag handle ≡), titre double-click éditable, ⚙ ouvre config drawer, ✕ supprime
- Config : `drawer` qui slide depuis le bord droit du module (Framer Motion `x: 0 → width`)
- Resize handle ↘ en coin SE, 8 poignées complètes en `shift+hover`
- Shadow : `shadow-md` repos → `shadow-2xl` pendant drag
- Border radius : `rounded-2xl`
- Background : `bg-surface` (s'adapte dark/light)

### Module Solde

**Données** : `comptesCourants` → `soldeCompteCourant()`
**Config** : comptes à afficher, afficher variation mensuelle
**Min size** : 240×160

```
Solde
Compte principal
2 847,50 €
+124 € ce mois ↑
[+ Ajouter un compte]
```

### Module Dépenses du mois

**Données** : `transactions` filtrées mois courant, groupées par `categorieId`
**Config** : mois (défaut courant), plafond budget optionnel, catégories visibles
**Min size** : 280×200

```
Dépenses du mois   Mai 2026 · 847 €
████████░░░░ 67% du budget
● Logement    400€ ██████
● Alimentation 200€ ████
● Transport   150€ ███
```

### Module Récurrentes

**Données** : `transactionsRecurrentes` + expand pour mois courant
**Config** : mois, afficher revenus récurrents, tri date/montant
**Min size** : 260×180

```
Charges fixes   Ce mois : 1 240 €
Loyer          800€   le 1er
Électricité    120€   le 5
Netflix         17€   le 12
··· +3 autres
```

### Module Objectif épargne

**Données** : `objectifs` + `comptes` (épargne lié)
**Config** : choisir objectif, afficher conseil mensuel
**Min size** : 260×180

```
Objectif épargne
Voyage Japon 🗾
████████████░░░░  1 800 / 2 500 €
Il manque 700 € · Août 2026
+ 200€/mois pour y arriver
```

### Complémentarité

Les 4 modules partagent `comptesCourants`, `transactions`, `transactionsRecurrentes`, `objectifs`, `comptes` — données en temps réel via le store Zustand commun.

---

## Sheets

- Onglets en haut du whiteboard (SheetTabs)
- Bouton `+` → créer nouvelle sheet (nom par défaut "Sheet 2", etc.)
- Double-click sur onglet → renommer inline
- Clic droit → menu contextuel : renommer / dupliquer / supprimer
- Drag onglets pour réordonner
- Gating : Free=1, Plus=5, Pro=∞

---

## Data Layer

### Tables Supabase — actions

**SUPPRIMER :**
```sql
DROP TABLE IF EXISTS dashboard_widgets;
DROP TABLE IF EXISTS dashboard_pages;
DROP TABLE IF EXISTS projets;
DROP TABLE IF EXISTS "achatsProjet";
DROP TABLE IF EXISTS rapports;
DROP TABLE IF EXISTS "rapportLignes";
DROP TABLE IF EXISTS "bankProfiles";
DROP TABLE IF EXISTS "virementsRecurrents";
DROP TABLE IF EXISTS actifs;
```

**MODIFIER `profiles` :**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "firstName" text,
  ADD COLUMN IF NOT EXISTS "lastName"  text,
  ADD COLUMN IF NOT EXISTS country     text;
```

**CRÉER :**
```sql
CREATE TABLE whiteboard_sheets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users NOT NULL,
  name       text NOT NULL DEFAULT 'Ma sheet',
  "order"    integer DEFAULT 0,
  zoom       float DEFAULT 1,
  pan_x      float DEFAULT 0,
  pan_y      float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE whiteboard_modules (
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

CREATE INDEX idx_wb_sheets_user ON whiteboard_sheets(user_id);
CREATE INDEX idx_wb_modules_sheet ON whiteboard_modules(sheet_id);
CREATE INDEX idx_wb_modules_user ON whiteboard_modules(user_id);
```

**CONSERVER sans modification :**
```
user_modules, categories, transactions, "transactionsRecurrentes",
"comptesCourants", comptes, mouvements, objectifs
```

### Types

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
  | 'solde'
  | 'depenses'
  | 'recurrentes'
  | 'objectif-epargne'
  | 'kpi-mensuel'
  | 'net-worth'
  | 'categories'
  | 'pots'
  | 'projets'
  | 'pea-cto'
  | 'performance'
  | 'tmi'
  | 'ir'
  | 'per'
  | 'famille'
  | 'partage';
```

### Store Zustand — slices

```ts
// useStore.ts compose :
interface State extends
  ProfileSlice,
  MetierSlice,
  WhiteboardSlice,
  ModulesSlice {}

// whiteboardSlice
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
  updateWbModuleLayout: (id: string, rect: Partial<Rect>) => void; // local only
  updateWbModuleConfig: (id: string, config: Record<string, unknown>) => Promise<void>;
  flushLayoutUpdates: () => Promise<void>; // batch upsert au pointerup
}
```

**Pattern persistence :**
- `pointermove` → `updateWbModuleLayout()` → setState uniquement (0 Supabase)
- `pointerup` → `flushLayoutUpdates()` → batch upsert (1 requête pour tous les modules bougés)
- Config module → `updateWbModuleConfig()` → upsert immédiat (action rare)

---

## Onboarding

### Flow

```
Étape 0 — Welcome (animée)
Étape 1 — Identité : prénom, nom, pays (select ISO + flag)
Étape 2 — Tutorial interactif (5 micro-étapes)
  2a : présentation sheet (observer ou J'ai compris)
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
  requiresAction: boolean; // true = doit faire l'action, false = bouton Suivant suffit
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'welcome',   component: WelcomeStep,   canSkip: false, requiresAction: false },
  { id: 'identity',  component: IdentityStep,  canSkip: false, requiresAction: true },
  { id: 'tutorial',  component: TutorialStep,  canSkip: true,  requiresAction: true },
  { id: 'pricing',   component: PricingStep,   canSkip: true,  requiresAction: false },
];
```

`onboardingStep` dans `profiles` = index courant → reprend à la bonne étape si interruption.

---

## Page Mes Modules

- Catalogue complet des modules (toutes catégories)
- Card par module : icône, nom, description, tier requis, statut (actif / disponible / bientôt)
- Animation 2-3s loop par module (Framer Motion, faux curseur, interaction simulée)
- Recherche + filtre par catégorie
- Pas de toggle actif/inactif ici (le placement sur whiteboard = activation de fait)

---

## Page Paramètres

```
Profil
  Prénom · Nom · Pays   [Sauvegarder]

Préférences
  Langue  [FR | EN]
  Devise  [EUR | USD | GBP ...]

Abonnement
  Tier actuel : Gratuit
  [Mettre à niveau →]

Mon compte
  Email (lecture seule)
  [Changer mot de passe]
  [Supprimer mon compte]  ← danger zone
```

---

## Gating tier

### Feature keys refondues

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

### Valeurs (fictives — à affiner après toutes features)

| Feature | Gratuit | Plus | Pro |
|---|---|---|---|
| `whiteboard_sheets` | 1 | 5 | ∞ |
| `whiteboard_modules` | 4 | 20 | ∞ |
| `active_modules` | 3 | 8 | ∞ |
| `layout_presets` | 2 | ∞ | ∞ |
| `layout_save_custom` | false | false | true |
| `sync_bancaire` | false | false | true |
| `support` | FAQ | Email 48h | Priorité 24h |

### Bouton "Mettre à niveau"

- Dashboard top-right, visible si tier = free
- Click → modale pricing (même composant qu'onboarding step 3)
- Mock `setTierDirect()` jusqu'au lancement Stripe réel

### HardGate au drop

- Limite sheets atteinte → toast + modale upgrade
- Limite modules whiteboard atteinte → drop rouge + modale upgrade
- Module Pro dans barre (tier free/plus) → drag OK + drop → modale upgrade

---

## Contraintes de fluidité (non négociables)

- Position/taille modules : update via `ref` + CSS `transform` direct pendant interaction, **zéro re-render React**
- Save Supabase : debounced 500ms pour pan/zoom, batch au `pointerup` pour layout
- `will-change: transform` sur world div et modules en cours de drag
- Framer Motion pour toutes les animations (pas de CSS `transition` ad-hoc)
- Pas de lib CSS-in-JS dynamique — classes Tailwind statiques uniquement

---

## Design visuel

Les skills `/huashu-design`, `/ui-ux-pro-max`, `/impeccable`, `leonxlnx/taste-skill` seront invoqués pendant l'implémentation. Des proposals visuels seront soumis en `localhost:5173` pour validation avant de fixer le rendu.

Direction : brand "Notion warm paper mono" existante (tokens design conservés), sobriété radicale, animations Framer Motion fluides, dark/light mode.

---

## Cleanup fichiers (avant implémentation)

### Specs supprimées

Tous les fichiers `docs/superpowers/specs/` antérieurs à ce document.

### Plans supprimés

Tous les fichiers `docs/superpowers/plans/` antérieurs à ce document.

### Pages supprimées

`Argent.tsx`, `Comptes.tsx`, `EpargneHub.tsx`, `Epargne.tsx`, `Rapports.tsx`,
`Recurrents.tsx`, `Simulateur.tsx`, `Transactions.tsx`, `Modules.tsx` (refaite)

### Composants/workspace supprimés

`src/workspace/` entier (D1/D2), `FloatingSidebar.tsx` (D2), `MobileDock.tsx` (D2),
`ImportMappingDialog.tsx`, `RapportAnalytique.tsx`, `VirementsRecurrentsTab.tsx`

---

## Self-review

- ✅ Aucun placeholder ou TBD
- ✅ Architecture cohérente avec les 6 sections de design validées
- ✅ Scope délimité (W1 vs W2/W3 clairement séparés)
- ✅ Pattern persistence whiteboard explicite (0 re-render pendant drag)
- ✅ Gating préparé pour Stripe réel (mock maintenu)
- ✅ Onboarding scalable (tableau d'étapes)
- ✅ SQL actions précises (DROP + ALTER + CREATE)
- ✅ Types complets
