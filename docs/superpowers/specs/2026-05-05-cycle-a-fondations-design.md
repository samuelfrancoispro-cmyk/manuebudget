# Cycle A — Fondations design Fluxo

**Date :** 2026-05-05
**Statut :** spec validée, plan d'implémentation à produire
**Cycle :** A (sur 3 — A: fondations | B: refonte UI | C: monétisation)
**Prérequis :** aucun
**Bloque :** Cycle B (refonte UI complète)

---

## 1. Contexte & objectif

Refonte complète de Fluxo en SaaS B2C grand public. Le Cycle A pose les **fondations design + pricing** sans toucher aux pages app. Sans ces fondations, refondre l'UI = jeter du code.

**Livrables Cycle A :**
- Brand visuel formalisé (palette, typo, slot logo)
- Design tokens (CSS variables + Tailwind config)
- Composants réutilisables nouveaux ou ajustés
- Matrice tiers + prix figée pour landing/onboarding/gating
- Doc design system

**Hors-scope Cycle A :** refonte des pages (Landing, Login, Onboarding, Dashboard, Argent, Épargne, Rapports, Paramètres, Aide), Stripe billing, GoCardless sync, feature gating runtime. Tout cela = Cycles B et C.

**USP rappelée :** sobriété radicale. Toute décision design tranche en faveur du minimalisme, jamais de l'ornement.

---

## 2. Brand visuel — direction "Notion warm paper mono"

### 2.1 Palette (mode clair)

| Token | Hex | Usage |
|---|---|---|
| `paper` | `#FAFAF7` | Fond global, off-white papier |
| `surface` | `#F1EFEA` | Cartes, KPI, surfaces secondaires |
| `surface-strong` | `#D9D6CF` | Hover states, surfaces actives |
| `ink` | `#1A1A1A` | Texte primaire, boutons primaires |
| `ink-muted` | `#6B6760` | Texte secondaire, labels, métadonnées |
| `border` | `rgba(26,26,26,.08)` | Bordures cartes, séparateurs |
| `border-strong` | `rgba(26,26,26,.14)` | Bordures contrastées (focus) |
| `positive` | `#2F5D3D` | Revenus, succès, badges Pro |
| `negative` | `#7A2E2E` | Dépenses, erreurs |
| `warning-bg` | `#F5EBD9` | Fond alertes/warnings |
| `warning-text` | `#6B4F1C` | Texte alertes/warnings |
| `info-bg` | `#E8E8E0` | Fond infos neutres |
| `info-text` | `#3A3A33` | Texte infos neutres |

### 2.2 Palette (mode sombre — miroir sourd)

| Token | Hex | Usage |
|---|---|---|
| `paper` | `#0F0E0C` | Fond global, noir doux warm |
| `surface` | `#1A1916` | Cartes |
| `surface-strong` | `#262420` | Hover states |
| `ink` | `#EDEAE3` | Texte primaire |
| `ink-muted` | `#9A9388` | Texte secondaire |
| `border` | `rgba(237,234,227,.08)` | Bordures |
| `border-strong` | `rgba(237,234,227,.14)` | Bordures contrastées |
| `positive` | `#7AA98A` | Revenus (plus clair pour contraste) |
| `negative` | `#C57D7D` | Dépenses (plus clair) |
| `warning-bg` | `#3A2E1A` | Fond alertes |
| `warning-text` | `#E5C589` | Texte alertes |
| `info-bg` | `#222018` | Fond infos |
| `info-text` | `#C5C0B5` | Texte infos |

**Règle dark mode :** mêmes accents, plus clairs/désaturés pour préserver le contraste. Jamais de noir pur (`#000`) ni de blanc pur (`#FFF`).

### 2.3 Typographie

- **Famille :** Inter (Google Fonts, variable). Fallback : `system-ui, -apple-system, sans-serif`.
- **Weights utilisés :** 400 (body), 500 (labels, boutons), 600 (titres, valeurs KPI), 700 (titres hero, marque).
- **Tabular-nums :** activé sur tous les montants (`font-variant-numeric: tabular-nums`).
- **Letter-spacing :** `-0.025em` pour titres ≥ 24px, `-0.015em` pour 16–24px, défaut sinon.
- **Line-height :** 1.5 (body), 1.2 (titres), 1 (chiffres KPI).

### 2.4 Logo (slot)

- **Production du logo :** par l'utilisateur. Direction = onde + F sur fond noir, palette N/B.
- **Implémentation côté code :** slot SVG agnostique. Le code consomme :
  - `/logo.svg` — wordmark + icône horizontal (header)
  - `/logo-mark.svg` — icône seule (favicon, app icon)
  - `/icon-512.svg` — version PWA
  - `/favicon.svg` (déjà existant)
- **Composant React :** `<BrandLogo variant="full" | "mark" />` — pas de couleur hardcodée, hérite via `currentColor`.
- **En attendant le logo final :** placeholder texte `"Fluxo"` en Inter 700 + un placeholder SVG `mark` neutre (rond noir avec F blanc) pour favicon/PWA.

