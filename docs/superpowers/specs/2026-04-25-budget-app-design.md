# Budget app — Design spec

**Date** : 2026-04-25
**Statut** : draft, attend validation utilisateur
**Auteurs** : Samuel (porteur), Claude (assistant)

---

## 1. Contexte & motivation

Samuel développe une application web de gestion budgétaire **pour sa mère** (utilisatrice unique). Elle dispose aujourd'hui d'un fichier Excel `Budget prévisionnel.xls` (12 feuilles) qu'elle a construit elle-même. L'app a vocation à le remplacer en restant **fidèle à sa méthodologie** : postes budgétaires récurrents, suivi mensuel sur plusieurs comptes, simulations et projets.

L'Excel est une **source d'inspiration de méthode**, pas une source de données. L'application démarre vide. L'utilisatrice crée elle-même tous ses comptes, postes, catégories.

### Utilisatrice cible

- 1 seule personne (la mère de Samuel)
- Niveau technique présumé non-développeur
- Maîtrise parfaitement son Excel actuel → l'app doit être **au minimum aussi simple à utiliser**
- Souhaite accéder depuis PC et mobile

---

## 2. Concepts fondateurs

### 2.1 Tout est nommable, rien n'est imposé

Aucune entité n'est pré-créée. Pas de "PAIE", "EDF Corse", "Livret A" en dur. L'utilisatrice nomme et structure son monde via la page **Settings**.

Un "template" optionnel sera proposé en bouton (création automatique d'un jeu d'entités classiques renommables/supprimables) — mais l'app fonctionne entièrement sans.

### 2.2 Modèle de saisie : postes budgétaires récurrents

Pas de transactions datées (≠ application bancaire). Un mois = liste de **postes** avec un montant ajustable. Modèle inspiré directement de l'Excel.

Workflow type :
1. Utilisatrice crée ses postes types une fois ("PAIE", "EDF Corse", "Crédit Immo"…)
2. Chaque mois : duplique le mois précédent, ajuste les montants qui ont changé
3. Reste à vivre par compte calculé en temps réel

### 2.3 Trois espaces distincts

| Espace | Définition | Données isolées ? |
|---|---|---|
| **Budget réel** | Mois calendaires effectifs (1 par mois) | Source de vérité |
| **Scénarios** | Clones de mois pour répondre à "et si ?" | Oui, n'affectent jamais le réel |
| **Projets** | Entités avec leurs propres revenus/dépenses (location, travaux, études…) | Oui, peuvent optionnellement injecter dans le réel |

### 2.4 Épargne hybride

Chaque compte d'épargne peut être lié à des postes budgétaires (lien opt-in par poste). Solde mis à jour automatiquement quand lié, manuellement sinon. Flag `is_locked` distingue épargne disponible (Livret A, CEL…) d'épargne bloquée (PEE).

---

## 3. Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind |
| DB + Auth + Storage | Supabase (Postgres avec RLS, Auth magic link) |
| Client DB | `@supabase/supabase-js` |
| Mutations | Server Actions Next.js |
| Charts | Recharts (via shadcn-charts) |
| Validation | Zod (schemas partagés client/server) |
| Hébergement | Vercel (tier gratuit) |
| Langage | TypeScript strict |

### 3.1 Sécurité

- Auth Supabase magic link (pas de mot de passe à mémoriser)
- **RLS sur toutes les tables** : policy générique `profile_id = auth.uid()`
- Test automatisé obligatoire : un user ne voit jamais les rows d'un autre `profile_id`

### 3.2 Pas de

- ORM lourd (Prisma) — `@supabase/supabase-js` ou Drizzle si typage strict requis
- API REST custom — Server Actions + Supabase suffisent
- Tauri/Electron — accès multi-appareil prioritaire sur la confidentialité locale

---

## 4. Modèle de données

