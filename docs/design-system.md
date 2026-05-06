# Fluxo — Design System

> Spec source : `docs/superpowers/specs/2026-05-05-cycle-a-fondations-design.md`
> Direction : **Notion warm paper mono + accents sourds**

---

## Palette

### Mode clair

| Token Tailwind | CSS variable | Hex | Usage |
|---|---|---|---|
| `bg-paper` | `--paper` | `#FAFAF7` | Fond global, cartes par défaut |
| `bg-surface` | `--surface` | `#F1EFEA` | Surfaces secondaires (KPI, badges discrets) |
| `bg-surface-strong` | `--surface-strong` | `#D9D6CF` | Hover states, surfaces actives |
| `text-foreground` / `text-ink` | `--ink` | `#1A1A1A` | Texte primaire, boutons primaires |
| `text-ink-muted` / `text-muted-foreground` | `--ink-muted` | `#6B6760` | Texte secondaire, labels |
| `border-border` | `--border` | `rgba(26,26,26,.08)` | Bordures par défaut |
| `text-positive` / `bg-positive` | `--positive` | `#2F5D3D` | Revenus, succès, badges Pro |
| `text-negative` / `bg-negative` | `--negative` | `#7A2E2E` | Dépenses, erreurs |
| `bg-warning-bg text-warning` | `--warning-*` | `#F5EBD9` / `#6B4F1C` | Alertes, warnings |
| `bg-info-bg text-info` | `--info-*` | `#E8E8E0` / `#3A3A33` | Infos neutres |

### Mode sombre

Miroir sourd des tokens clairs (cf. `src/index.css` block `.dark`). Jamais de noir/blanc purs.

---

## Typographie

- **Famille :** Inter (variable, Google Fonts) + fallback `system-ui`. Chargée dans `index.html`.
- **Weights utilisés :** 400 (body), 500 (labels, boutons), 600 (titres, KPI), 700 (hero, marque).
- **Tabular-nums :** activé globalement via `font-feature-settings` dans `body`.

### Échelle

| Usage | Classes |
|---|---|
| Hero / brand | `text-4xl font-bold tracking-[-0.025em]` |
| Titre section | `text-2xl sm:text-3xl font-semibold tracking-[-0.025em]` (cf. `<SectionHeader>`) |
| Titre carte | `text-base font-semibold` |
| Body | `text-sm` ou `text-base text-foreground` |
| Body secondaire | `text-sm text-ink-muted` |
| Label uppercase | `text-[11px] font-medium uppercase tracking-[0.08em]` (cf. `<Eyebrow>`) |
| Valeur KPI | `text-2xl font-semibold tabular-nums` |
| Montant | `tabular-nums font-medium` |

---

## Règles d'utilisation des accents

- **Positif (`text-positive`)** : montants positifs (revenus, gains), badges de succès, badge Pro (fond ink), barres de progression d'objectif.
- **Négatif (`text-negative`)** : montants négatifs (dépenses), états d'erreur, suppressions.
- **Warning (`bg-warning-bg text-warning`)** : alertes budgétaires, sur-dépense, expiration consentement banking.
- **Info (`bg-info-bg text-info`)** : tooltips, callouts neutres, "le saviez-vous".

**Règle d'or :** jamais d'accent vif. Tons mats / terre uniquement. Si une couleur "pète", elle n'est pas dans la palette.

---

## Composants brand (`@/components/brand`)

| Composant | Rôle | Exemple d'usage |
|---|---|---|
| `<BrandLogo variant="full" />` | Slot logo (header) | `<BrandLogo size={32} />` |
| `<BrandLogo variant="mark" />` | Slot icône (favicon, sidebar collapsed) | `<BrandLogo variant="mark" size={24} />` |
| `<Eyebrow>` | Petit label uppercase | `<Eyebrow>Solde global</Eyebrow>` |
| `<SectionHeader>` | Tête de section landing/page | `<SectionHeader eyebrow="Tarifs" title="Choisis ton plan" description="..." align="center" />` |
| `<KPICard>` | KPI Dashboard | `<KPICard label="Revenus" value="+ 2 850 €" delta="+12% vs mois dernier" deltaTone="positive" />` |
| `<DataRow>` | Ligne tabulaire | `<DataRow label="Loyer" value="− 1 200,00 €" tone="negative" />` |
| `<EmptyState>` | État vide | `<EmptyState title="Aucune transaction" description="..." action={<Button>Ajouter</Button>} />` |
| `<PriceTag>` | Affichage prix tier | `<PriceTag amountEUR={2.99} cadence="monthly" />` |
| `<ProBadge tier="pro">` | Badge Plus / Pro | `<ProBadge tier="plus" />` |

Tous accessibles via : `import { KPICard, DataRow, ... } from "@/components/brand";`

---

## Composants UI shadcn ajustés

- **`<Card>`** : `rounded-2xl`, sans shadow.
- **`<Badge variant="pro">`** : nouvelle variante (fond ink, texte paper, uppercase).
- **`<Tabs>`** : underline minimaliste sous l'onglet actif (plus de fond gris).

Tous les autres composants `ui/*` héritent automatiquement de la nouvelle palette via les variables CSS shadcn (`--background`, `--card`, `--muted`, etc.).

---

## Logo

**Production :** par l'utilisateur. Direction = onde + F sur fond noir, palette N/B.

**Intégration :**
- `/public/logo.svg` — wordmark + icône horizontal (header)
- `/public/logo-mark.svg` — icône seule (favicon, sidebar collapsed, app icon mobile)
- `/public/icon-512.svg` — version PWA 512×512

Pour remplacer le placeholder : déposer les 3 fichiers SVG aux mêmes chemins. Aucun changement de code requis.

---

## Pricing

Source de vérité : `src/lib/pricing.ts`. Toujours consommer `tiers` et `features` depuis ce module — jamais de prix/feature en dur.

| Tier | Mensuel | Annuel |
|---|---|---|
| Gratuit | 0 € | — |
| Plus | 2,99 €/mois | 24 €/an (−33%) |
| Pro | 4,99 €/mois | 39 €/an (−35%) |

Trial : 14 jours sans CB.

---

## Mode sombre

- **Activation :** classe `.dark` sur `<html>`, gérée par `useTheme` (cf. `src/lib/theme.ts`).
- **Toggle :** déjà présent dans `Layout.tsx`, à conserver.
- **Boot script inline** dans `index.html` : applique la classe avant React pour éviter le flash.
- **Règle :** chaque composant DOIT être testé en clair ET sombre avant validation.

---

## Roadmap design system

- **Cycle A (complété)** : tokens + composants brand de base + slot logo + pricing.ts.
- **Cycle B** : refonte landing/login/onboarding/pages app en consommant le design system.
- **Cycle C** : variant guidelines pour formulaires, dialogs lourds (Stripe Checkout integration).