---

## 3. Design tokens — implémentation

### 3.1 `src/index.css` — variables CSS HSL

Toutes les couleurs déclarées en HSL (compat Tailwind shadcn). Format :
```css
:root {
  --paper: 47 27% 98%;
  --surface: 40 18% 93%;
  --ink: 0 0% 10%;
  --positive: 138 32% 27%;
  --negative: 0 45% 33%;
  /* ... */
}
.dark {
  --paper: 30 12% 6%;
  --surface: 36 9% 9%;
  /* ... miroir dark */
}
```

### 3.2 `tailwind.config.js` — mapping

```js
colors: {
  paper: 'hsl(var(--paper))',
  surface: { DEFAULT: 'hsl(var(--surface))', strong: 'hsl(var(--surface-strong))' },
  ink: { DEFAULT: 'hsl(var(--ink))', muted: 'hsl(var(--ink-muted))' },
  positive: 'hsl(var(--positive))',
  negative: 'hsl(var(--negative))',
  warning: { DEFAULT: 'hsl(var(--warning-text))', bg: 'hsl(var(--warning-bg))' },
  info: { DEFAULT: 'hsl(var(--info-text))', bg: 'hsl(var(--info-bg))' },
}
```

**Anciens tokens shadcn (`background`, `foreground`, `muted`, `primary`, `card`, etc.) :** mappés vers les nouveaux pour rétro-compat des composants shadcn existants. Migration progressive lors du Cycle B.

### 3.3 Spacing & radii

Pas de changement par rapport au défaut Tailwind. Standardiser :
- Radius cartes : `rounded-2xl` (1rem)
- Radius KPI : `rounded-xl` (0.75rem)
- Radius boutons : `rounded-lg` (0.5rem)
- Radius badges : `rounded-md` (0.375rem)
- Padding cartes : `p-5` ou `p-6`

---

## 4. Composants à créer / ajuster

### 4.1 Composants shadcn existants à réharmoniser (`src/components/ui/`)

| Composant | Action |
|---|---|
| `button.tsx` | Variants `default` (ink), `secondary` (surface), `ghost`, `outline`, `destructive` (negative). Pas de gradient. |
| `card.tsx` | Bg `paper`, border `border`, padding interne unifié. |
| `input.tsx` | Border `border`, focus `border-strong` + ring très subtil ink/10%. |
| `badge.tsx` | Variants : `default`, `pro` (bg ink, text paper), `positive`, `negative`, `warning`. |
| `tabs.tsx` | Underline minimaliste, pas de bg actif (juste indicateur). |
| `select.tsx` | Aligné avec input, dropdown surface. |
| `progress.tsx` | Track `border`, fill `ink` (ou `positive` selon contexte). |
| `dialog.tsx` | Bg `paper`, overlay `ink/40`, border subtle. |

### 4.2 Nouveaux composants (`src/components/brand/`)

| Composant | Rôle |
|---|---|
| `BrandLogo.tsx` | Slot SVG `full | mark`, hérite couleur. |
| `KPICard.tsx` | Carte KPI standardisée : label uppercase + valeur tabular + delta optionnel. |
| `DataRow.tsx` | Ligne tabulaire : libellé gauche / valeur droite, border-bottom subtle. |
| `EmptyState.tsx` | État vide : icône optionnelle + titre + description + CTA. |
| `PriceTag.tsx` | Affichage prix : montant gros + `/mois` petit + badge "annuel −X%" optionnel. |
| `ProBadge.tsx` | Badge "PRO" sobre (bg ink, text paper, rounded-md, uppercase, letter-spacing). |
| `SectionHeader.tsx` | En-tête de section : eyebrow uppercase + titre + description. |
| `Eyebrow.tsx` | Petit label uppercase letter-spaced (réutilisé partout). |

### 4.3 Composants existants à garder tels quels

`PageHeader.tsx`, `Layout.tsx`, `RapportAnalytique.tsx`, `ImportMappingDialog.tsx` — ne touchent pas au design system, seront re-stylés dans Cycle B.

---

## 5. Pricing & tiers — figés

### 5.1 Tiers

| Tier | Prix mensuel | Prix annuel | Économie annuel |
|---|---|---|---|
| Gratuit | 0 € | — | — |
| Plus | 2,99 €/mois | 24 €/an (= 2 €/mois) | −33 % |
| Pro | 4,99 €/mois | 39 €/an (≈ 3,25 €/mois) | −35 % |

**Trial :** 14 jours sans CB sur Plus & Pro.
**Devise initiale :** EUR. GBP à activer plus tard (Stripe multi-currency).
**TVA :** Stripe Tax automatique (EU + UK).

### 5.2 Matrice features (figée pour Cycle A)