```
auth.users (Supabase Auth)
    │
    ▼
profiles (id PK = auth.users.id, display_name, currency='EUR', created_at)
    │
    ├──< current_accounts (id, profile_id, name, color, position)
    │       └──< monthly_entries.account_id
    │
    ├──< savings_accounts (id, profile_id, name, is_locked, color, position)
    │       ├──< savings_balances (account_id, month_id, balance)
    │       └──< savings_goal (1-1, target_date, target_amount, monthly_contribution)
    │
    ├──< budget_post_templates (id, profile_id, label, default_account_id,
    │                           default_kind ['credit'|'debit'], category_id,
    │                           end_date NULL, position)
    │       └──< monthly_entries.post_template_id
    │
    ├──< months (id, profile_id, year, month, kind ['real'|'scenario'],
    │           parent_month_id NULL, label, notes, locked_at NULL)
    │       └──< monthly_entries (id, month_id, post_template_id, account_id,
    │                              kind, amount, linked_savings_account_id NULL,
    │                              project_id NULL, position)
    │
    ├──< projects (id, profile_id, name,
    │              type ['location'|'travaux'|'etudes_enfants'|'achat'|'autre'],
    │              status ['active'|'archived'],
    │              start_date, end_date NULL, auto_inject_account_id NULL)
    │       └──< project_entries (id, project_id, label, kind, amount,
    │                              occurred_on, recurring_monthly bool)
    │
    └──< categories (id, profile_id, name, color)
```

### 4.1 Contraintes & invariants

- Un seul mois `kind='real'` par couple `(profile_id, year, month)` — contrainte UNIQUE
- `parent_month_id` autorisé uniquement si `kind='scenario'`
- `linked_savings_account_id` et `project_id` mutuellement exclusifs sur un même `monthly_entry`
- `budget_post_templates.end_date` permet d'alimenter les alertes "fin de crédit" du dashboard
- Cascade delete : suppression d'un `month` → ses `monthly_entries` ; suppression d'un `project` → ses `project_entries`
- Suppression d'un `current_account` ou `savings_account` : bloquée si rows liées. Mécanisme préféré = **archivage** (champ `archived_at` ou `status`) qui retire l'entité des dropdowns sans casser l'historique

### 4.2 Triggers & calculs

- **Mise à jour épargne** : insertion/maj d'un `monthly_entry` avec `linked_savings_account_id` non-null → upsert dans `savings_balances` pour le `(month_id, account_id)` correspondant. Implémentation initiale en Server Action ; passage en trigger DB seulement si besoin de cohérence stricte ou perfs.
- **Reste à vivre** : calculé à la volée côté client à partir des `monthly_entries` du mois (pas stocké).
- **Total épargne dispo** : `SUM(savings_balances.balance) WHERE NOT savings_accounts.is_locked` pour le mois courant.

---

## 5. UX par espace

### 5.1 Navigation globale

- **Sidebar gauche** persistante avec : Dashboard / Budget / Épargne / Projets / Scénarios / Settings
- **Header** : sélecteur de mois courant + avatar (logout)
- **Mobile** : sidebar repliable (Sheet shadcn)

### 5.2 Dashboard `/`

| Zone | Contenu |
|---|---|
| KPI haut | Reste à vivre par compte courant (mois en cours), rouge si négatif |
| Milieu gauche | Total épargne disponible + sparkline 6 mois |
| Milieu droite | Top 5 plus gros débits / Top 3 crédits du mois |
| Bas | Alertes : reste à vivre négatif, crédits avec `end_date` ≤ 6 mois, objectifs épargne en retard |
| Sticky | 4 boutons : Saisir ce mois / Dupliquer mois précédent / Voir épargne / Mes projets |

### 5.3 Budget réel `/budget` et `/budget/[month]`

**Liste `/budget`** : grille de cards par mois (verte si reste à vivre ≥ 0 partout, rouge sinon). Bouton "+ Nouveau mois".

**Détail `/budget/[month]`** : table editable inline.
- **Colonnes par compte courant** (Manue / Joint / Jerome — variable selon les comptes créés)
- **Lignes regroupées** : section Crédits puis section Débits
- **Footer** : Total crédit / Total débit / Reste à vivre / Dont épargne par compte
- Icône 🔗 sur les postes liés à un compte d'épargne
- Bouton "Dupliquer mois précédent" → pré-remplit tous les postes
- Bouton "Verrouiller ce mois" → set `locked_at` (lecture seule)

