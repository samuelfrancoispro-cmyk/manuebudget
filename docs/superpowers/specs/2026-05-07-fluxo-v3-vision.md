# Fluxo v3 — Vision & Spec Stratégique

**Date :** 2026-05-07
**Statut :** Approuvé — prêt pour décomposition en plans d'implémentation
**Sessions :** Brainstorm multi-session (2026-05-07)
**Précédent :** Cycles A ✅ B ✅ C1 ✅ (brand, UI, billing mock)

---

## 1. Vision fondatrice

**Fluxo = un bac à sable financier sobre, alimenté par IA.**

Chaque utilisateur configure son propre outil. Les features sont là toutes, mais seules celles qu'il active sont visibles. L'agent IA guide, suggère, tutorialise — sans jamais parler pour rien dire.

### Les 4 piliers

| Pilier | Description |
|---|---|
| **Modulaire** | Chaque feature est un module activable/désactivable. Si tu ne gères pas d'investissements, ce module est invisible. |
| **Personnalisable** | Dashboard drag & drop, multi-pages nommables, densité d'information configurable. |
| **Guidé par IA** | Agent de navigation contextuel. Tutoriels step-by-step, alertes prédictives, insights actionnables. Silence par défaut. |
| **Pré-mâché** | Fluxo fait le travail technique. L'utilisateur reçoit des décisions, pas des données brutes. |

### Ce que Fluxo n'est PAS