| Feature | Free | Plus | Pro |
|---|---|---|---|
| **Limites** | | | |
| Comptes courants | 1 | 5 | Illimité |
| Comptes épargne | 1 | 5 | Illimité |
| Transactions / mois | 50 | Illimité | Illimité |
| Charges récurrentes | 5 | Illimité | Illimité |
| Objectifs épargne | 1 | 5 | Illimité |
| Projets simulateur | 1 | 5 | Illimité |
| Catégories personnalisées | — | ✓ | ✓ |
| **Restrictions usage** | | | |
| Appareils simultanés | 1 | Illimité | Illimité |
| Installation app PWA | — | ✓ | ✓ |
| Mode sombre | ✓ | ✓ | ✓ |
| **Rapports & analyse** | | | |
| Import CSV bancaire | — | 5 / mois | Illimité |
| Analyse rapports (5 onglets) | — | ✓ | ✓ |
| Export Excel multi-feuilles | — | ✓ | ✓ |
| Export JSON sauvegarde | ✓ | ✓ | ✓ |
| **Banking & sync** | | | |
| Sync auto GoCardless | — | — | ✓ |
| Catégorisation auto tx | — | — | ✓ |
| **Support** | | | |
| Niveau support | FAQ | Email 48h | Email prioritaire 24h |
| Trial 14 j sans CB | — | ✓ | ✓ |

### 5.3 Logique upsell (à inscrire dans la copy landing/onboarding)

- **Free → Plus** : friction quotidienne (1 device, pas d'install PWA, limites 5 récurrentes / 50 tx).
- **Plus → Pro** : sync bancaire auto GoCardless = killer feature.

### 5.4 Application en code

- **Cycle A** : créer un fichier `src/lib/pricing.ts` qui exporte la structure typée (`Tier`, `FeatureKey`, `tiers: Tier[]`, `featureMatrix`) — pas de gating runtime à ce stade, juste source de vérité.
- **Cycle B** : la landing + onboarding consomment `tiers` pour le tableau comparatif.
- **Cycle C** : `useEntitlement(featureKey)` + edge function = enforcement.

---

## 6. Dark mode

- **Activé** dès le début (déjà persisté via `useTheme` dans le code actuel).
- **Tokens dark** définis section 2.2.
- **Règle :** chaque composant DOIT être testé en clair ET sombre avant validation.
- **Toggle :** déjà présent dans `Layout.tsx`, à conserver.
- **Boot inline script** dans `index.html` (déjà existant) : applique la classe `.dark` avant React pour éviter flash.

---

## 7. Doc design system

Créer `docs/design-system.md` avec :
- Palette complète (clair + sombre) en table
- Échantillons typographie (titres, body, labels, KPI)
- Règles d'utilisation des accents (quand utiliser positive/negative/warning)
- Catalogue des composants nouveaux (KPICard, DataRow, etc.) avec exemple de code
- Règle dark mode
- Slot logo : comment intégrer `/logo.svg` final
- Liens vers `src/lib/pricing.ts` et matrice features

---

## 8. Critères de complétion (Cycle A)

- [ ] `src/index.css` : variables CSS clair + sombre updates avec nouveaux tokens
- [ ] `tailwind.config.js` : mapping nouveaux tokens, anciens shadcn tokens encore valides (rétro-compat)
- [ ] `src/components/ui/*` : composants shadcn ajustés à la nouvelle palette (button, card, input, badge, tabs, select, progress, dialog)
- [ ] `src/components/brand/*` : 8 nouveaux composants créés (BrandLogo, KPICard, DataRow, EmptyState, PriceTag, ProBadge, SectionHeader, Eyebrow)
- [ ] `src/lib/pricing.ts` : structure typée tiers + matrice features
- [ ] Placeholder `/logo.svg` + `/logo-mark.svg` (rond noir + F blanc) en attendant le vrai logo
- [ ] `docs/design-system.md` : doc complète
- [ ] Vérification visuelle : la page Dashboard actuelle s'affiche en mode clair + sombre sans casser
- [ ] Aucune régression fonctionnelle (l'app continue de marcher exactement comme avant)
- [ ] Mémoires Claude mises à jour : `project_brand.md`, `project_pricing.md`, MEMORY.md, CURRENT.md

---

## 9. Risques & garde-fous

- **Risque :** casser visuellement l'app actuelle pendant la migration tokens.
  **Mitigation :** rétro-compat shadcn tokens, migration sur une branche séparée, tests visuels manuels page par page avant merge.

- **Risque :** logo placeholder qui finit en production parce que jamais remplacé.
  **Mitigation :** noter dans `CURRENT.md` que le logo réel est attendu, marquer le placeholder visuellement (ex : commentaire SVG).

- **Risque :** design system pas réutilisé par la suite (Cycle B reconstruit du custom).
  **Mitigation :** Cycle B doit obligatoirement passer par les composants brand/. Code review systématique.

---

## 10. Suite immédiate (après Cycle A)

→ **Cycle B** : refonte UI complète des pages (Landing pro + tableau comparatif consommant `pricing.ts`, Login + Google OAuth, Onboarding redesign + paywall, refonte des 6 pages app avec les nouveaux composants brand).

→ **Cycle C** : Stripe billing + feature gating runtime + PWA polish + SEO avancé.