### 5.4 Épargne `/savings` et `/savings/[account]`

**Vue d'ensemble `/savings`** :
- 4 KPI : Total / Disponible / Bloqué / Δ ce mois
- Grille de cards (1 par compte) avec solde + variation du mois + flag 🔒 si bloqué

**Détail `/savings/[account]`** :
- Header : solde actuel, toggle bloqué/libre, couleur
- Évolution : line chart 12 derniers mois (extensible)
- Versement récurrent configurable
- Objectif optionnel (date + montant) avec progression %
- Historique des entries qui ont modifié le compte + bouton ajustement manuel

**Sous-onglet `/savings/projections`** :
- Hypothèses : versement mensuel (préchargé), taux annuel optionnel, horizon (5/10/20 ans)
- Calcul linéaire mensuel : `solde × (1 + taux/12)`
- Area chart empilé multi-comptes + courbe d'objectif en pointillé
- Cas spécial **études enfants** : projection dédiée si projet de type `etudes_enfants`

### 5.5 Projets `/projects` et `/projects/[id]`

**Liste** : cards (nom, type, statut, bénéfice net cumulé)

**Détail — 2 onglets** :
| Onglet | Contenu |
|---|---|
| Entrées/Sorties | Tableau `project_entries` : date, libellé, +/-, montant, récurrent (toggle) |
| Synthèse | Total revenus, total dépenses, bénéfice net, badge "Injecté dans [compte]" si `auto_inject_account_id` |

### 5.6 Scénarios `/scenarios` et `/scenarios/[id]`

- Liste : libellé du scénario + base (mois parent)
- Création : "+ Nouveau scénario" → choisir mois réel base → cloner
- Édition : même UI que Budget, badge violet `SCENARIO`
- Comparaison : panel droit "vs mois réel parent" avec deltas par poste + delta reste à vivre

### 5.7 Settings `/settings`

Onglets : Comptes courants / Comptes épargne / Postes types / Catégories / Profil.

CRUD basique, drag & drop pour la position.

Bouton **opt-in** "Charger un template" (jamais déclenché automatiquement) : crée 3 comptes courants génériques + 6 supports d'épargne classiques + 30 postes types fréquents (PAIE, CAF, EDF, Foncier, Crédit Immo, Mutuelle, etc.) — tous **renommables et supprimables**. L'app fonctionne entièrement sans ce bouton ; il existe uniquement pour accélérer le démarrage de l'utilisatrice si elle le souhaite.

---

## 6. Mécanismes clés

### 6.1 Espaces séparés via `months.kind`

- `kind='real'` filtré côté `/budget`
- `kind='scenario'` filtré côté `/scenarios`
- Aucun mélange dans aucun calcul agrégé (dashboard, projections)

### 6.2 Lien poste → compte épargne (Q6)

Dans le formulaire d'ajout de poste à un mois, un dropdown "Lier à un compte d'épargne (optionnel)" propose tous les `savings_accounts`. Si renseigné, la valeur absolue du montant est ajoutée/retranchée du solde du compte épargne pour ce mois.

### 6.3 Injection projet → budget réel

Toggle par projet. Si activé + `auto_inject_account_id` défini : un poste virtuel "Projet [nom] (net)" apparaît automatiquement dans chaque mois du `auto_inject_account_id` ciblé.

**Calcul du montant injecté pour un mois M** : somme des `project_entries` dont `occurred_on` tombe dans le mois M (revenus positifs - dépenses négatives). Les entries marquées `recurring_monthly=true` sont ajoutées à chaque mois ≥ leur `occurred_on`.

Le poste virtuel n'est pas éditable depuis le mois (il reflète l'état du projet) mais reste visible dans la table comme un poste normal avec icône 📂.

### 6.4 Lock de mois

Verrouillage pour préservation historique. Un mois locké est en lecture seule. Bouton "Déverrouiller" toujours disponible mais affiche un avertissement.

---

## 7. Découpage en jalons

