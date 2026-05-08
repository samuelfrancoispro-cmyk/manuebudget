# Fluxo D2 — Navigation flottante + Registre modules

**Date :** 2026-05-08
**Statut :** Approuvé — prêt pour écriture du plan d'implémentation
**Précédent :** D1 ✅ (workspace pages + widgets drag & drop)

---

## 1. Scope

D2 remplace la sidebar fixe actuelle par une **sidebar pill flottante** (desktop) + **dock pill centré** (mobile), et introduit le **registre des modules** : 12 modules activables/désactivables par l'utilisateur, stockés dans Supabase avec RLS.

---

## 2. Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---|---|---|
| `src/workspace/ModuleRegistry.ts` | Créer | Catalogue statique des 12 modules |
| `src/store/modules.ts` | Créer | Slice zustand : loadModules, toggleModule, isModuleActive |
| `src/components/FloatingSidebar.tsx` | Créer | Sidebar pill flottante desktop |
| `src/components/MobileDock.tsx` | Créer | Dock pill centré en bas mobile |
| `src/pages/Modules.tsx` | Créer | Route `/modules` — activation/désactivation |
| `src/components/Layout.tsx` | Modifier | Remplacer sidebar fixe par FloatingSidebar + MobileDock |
| `src/App.tsx` | Modifier | Ajouter route `/modules` |
| `src/store/useStore.ts` | Modifier | Intégrer modules slice |
| `src/types/index.ts` | Modifier | Ajouter `ModuleKey`, `UserModule` |
| `docs/sql/2026-05-08-d2-user-modules.sql` | Créer | Table + RLS + index |

---

## 3. Sidebar flottante (FloatingSidebar)

### Apparence

- **Position** : `fixed`, `top: 16px`, `left: 16px`, `bottom: 16px`
- **Largeur** : ~152px (labels toujours visibles)
- **Forme** : `border-radius: 16px`, fond `#1c1b19` (dark), `box-shadow` élevée
- **Couleurs** : neutres pour l'instant — Claude Design repassera pour les couleurs par module

### Structure

```
[Logo Fluxo]
────────────
[icon] Accueil        ← actif = fond blanc transparent
[icon] Budget         ←
[icon] Forecast       ← modules défaut ON
[icon] Épargne        ←
[icon] Simulateur     ←
[icon] Rapports       ←
[icon] Investissements ← si module activé par l'utilisateur
────────────
[icon] Mes modules
[icon] Paramètres
```

### Comportement hover

Au survol d'un item (hors Accueil) :
- L'item reçoit un fond blanc transparent subtil
- Une icône `?` circulaire apparaît à droite du label (`opacity: 0` → `opacity: 1`)
- Clic sur `?` → shadcn `<Tooltip>` avec la `description` du module (micro-définition 1-2 phrases)
- L'icône `?` n'apparaît pas sur l'item actif (inutile en contexte)

### Modules futurs (route `null`)

Si un module est activé mais que sa route n'est pas encore implémentée (ex: Investissements en D5), le clic sur l'item nav déclenche un `toast.info("Disponible prochainement")` et ne navigue pas.

### Intégration Layout

`Layout.tsx` : la sidebar fixe collée au bord (`w-60 border-r`) est remplacée par `<FloatingSidebar />`. Le `<main>` passe de `flex-1` à `ml-[184px]` (152px sidebar + 16px gap + 16px padding) sur desktop.

---

## 4. Dock mobile (MobileDock)

- **Position** : `fixed`, `bottom: 16px`, `left: 50%`, `transform: translateX(-50%)`
- **Forme** : pill `border-radius: 24px`, fond dark, `box-shadow` élevée
- **Contenu** : icônes uniquement (pas de labels), max 5 modules actifs + bouton `···` si plus de 5
- **Bouton `···`** : ouvre un bottom sheet ou redirige vers `/modules`
- **Pas d'icône `?`** sur mobile — la page `/modules` joue ce rôle
- La top bar mobile actuelle (burger + logo) est **supprimée** — remplacée par le dock

---

## 5. Page `/modules`

### Route

`/modules` — nouvelle route dans `App.tsx`, entrée dédiée en bas de la sidebar ("Mes modules", icône puzzle).
Accessible aussi depuis `Paramètres` (lien "Gérer mes modules").

### Layout

Grille 3 colonnes (desktop), 2 colonnes (tablette), 1 colonne (mobile).

Deux sections :

**"Modules inclus"** (défaut ON) : Budget, Forecast, Épargne, Simulateur, Rapports

**"Modules optionnels"** : Investissements, Patrimoine, Dettes, Fiscalité, Duo, Freelance, Multi-devise

### Carte module

Chaque carte contient :

1. **Mini-widget preview** (72px de hauteur) : aperçu du widget principal du module
   - Budget → barres dépenses par catégorie
   - Forecast → courbe SVG projetée
   - Épargne → donut objectif + progression
   - Simulateur → courbes comparaison scénarios
   - Rapports → barres comparaison mensuelle
   - Investissements → barres montantes (performance)
   - Patrimoine → donut répartition net worth
   - Dettes → barres progression remboursement
   - Fiscalité → lignes TMI / IR estimé
   - Duo → icône duo + solde partagé
   - Freelance → courbe CA irrégulier
   - Multi-devise → icônes devises + taux

2. **Titre** du module
3. **Micro-description** (~2 lignes) : ce que fait le module, en langage utilisateur
4. **Toggle ON/OFF** (shadcn `<Switch>`)
   - Module défaut ON → toggle actif
   - Module optionnel non activé → toggle inactif, carte légèrement atténuée (`opacity: 0.75`)