- Pas un chatbot financier (l'IA ne répond pas à des questions libres)
- Pas un conseiller réglementé (disclaimer systématique sur fiscal + investissements)
- Pas une néobanque (lecture seule, pas de virement réel)
- Pas une app de tracking passif (chaque donnée mène à une action suggérée)

---

## 2. Navigation

### Concept retenu : Sidebar flottante → Dock en bas

- **Desktop :** sidebar flottante détachée du bord (gap + shadow, pas collée à l'écran), icônes + labels courts
- **Mobile / sidebar réduite :** dock pill-shape flottant centré en bas de l'écran
- La transition entre les deux modes est fluide (breakpoint ou toggle utilisateur)
- La sidebar/dock liste uniquement les modules actifs — si un module est désactivé, son entrée disparaît du nav

### Entrées de navigation (modules actifs uniquement)

```
[Logo Fluxo]
─────────────
🏠 Accueil (dashboard pages)
💰 Budget
📈 Forecast
🎯 Épargne
🏦 Investissements    ← si activé
🏛️ Patrimoine         ← si activé
💳 Dettes             ← si activé
🔬 Simulateur
📊 Rapports
🧾 Fiscalité          ← si activé
─────────────
🧩 Mes modules
⚙️ Paramètres
```

---

## 3. Workspace : Pages & Sheets

### Concept

Chaque utilisateur dispose d'un workspace composé de **pages** (= sheets). Chaque page est une grille de widgets drag & drop indépendante.

### Règles

- Page **"Accueil"** : créée par défaut, non supprimable, non renommable
- L'utilisateur peut créer N pages supplémentaires (nom libre : "Investissements", "Projet Maison", "Retraite"…)
- Chaque page a son propre layout (positions + tailles des widgets)
- Les widgets sont des **vues** sur les mêmes données — pas de duplication de données
- Navigation entre pages : onglets horizontaux au-dessus de la grille
- Ordre des onglets drag & drop

### Widgets

- Chaque module expose ses widgets disponibles
- Un widget peut être placé sur plusieurs pages simultanément (ex : "Solde" affiché sur "Accueil" ET "Investissements")
- Grille CSS flexible : colonnes 1-4, lignes dynamiques
- Taille par widget : petit (1×1), moyen (2×1), large (2×2), pleine largeur (4×1)
- Handle de déplacement + bouton de suppression au survol

### Modèle de données

```ts
interface DashboardPage {
  id: string;
  userId: string;
  name: string;
  order: number;
  isDefault: boolean; // true = "Accueil", non supprimable
}

interface DashboardWidget {
  id: string;
  pageId: string;
  widgetType: WidgetType; // enum de tous les widgets disponibles
  col: number;  // 1-4
  row: number;
  colSpan: number; // 1-4
  rowSpan: number; // 1-2
  config?: Record<string, unknown>; // config spécifique au widget
}
```

---

## 4. Modules — Catalogue complet

### 4.0 Registre des modules

Chaque module a un `moduleKey` unique. L'activation/désactivation est stockée dans `user_modules`.

```ts
interface UserModule {
  userId: string;
  moduleKey: ModuleKey;
  active: boolean;
  activatedAt: string | null;
}

type ModuleKey =
  | 'budget'        // défaut ON
  | 'forecast'      // défaut ON
  | 'epargne'       // défaut ON
  | 'investissements'
  | 'patrimoine'
  | 'dettes'
  | 'simulateur'    // défaut ON
  | 'rapports'      // défaut ON
  | 'fiscalite'
  | 'duo'
  | 'freelance'
  | 'multidevise';
```

---

### 4.1 Module Budget quotidien _(défaut ON)_

**Périmètre :** Tout ce qui concerne l'argent du quotidien.

#### Features

**4.1.1 Multi-comptes courants** _(existant)_
- Types : perso, joint, pro
- Sélecteur global "tous comptes" ou par compte
- Solde calculé : `soldeInitial + Σ transactions + Σ récurrentes passées`

**4.1.2 Transactions** _(existant, amélioration)_
- Saisie manuelle : date, montant, catégorie, compte, note
- Catégorisation manuelle + apprentissage via corrections
- Amélioration v3 : détection automatique du marchand (GoCardless) → suggestion de catégorie

**4.1.3 Récurrentes mensuelles** _(existant)_
- Revenus + dépenses fixes, expand à la volée (jamais matérialisées en DB)
- Fréquences : mensuelle (v3 : ajouter hebdomadaire, trimestrielle, annuelle)
- Champ `jourDuMois` : clamped au dernier jour si mois court

**4.1.4 Date de paie custom** _(nouveau)_
- L'utilisateur configure son jour de paie (ex : 27)
- Tous les KPIs, budgets et récapitulatifs sont calculés du `jourDePaie` au `jourDePaie - 1` du mois suivant
- Stocké dans `profiles.payDay: number (1-31)`
- Si non configuré : mois calendaire classique (1 → dernier jour)
- L'agent IA propose cette configuration au 1er login : "Quel jour êtes-vous payé ?"

**4.1.5 Fenêtre de dépense confortable** _(nouveau)_
- Formule :
  ```
  fenêtre = soldeActuel
            - Σ récurrentes_à_venir_ce_mois
            - Σ virements_épargne_programmés_ce_mois
            - seuil_confort (configurable, défaut 200€)
  ```
- Affichée en widget dashboard (valeur + signal couleur : vert/orange/rouge)
- Recalculée en temps réel à chaque nouvelle transaction

**4.1.6 Détecteur d'abonnements oubliés** _(nouveau)_
- Analyse les récurrentes dont le `categorieId` correspond aux abonnements
- Croise avec les transactions : si aucune transaction associée au service depuis N semaines → alerte
- L'agent affiche : "Netflix 13,99€ — aucune utilisation détectée depuis 6 semaines. Toujours utile ?"
- Délai configurable (défaut : 6 semaines)

**4.1.7 Règles automatiques** _(nouveau)_
- Builder visuel : `SI [condition] → ALORS [action]`
- Conditions disponibles : dépense > X€, catégorie = Y, solde < Z, jour du mois = N
- Actions disponibles : créer un virement vers objectif, envoyer une alerte, marquer une transaction
- 4 templates prêts à l'emploi : "Arrondi épargne", "Alerte week-end", "Provision loyer", "Cap catégorie"
- Limite : 10 règles actives par utilisateur (Free : 2, Plus : 10, Pro : illimité)

**4.1.8 Détecteur frais bancaires cachés** _(nouveau)_
- Identifie dans les transactions les libellés contenant : "cotisation", "commission", "frais de tenue", "assurance carte", "agios"
- Regroupe et affiche le total annuel estimé
- Widget dashboard : "Frais bancaires détectés : 87€/an"

**4.1.9 Calendrier de paiements** _(nouveau)_
- Vue calendrier mensuelle : chaque récurrente placée à sa date de débit
- Code couleur : dépenses (rouge), revenus (vert), virements (bleu)
- Clic sur une entrée → détail de la récurrente
- Disponible en widget dashboard (vue compacte) ou page dédiée

---

### 4.2 Module Prévision & Forecast _(défaut ON)_

**Périmètre :** Anticiper avant que ça arrive.

**4.2.1 Forecast 30-90j** _(nouveau)_
- Courbe interactive : solde projeté jour par jour
- Algorithme :
  ```
  solde_J = solde_aujourd'hui
            + Σ récurrentes planifiées entre aujourd'hui et J
            + Σ patterns moyens par type de jour (si ≥ 60j d'historique)
  ```
- Zones visuelles : vert (> seuil confort), orange (proche), rouge (< 0)
- Horizon configurable : 30j / 60j / 90j
- Affichage du prochain "point critique" : "Solde prévu bas dans 12 jours"

**4.2.2 Alertes prédictives configurables** _(nouveau)_
- Seuil configurable par l'utilisateur (défaut : 200€)
- Types d'alertes :
  - Solde prévu < seuil dans X jours
  - Récurrente importante dans X jours (loyer, assurance)
  - Dépassement budget catégorie projeté
- Fréquence : 1 alerte par type max par semaine (pas de spam)
- Toutes désactivables indépendamment

**4.2.3 Reconnaissance de patterns** _(nouveau)_
- Nécessite ≥ 60 jours de transactions
- Détecte : habitudes par jour de semaine, saisonnalité mensuelle, pics catégories
- Intégré dans le forecast comme couche "comportementale"
- L'agent prévient si historique insuffisant : "Forecast simplifié — reviens dans X jours"

**4.2.4 Snapshot hebdomadaire in-app** _(nouveau)_
- Chaque lundi (ou jour configurable) : notification in-app sobre
- Contenu : 3 chiffres clés de la semaine + 1 insight actionnable
- Exemple : "Tu as dépensé 43€ de plus que ta moyenne hebdo en restaurants. Objectif semaine : -20€."
- Désactivable, ne génère jamais d'email

---

### 4.3 Module Épargne & Objectifs _(défaut ON)_

**4.3.1 Comptes épargne + virements auto** _(existant)_
- Taux d'intérêt, solde, mouvements manuels
- Virements récurrents automatiques depuis compte courant

**4.3.2 Objectifs avec jalons** _(existant, refonte)_
- Ajout v3 : jalons intermédiaires (ex : 25%, 50%, 75%)
- Calcul automatique : "À ce rythme, atteint dans N mois"
- Possibilité de lier un objectif à un compte épargne spécifique ou un pot virtuel

**4.3.3 Sous-comptes virtuels (Pots)** _(nouveau)_
- Diviser un compte épargne en enveloppes virtuelles nommées
- Ex : sur Livret A 5000€ → Pot "Vacances" 1500€ / Pot "Urgences" 2000€ / Pot "Disponible" 1500€
- Le total des pots est indicatif (enveloppes mentales) — si le solde réel change (intérêts, virement), l'agent signale l'écart mais ne bloque pas
- Chaque pot peut avoir un objectif cible

```ts
interface VirtualPot {
  id: string;
  compteId: string; // FK CompteEpargne
  name: string;
  amount: number;   // alloué à ce pot
  targetAmount?: number;
  objectifId?: string;
}
```

**4.3.4 Défis d'épargne gamifiés** _(nouveau)_
- Bibliothèque de défis : "No Spend Week", "Économise 100€ en 30j", "52-week challenge", "Café Month"
- L'utilisateur active un défi → Fluxo track la progression automatiquement
- Streak affiché, badge obtenu à la complétion
- 1 défi actif max par défaut (configurable en Pro)

---

### 4.4 Module Investissements _(optionnel)_

**Activer ce module :** onboarding en 3 étapes guidé par l'agent IA.

**4.4.1 Comptes d'investissement**
- Types : PEA, CTO, Assurance-vie (fonds €), Assurance-vie (UC), SCPI, PER
- Saisie manuelle : nom, type, établissement, date d'ouverture
- Plafond PEA : alerte si > 150 000€ versés

**4.4.2 Positions**
- Par compte : ISIN ou nom libre, quantité, prix de revient (PRU), valeur actuelle (saisie manuelle ou estimée)
- Calcul : plus-value latente = (valeur actuelle − PRU) × quantité
- Pas de prix temps réel en v1 (saisie manuelle, mise à jour mensuelle suffisante)
- V2 : intégration API de cotations gratuites (Yahoo Finance / Alpha Vantage)

**4.4.3 Performance globale**
- Rendement total : `(valeur_actuelle − total_versé) / total_versé × 100`
- Répartition par type d'actif (donut chart)
- Évolution de la valeur totale dans le temps (courbe)

**4.4.4 Allocation cible vs réelle**
- L'utilisateur définit son allocation souhaitée (ex : 60% ETF / 30% immo / 10% crypto)
- Fluxo affiche l'écart : "Ton PEA est surpondéré en actions FR de 12%"
- Widget dashboard : barre allocation actuelle vs cible

---

### 4.5 Module Patrimoine & Net Worth _(optionnel)_

**4.5.1 Net Worth en temps réel**
- Calcul automatique :
  ```
  net_worth = Σ comptes_courants
            + Σ comptes_épargne
            + Σ valeur_investissements
            + Σ valeur_immobilier
            − Σ capital_restant_dû_crédits
  ```
- Widget dashboard : valeur + évolution mensuelle (€ et %)
- Historique mensuel stocké pour courbe d'évolution

**4.5.2 Actif immobilier**
- Saisie manuelle : adresse (optionnelle), valeur estimée, part possédée (%, pour indivision/SCI)
- Non lié à un crédit automatiquement (liaison manuelle optionnelle)

**4.5.3 Timeline de vie financière**
- Frise interactive horizontale, horizon 1-30 ans configurable
- Événements ajoutables : achat immo, fin de crédit, retraite, objectif épargne atteint
- Les événements du simulateur (projets) et des crédits (fin de remboursement) alimentent automatiquement la timeline
- Affichage : date + label + montant associé
- Interaction : clic sur événement → détail + lien vers le module concerné

**4.5.4 Score de santé financière**
- Note 0-100 calculée sur 5 dimensions :
  | Dimension | Poids | Calcul |
  |---|---|---|
  | Taux d'épargne | 25% | épargne_mois / revenus_mois |
  | Couverture urgences | 25% | épargne_liquide / dépenses_mensuelles_moyennes (cible : 3 mois) |
  | Progression dettes | 20% | capital_remboursé / capital_initial |
  | Diversification | 15% | nombre de types d'actifs dans investissements |
  | Régularité épargne | 15% | mois consécutifs avec épargne positive |
- Affiché en score + mention (Fragile / En construction / Solide / Excellent)
- Historique mensuel pour voir la progression
- Si < 2 modules actifs : "Score partiel — activez plus de modules pour affiner"

---

### 4.6 Module Dettes & Emprunts _(optionnel)_

**4.6.1 Crédit immobilier avec amortissement**
- Données saisies : capital emprunté, taux (fixe/variable), durée, date de début, mensualité assurance
- Calculs automatiques : tableau d'amortissement complet, capital restant dû à date, intérêts payés à date, coût total du crédit
- Intégré dans Net Worth (passif)

**4.6.2 Crédits conso & découvert**
- Multi-crédits possibles
- Priorisation : méthode avalanche (taux le plus élevé d'abord) ou boule de neige (plus petit capital d'abord)
- Fluxo affiche la méthode optimale selon le profil et calcule l'économie d'intérêts

**4.6.3 Plan de désendettement gamifié**
- Parcours visuel : barre de progression "sortie du rouge"
- Jalons : chaque crédit remboursé = badge + message de félicitations
- Calcul : "En maintenant X€/mois supplémentaires, tu seras libre de dettes dans N mois et tu économiseras Y€ d'intérêts"
- Intégration avec les règles automatiques : "Allouer 50€ de plus au crédit ce mois-ci"

---

### 4.7 Module Simulateur & Projections _(défaut ON, refonte)_

**4.7.1 Simulateur projet par achats datés** _(existant, refonte visuelle)_
- Conservé et amélioré : timeline d'achats + courbe épargne simulée
- Intégration : les projets apparaissent sur la Timeline de vie financière (module 4.5.3)

**4.7.2 Simulateur prêt immobilier** _(nouveau)_
- Inputs : prix du bien, apport, taux, durée, frais de notaire (calculés automatiquement ~7-8% dans l'ancien)
- Outputs : mensualité, coût total, taux d'endettement, apport minimum recommandé
- Comparateur 2-3 scénarios côte à côte (ex : 20 ans vs 25 ans, taux 3% vs 3,5%)

**4.7.3 Simulateur retraite simplifié** _(nouveau)_
- Inputs : âge actuel, âge de départ souhaité, revenus actuels, épargne retraite actuelle
- Outputs : capital cible estimé, effort mensuel nécessaire, écart avec l'objectif
- Pas un outil actuariel — une estimation motivante avec disclaimer

**4.7.4 Comparateur de scénarios** _(nouveau)_
- Question : "Que se passe-t-il si j'épargne X€ vs Y€/mois ?"
- Graphique côte à côte sur horizon configurable (5/10/20 ans)
- Utilisable pour projets, retraite, remboursement anticipé de crédit

---

### 4.8 Module Rapports & Analytics _(défaut ON, refonte)_

**4.8.1 Export Excel multi-feuilles** _(existant)_
**4.8.2 Export JSON sauvegarde** _(existant)_
**4.8.3 Export PDF rapport mensuel** _(nouveau)_
- Bilan du mois : revenus, dépenses, épargne, solde final, top catégories

**4.8.4 Comparaison temporelle** _(nouveau)_
- Ce mois vs mois dernier vs même mois N-1
- Deltas par catégorie (€ et %)
- Graphique évolution sur 6 / 12 mois

**4.8.5 Rapport mensuel auto-généré** _(nouveau)_
- Généré automatiquement le 1er du nouveau mois financier
- Contenu : taux d'épargne réel, top 3 catégories de dépenses, δ vs mois précédent, 1 recommandation IA
- Consultable dans "Rapports" ou exportable PDF

---

### 4.9 Module Fiscalité _(optionnel)_

**Disclaimer systématique :** Fluxo fournit des estimations indicatives. Pour toute décision fiscale, consulter un expert-comptable ou un conseiller fiscal agréé.

**4.9.1 Estimation Impôt sur le revenu**
- L'utilisateur saisit sa situation : nombre de parts fiscales, autres revenus hors Fluxo
- Fluxo utilise les revenus trackés dans le module Budget pour estimer le revenu imposable
- Calcul du barème IR progressif (mis à jour chaque année fiscale)
- Affichage : IR estimé, TMI, taux moyen d'imposition

**4.9.2 Tranche Marginale d'Imposition (TMI)**
- Calculée automatiquement depuis l'estimation IR
- Widget dashboard : "TMI actuelle : 30%"
- Utilisée par les autres modules pour contextualiser (ex : "Un PEA serait plus avantageux qu'un CTO à ta TMI")

**4.9.3 Suivi plus-values PEA/CTO**
- Calculé depuis le module Investissements (positions + PRU)
- Plus-values latentes : non imposables tant que non réalisées
- Plus-values réalisées : saisie manuelle des cessions + date
- Calcul PFU (30%) ou option barème (recommandation selon TMI)
- PEA : exonération après 5 ans (date de création PEA trackée)

**4.9.4 Plafond épargne retraite (PER)**
- Calcul automatique du plafond PER disponible : 10% des revenus N-1, dans les limites légales
- Alerte si plafond non utilisé avant le 31/12
- Simulation : "Verser X€ sur ton PER réduirait ton IR estimé de Y€"

**4.9.5 Alertes plafonds réglementaires**
- Livret A : 22 950€ (alerte à 90% et 100%)
- LDDS : 12 000€
- LEP : 10 000€ (+ vérification éligibilité revenus)
- PEA : 150 000€ versements
- Mise à jour annuelle des plafonds dans le code

**4.9.6 Crédits d'impôt estimés**
- Garde d'enfants : 50% des dépenses dans la limite légale
- Dons associations : 66% ou 75% selon type
- Travaux : selon dispositif (MaPrimeRénov', crédit impôt…)
- Saisie manuelle des dépenses concernées, calcul automatique du crédit estimé

**4.9.7 Synthèse annuelle déclaration**
- Récap des éléments clés pour la déclaration : revenus salariaux trackés, crédits d'impôt estimés, plus-values réalisées
- Format : liste imprimable / exportable PDF
- Pas un formulaire 2042 — une aide-mémoire structurée

---

### 4.10 Modules avancés optionnels

**4.10.1 Budget Duo / Famille**
- Deux comptes Fluxo liés par invitation
- Dépenses communes : catégorie taggable "commun", répartition configurable (50/50 ou %)
- Vue partagée des dépenses communes uniquement
- Finances privées restent strictement privées (RLS)
- Solde commun calculé séparément des soldes individuels

**4.10.2 Mode Freelance**
- Profil revenus irréguliers : pas de salaire fixe, CA variable
- Provision TVA automatique : pourcentage configurable (20% par défaut) mis de côté automatiquement à chaque encaissement
- Provision charges URSSAF estimées (22,2% micro-entreprise par défaut)
- "Mois vide" : forecast adapté, pas d'alerte de solde bas sur les mois sans CA
- Tableau de bord CA annuel vs objectif

**4.10.3 Multi-devise**
- Comptes en EUR, GBP, USD (extensible)
- Taux de conversion : manuel (l'utilisateur saisit) ou automatique (API gratuite)
- Tous les totaux / net worth affichés dans la devise principale choisie

---

## 5. Agent IA — Comportement & Règles

### Principe fondamental

L'agent ne parle que quand c'est utile. Silence = état normal. Il intervient via 4 modes distincts :

### Mode 1 — Tutoriels step-by-step

Déclenché par : activation d'un nouveau module ou demande explicite ("Aide").

Format :
```
[Agent IA]
Étape 1/4 : Ajoute ton premier compte d'investissement.
→ [Champ : Nom] [Sélecteur : Type] [Bouton : Ajouter]
                                          [Suivant →]
```

Règles :
- Chaque module a son propre tutoriel (séquence de 3-5 étapes max)
- Chaque étape a un bouton "Suivant" ET "Passer cette étape"
- La progression est sauvegardée (reprise possible)
- Tutoriel rejouable depuis "Aide" à tout moment

### Mode 2 — Suggestions contextuelles

Déclenché par : état de l'app (module non configuré, données manquantes, opportunité).

Format : bandeau discret 1 ligne en haut du module concerné.
```
💡 Tu n'as pas encore configuré ta date de paie. Ça prend 10 secondes. [Configurer] [Plus tard]
```

Règles :
- 1 suggestion visible à la fois, par module
- "Plus tard" = ne réapparaît pas pendant 7 jours
- "Ne plus afficher" = permanent
- Maximum 2 suggestions par session

### Mode 3 — Alertes prédictives

Déclenché par : le forecast ou les seuils configurés.

Format : notification in-app (badge + bannière discrète).
```
⚠️ Dans 8 jours, ton solde sera estimé à 156€ — en dessous de ton seuil confort.
[Voir le forecast] [Ignorer]
```

Règles :
- Toujours basées sur des calculs réels (pas de messages génériques)
- Maximum 1 alerte par type par semaine
- Toutes désactivables individuellement dans les paramètres

### Mode 4 — Insights actionnables

Déclenché par : fin de semaine, fin de mois, événement remarquable.

Format : carte dans le dashboard ou dans "Rapports".
```
✦ Ce mois-ci, tes dépenses restaurants ont augmenté de 68€ vs la moyenne.
   Réduire de 30€/mois te permettrait d'atteindre ton objectif vacances 3 semaines plus tôt.
   [Créer une règle automatique] [OK]
```

Règles :
- 1 insight par semaine max
- Toujours avec une action concrète proposée (1 bouton)
- Jamais de jugement moral ("tu dépenses trop") — uniquement des constats et projections

### Détection de profil à l'onboarding

À l'onboarding, l'agent pose 3 questions max pour recommander les premiers modules :
1. "Tu es salarié(e), freelance, ou les deux ?" → module Freelance si pertinent
2. "Tu vis seul(e) ou en couple / colocation ?" → module Duo si pertinent
3. "Tu as des crédits en cours (immo, conso) ?" → module Dettes si pertinent

Les modules recommandés sont pré-cochés, l'utilisateur peut tout désactiver.

---

## 6. Modèle de données — Évolutions nécessaires

### Nouvelles tables

```sql
-- Modules actifs par user
CREATE TABLE user_modules (
  user_id uuid REFERENCES auth.users,
  module_key text NOT NULL,
  active boolean DEFAULT false,
  activated_at timestamptz,
  PRIMARY KEY (user_id, module_key)
);

-- Pages du dashboard
CREATE TABLE dashboard_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  "order" integer DEFAULT 0,
  is_default boolean DEFAULT false
);

-- Widgets par page
CREATE TABLE dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES dashboard_pages,
  user_id uuid REFERENCES auth.users,
  widget_type text NOT NULL,
  col integer DEFAULT 1,
  row integer DEFAULT 1,
  col_span integer DEFAULT 1,
  row_span integer DEFAULT 1,
  config jsonb
);

-- Comptes d'investissement
CREATE TABLE investment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  type text NOT NULL, -- 'pea' | 'cto' | 'av_fonds_euro' | 'av_uc' | 'scpi' | 'per'
  institution text,
  opened_at date,
  total_invested numeric DEFAULT 0
);

-- Positions dans un compte d'investissement
CREATE TABLE investment_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES investment_accounts,
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  isin text,
  quantity numeric,
  purchase_price numeric, -- PRU
  current_price numeric,
  updated_at timestamptz DEFAULT now()
);

-- Crédits / dettes
CREATE TABLE debt_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  type text NOT NULL, -- 'immo' | 'conso' | 'decouvert' | 'autre'
  initial_capital numeric,
  interest_rate numeric,  -- taux annuel %
  duration_months integer,
  started_at date,
  monthly_payment numeric,
  insurance_monthly numeric DEFAULT 0
);

-- Actifs immobiliers
CREATE TABLE real_estate_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  name text,
  estimated_value numeric,
  ownership_pct numeric DEFAULT 100, -- % possédé
  linked_debt_id uuid REFERENCES debt_accounts
);

-- Sous-comptes virtuels (Pots)
CREATE TABLE virtual_pots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compte_id uuid, -- FK CompteEpargne
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  amount numeric DEFAULT 0,
  target_amount numeric,
  objectif_id uuid
);

-- Règles automatiques
CREATE TABLE automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  active boolean DEFAULT true,
  trigger_type text NOT NULL,  -- 'spending_over' | 'balance_under' | 'day_of_month' | 'category_match'
  trigger_config jsonb,
  action_type text NOT NULL,  -- 'transfer_to_goal' | 'create_alert' | 'tag_transaction'
  action_config jsonb
);

-- Défis épargne
CREATE TABLE savings_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  challenge_type text NOT NULL, -- 'no_spend_week' | 'save_100' | '52_week' | 'custom'
  started_at date,
  target_amount numeric,
  current_amount numeric DEFAULT 0,
  completed boolean DEFAULT false,
  streak_days integer DEFAULT 0
);

-- Événements timeline de vie
CREATE TABLE life_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  event_date date,
  amount numeric,
  type text, -- 'achat_immo' | 'retraite' | 'fin_credit' | 'objectif' | 'custom'
  linked_entity_id uuid, -- optionnel : lien vers simulateur/crédit/objectif
  linked_entity_type text
);

-- Données fiscales
CREATE TABLE fiscal_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  fiscal_year integer,
  nb_parts numeric DEFAULT 1,
  other_income numeric DEFAULT 0, -- revenus hors Fluxo
  childcare_expenses numeric DEFAULT 0,
  donation_expenses numeric DEFAULT 0,
  renovation_expenses numeric DEFAULT 0
);

-- Cessions réalisées (pour fiscalité plus-values)
CREATE TABLE investment_disposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid REFERENCES investment_positions,
  user_id uuid REFERENCES auth.users,
  disposal_date date,
  quantity_sold numeric,
  sale_price numeric,
  realized_gain numeric -- calculé : (sale_price - pru) * qty
);
```

### Tables existantes — modifications

```sql
-- profiles : nouveaux champs
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "payDay" integer CHECK ("payDay" BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS "densityMode" text DEFAULT 'comfort' CHECK ("densityMode" IN ('comfort', 'compact')),
  ADD COLUMN IF NOT EXISTS "onboardingProfile" text; -- 'salarié' | 'freelance' | 'couple' | null

-- recurrentes : nouvelles fréquences
ALTER TABLE recurrentes
  ADD COLUMN IF NOT EXISTS "frequence" text DEFAULT 'mensuelle'
    CHECK ("frequence" IN ('hebdomadaire', 'mensuelle', 'trimestrielle', 'annuelle'));
```

---

## 7. Règles de cohérence des calculs

**Principe : une seule source de vérité par concept.**

| Concept | Source de vérité | Utilisé par |
|---|---|---|
| Solde compte courant | `soldeInitial + Σ transactions + Σ récurrentes_passées` | Dashboard, Forecast, Net Worth, Fenêtre de dépense |
| Net Worth | `Σ soldes_CC + Σ soldes_épargne + Σ valeur_invest + Σ immo − Σ capital_restant_dû` | Widget Net Worth, Score santé, Timeline |
| Forecast J | `solde_aujourd'hui + Σ récurrentes_planifiées(J) + patterns_moyens(J)` | Module Forecast, Alertes prédictives, Fenêtre de dépense |
| Taux d'épargne | `(épargne_mois + virements_objectifs) / revenus_mois` | Score santé, Rapport mensuel, Fiscalité IR |
| Plus-value latente | `(current_price − purchase_price) × quantity` | Module Investissements, Fiscalité PEA/CTO |
| Capital restant dû | Calculé depuis tableau d'amortissement à date | Net Worth (passif), Module Dettes |

**L'agent IA surveille les incohérences :**
- Si `Σ virtual_pots.amount ≠ compte_epargne.solde` → alerte utilisateur "Tes pots ne correspondent plus à ton solde réel"
- Si `total_invested > plafond_pea` → alerte "Tu approches du plafond PEA"
- Si fiscal_data.fiscal_year non renseigné → suggestion d'initialiser le module fiscalité

---

## 8. Architecture frontend — Évolutions

### Nouvelle structure `src/`

```
src/
├── modules/                  # Un dossier par module
│   ├── budget/
│   │   ├── components/       # Composants spécifiques au module
│   │   ├── hooks/            # Hooks métier du module
│   │   └── widgets/          # Widgets dashboard exportés
│   ├── forecast/
│   ├── epargne/
│   ├── investissements/
│   ├── patrimoine/
│   ├── dettes/
│   ├── simulateur/
│   ├── rapports/
│   └── fiscalite/
├── workspace/                # Système pages + widgets
│   ├── DashboardGrid.tsx     # Grille drag & drop
│   ├── PageTabs.tsx          # Onglets de navigation entre pages
│   ├── WidgetRegistry.ts     # Registre de tous les widgets disponibles
│   └── ModuleRegistry.ts     # Registre des modules + metadata
├── agent/                    # Agent IA
│   ├── AgentBanner.tsx       # Suggestions contextuelles
│   ├── TutorialOverlay.tsx   # Tutoriels step-by-step
│   ├── AlertsEngine.ts       # Logique déclenchement alertes
│   └── InsightsEngine.ts     # Génération insights hebdo/mensuels
├── components/               # Composants partagés (existants)
├── hooks/                    # Hooks partagés
├── lib/                      # Utilitaires, calculs
├── store/                    # Zustand store (étendu)
├── types/                    # Types TS (étendus)
└── locales/                  # i18n FR + EN
```

### Module Registry

```ts
interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  icon: string;
  defaultActive: boolean;
  requiredTier: TierId;  // tier minimum pour activer
  dependsOn?: ModuleKey[]; // modules requis (ex: fiscalite dépend de investissements si PV)
  widgets: WidgetDefinition[];
  tutorialSteps: TutorialStep[];
  navEntry: boolean; // apparaît dans la sidebar ?
}
```

---

## 9. Décomposition en sous-specs (implémentation par cycles)

Ce document est la **vision stratégique**. L'implémentation se fait en cycles indépendants, chacun avec sa propre spec + plan :

| Cycle | Scope | Priorité |
|---|---|---|
| **D1** | Workspace : pages/sheets + widget registry + drag & drop dashboard | 1 |
| **D2** | Refonte navigation (sidebar flottante) + registre modules + activation/désactivation | 1 |
| **D3** | Module Budget v2 : date de paie, fenêtre de dépense, récurrentes freq multiples, calendrier, détecteurs | 2 |
| **D4** | Module Forecast : algorithme 30-90j, alertes prédictives, patterns, snapshot hebdo | 2 |
| **D5** | Module Investissements : comptes, positions, performance, allocation | 3 |
| **D6** | Module Patrimoine : net worth, actif immo, timeline vie, score santé | 3 |
| **D7** | Module Dettes : crédits, amortissement, désendettement | 3 |
| **D8** | Module Épargne v2 : pots virtuels, défis, jalons objectifs | 3 |
| **D9** | Agent IA : tutoriels, suggestions, alertes, insights | 4 |
| **D10** | Module Fiscalité : IR, TMI, plus-values, PER, alertes plafonds | 4 |
| **D11** | Module Rapports v2 : comparaison temporelle, rapport mensuel auto, export PDF | 4 |
| **D12** | Modules avancés : Duo, Freelance, Multi-devise | 5 |
| **D13** | Règles automatiques, défis épargne | 5 |

---

## 10. Pricing — Mise à jour modules

| Feature | Free | Plus | Pro |
|---|---|---|---|
| Modules défaut actifs | ✅ | ✅ | ✅ |
| Pages dashboard | 1 | 5 | Illimité |
| Widgets par page | 6 | 20 | Illimité |
| Modules optionnels | 1 | 4 | Tous |
| Règles automatiques | 2 | 10 | Illimité |
| Défis actifs | 1 | 3 | Illimité |
| Module Fiscalité | — | — | ✅ |
| Module Duo | — | ✅ | ✅ |
| Module Freelance | — | ✅ | ✅ |
| Export PDF | — | ✅ | ✅ |
| Insights IA | Basiques | Avancés | Complets |

---

## 11. Principes de design (pour Claude Design)

- **Vibe :** Coloré, épais, fun, animé — inspiré Monday.com / Linear. Pas froid/texte fin.
- **Couleur par module :** Chaque module a sa propre couleur signature (utilisée dans nav, widgets, badges).
- **Densité configurable :** Mode "Confort" (débutants) vs "Compact" (power users).
- **Animations :** Transitions entre pages, compteurs animés, progress bars, micro-interactions sur widgets.
- **Dark mode :** Natif (déjà implémenté).
- **Navigation :** Sidebar flottante desktop → dock bottom mobile.
- **Sobriété de l'information :** Malgré les couleurs, chaque widget affiche 1-3 informations max. Pas de surcharge cognitive.