**Note importante** : "v1" = scope complet J0→J7 (tout l'équilibré demandé en Q1). La stratégie ci-dessous concerne le **rythme de livraison interne**, pas le scope final.

Stratégie retenue : **A (MVP rapide)**. Première mise en main de l'utilisatrice dès J4 (elle peut alors abandonner son Excel pour le suivi mensuel + épargne). Jalons J5-J7 enrichissent ensuite sans casser l'existant.

| Jalon | Périmètre | Livrable utilisable ? |
|---|---|---|
| J0 — Setup | Init Next.js, Tailwind, shadcn, projet Supabase, schéma DB complet, RLS | Non |
| J1 — Settings | Auth + CRUD comptes courants/épargne/postes/catégories + bouton template | Configuration possible |
| J2 — Budget mensuel | Création/duplication mois, table inline, totaux, lock | **Remplace l'Excel mensuel** |
| J3 — Épargne | Vue + détail + lien auto poste→solde + graphique évolution | Remplace "Suivi épargne" |
| J4 — Dashboard | KPI, alertes basiques | **Livraison MVP** |
| J5 — Projets | CRUD projet, entries, injection optionnelle | Remplace "Suivi location corse" |
| J6 — Scénarios | Clone mois, édition isolée, comparaison delta | Remplace "si tps partiel", "Simulation Retraite" |
| J7 — Projections | Multi-comptes long terme, objectifs, projection études enfants | Feature avancée |

Estimation grossière : **~5 jours pour MVP**, ~3-4 jours additionnels pour J5-J7.

---

## 8. Hors scope v1

Pour cadrer et éviter la dérive :

- ❌ Import bancaire (CSV / OFX)
- ❌ Synchronisation bancaire automatique (PSD2)
- ❌ Multi-utilisateur / partage famille (le schéma DB le permettra plus tard sans migration majeure)
- ❌ Catégorisation automatique de dépenses
- ❌ Rapports PDF / exports Excel
- ❌ Notifications email/push
- ❌ Mode hors ligne / PWA
- ❌ Internationalisation (FR uniquement)
- ❌ Multi-devises (EUR uniquement)
- ❌ Calcul fiscal (déclaration revenus, plus-values)

Tout cela peut être ajouté en v2/v3 sans refonte majeure si besoin.

---

## 9. Risques & mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| RLS Supabase mal configurée → fuite de données | Moyenne | Test automatisé : 2 comptes test, jamais de cross-read |
| Saisie inline laggy sur mobile | Moyenne | Tester dès J2 sur mobile, fallback modal d'édition |
| Trigger DB épargne hybride complexe | Faible | Implémenter en Server Action d'abord, trigger uniquement si requis |
| Surcharge fonctionnelle | Élevée | Contrat strict : J5+ uniquement après validation J4 sur 1 mois réel |
| Utilisatrice non-tech bloquée par l'UI | Moyenne | Démo en live au moment de la livraison J4, parcours scripté de saisie d'un mois |

---

## 10. Décisions clés (récap des Q&A de cadrage)

| # | Question | Réponse | Impact |
|---|---|---|---|
| Q1 | Priorité v1 ? | 4 — Tout équilibré | App complète mais découpée en jalons |
| Q2 | Où ça tourne ? | C — Web cloud | Next.js + Supabase + Vercel |
| Q3 | Combien d'utilisateurs ? | A — Solo | RLS simple `profile_id = auth.uid()` |
| Q4 | Mode de saisie ? | A — Postes budgétaires récurrents | Pas de transactions datées |
| Q5 | Simulations & projets ? | B — 3 espaces séparés | `months.kind` + `projects` table |
| Q6 | Gestion épargne ? | C — Hybride flexible | `linked_savings_account_id` opt-in |
| Q7 | Projections + dashboard ? | OK proposition | Page projection + dashboard 4 zones |

---

## 11. Prochaines étapes

1. **Validation user du présent spec** ← étape actuelle
2. Plan d'implémentation détaillé (skill `writing-plans`) découpant J0-J7 en tâches atomiques
3. Setup du repo (init git, Next.js, Supabase) — début de J0
4. Exécution jalon par jalon avec validation de l'utilisatrice à chaque livrable utile