5. **Badge tier** si le module est restreint (`Plus` ou `Pro`)

### Gating

Si l'utilisateur tente d'activer un module au-delà de sa limite de tier, le toggle est bloqué et un `<HardGate>` existant s'affiche (composant déjà implémenté en C1).

Limite par tier :
- Free : 1 module optionnel max
- Plus : 4 modules optionnels max
- Pro : tous les modules

---

## 6. ModuleRegistry.ts

Catalogue **statique** (pas de fetch Supabase). Chaque module est défini une seule fois.

```ts
export type ModuleKey =
  | 'budget' | 'forecast' | 'epargne' | 'simulateur' | 'rapports'
  | 'investissements' | 'patrimoine' | 'dettes' | 'fiscalite'
  | 'duo' | 'freelance' | 'multidevise'

export interface ModuleDefinition {
  key: ModuleKey
  name: string
  icon: LucideIcon
  description: string        // micro-définition pour tooltip "?"
  defaultActive: boolean     // true = ON au 1er login
  requiredTier: TierId       // tier minimum pour activer
  route: string | null       // null = "disponible prochainement"
  navEntry: boolean          // false = absent de la sidebar (ex: module sous-jacent)
  previewWidget: React.FC    // composant mini-preview pour la page /modules
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: 'budget',
    name: 'Budget',
    icon: Wallet,
    description: 'Suis tes dépenses par catégorie, gère tes comptes courants et tes récurrentes mois par mois.',
    defaultActive: true,
    requiredTier: 'free',
    route: '/argent',
    navEntry: true,
    previewWidget: BudgetPreview,
  },
  // ... (forecast, epargne, simulateur, rapports défaut ON)
  // ... (investissements, patrimoine, dettes, fiscalite, duo, freelance, multidevise)
]
```

---

## 7. Store modules (src/store/modules.ts)

Slice Zustand intégré dans `useStore`.

```ts
interface ModulesSlice {
  modules: Record<ModuleKey, boolean>       // key → active
  modulesLoaded: boolean
  loadModules: (userId: string) => Promise<void>
  toggleModule: (key: ModuleKey) => Promise<void>
  isModuleActive: (key: ModuleKey) => boolean
  seedDefaultModules: (userId: string) => Promise<void>
}
```

### Comportement

**`loadModules(userId)`**
1. Fetch `user_modules` depuis Supabase pour cet userId
2. Si aucune ligne → appeler `seedDefaultModules()` (1er login)
3. Merge avec `MODULE_REGISTRY.defaultActive` pour les modules manquants
4. Stocker dans `modules: Record<ModuleKey, boolean>`

**`seedDefaultModules(userId)`**
Insert en batch les modules `defaultActive: true` avec `active: true`, les autres avec `active: false`.

**`toggleModule(key)`**
1. Optimistic update local immédiat
2. Upsert Supabase (`user_modules` PK composite `user_id + module_key`)
3. Rollback si erreur

**`isModuleActive(key)`**
Selector synchrone : `modules[key] ?? MODULE_REGISTRY.find(m => m.key === key)?.defaultActive ?? false`

### Intégration useStore

`loadAll(userId)` existant appelle `loadModules(userId)` après les autres slices.
`clearLocal()` existant reset `modules: {}` + `modulesLoaded: false`.

---

## 8. SQL — user_modules

```sql
-- docs/sql/2026-05-08-d2-user-modules.sql
CREATE TABLE IF NOT EXISTS user_modules (
  user_id     uuid REFERENCES auth.users NOT NULL,
  module_key  text NOT NULL,
  active      boolean DEFAULT false,
  activated_at timestamptz,
  PRIMARY KEY (user_id, module_key)
);

ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own modules"
  ON user_modules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON user_modules(user_id);
```

**Action manuelle :** Exécuter dans Supabase Dashboard > SQL Editor avant de tester.

---

## 9. Types (src/types/index.ts)

```ts
export type ModuleKey = /* union des 12 clés */

export interface UserModule {
  userId: string
  moduleKey: ModuleKey
  active: boolean
  activatedAt: string | null
}
```

---

## 10. Routing (App.tsx)

Ajout de la route `/modules` dans le bloc `<Route element={<Layout />}>`.

```tsx
<Route path="/modules" element={<Modules />} />
```

Les routes des modules non encore développés (ex: `/investissements`) ne sont **pas** ajoutées dans `App.tsx`. Le toast "Disponible prochainement" est déclenché depuis `FloatingSidebar` via `onClick` conditionnel (si `route === null`).

---

## 11. Contraintes et conventions

- **Supabase camelCase entre guillemets** : non applicable ici — `module_key`, `activated_at` = snake_case car colonnes nouvelles en anglais (cohérent avec `dashboard_pages`)
- **RLS** : systématique, `auth.uid() = user_id`
- **Store** : pas de persist middleware — modules rechargés via `loadAll` au login
- **Couleurs** : neutres (`#1c1b19` dark) — couleurs signature par module déléguées à Claude Design (D-design)
- **Animations** : non incluses en D2 — déléguées à Claude Design
- **i18n** : labels modules dans `locales/fr.json` + `locales/en.json`

---

## 12. Actions manuelles

1. Exécuter `docs/sql/2026-05-08-d2-user-modules.sql` dans Supabase Dashboard > SQL Editor
