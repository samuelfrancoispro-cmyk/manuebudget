# Budget app v2 — Design

**Date** : 2026-04-26
**Statut** : approuvé (GO global)
**Précédent** : `2026-04-25-budget-app-design.md` (v1 livrée)

## Objectif

Faire évoluer l'app v1 (mono-compte, transactions ponctuelles uniquement, simulateur projet abstrait) vers un outil multi-comptes avec récurrences mensuelles et simulation de projet par achats datés.

## Périmètre

4 changements majeurs, livrés en un seul lot :

1. **Multi-comptes courants** (incl. compte joint comme libellé)
2. **Récurrences mensuelles** (revenus + dépenses fixes, jamais matérialisées en transactions)
3. **Reste à vivre par compte** (revenus encaissés − dépenses passées du mois)
4. **Refonte simulateur projet** : timeline d'achats datés + épargne mensuelle/taux conservés (hybride)

Hors périmètre : récurrences hebdo/annuelles, partage 50/50 du compte joint, multi-utilisateurs, backend.

## Modèle de données

### Nouveaux types (`src/types/index.ts`)

```ts
export type TypeCompte = "courant" | "joint";

export interface CompteCourant {
  id: string;
  nom: string;
  type: TypeCompte;
  soldeInitial: number;
  description?: string;
  ordre?: number;
}

export type FrequenceRecurrence = "mensuelle";

export interface Recurrence {
  id: string;
  nom: string;
  type: TypeTransaction;        // "revenu" | "depense"
  montant: number;
  jourDuMois: number;           // 1..31, clampé au dernier jour si mois plus court
  categorieId: string;
  compteId: string;             // FK CompteCourant
  dateDebut?: string;           // ISO, défaut : illimité passé
  dateFin?: string;             // ISO, défaut : illimité futur
  active: boolean;
  description?: string;
}

export interface AchatProjet {
  id: string;
  projetId: string;
  date: string;                 // ISO
  libelle: string;
  montant: number;
  effectue: boolean;
}
```

### Types modifiés

**`Transaction`** : ajout d'un champ `compteId: string` (obligatoire). Le champ legacy `recurrent?: boolean` est supprimé (remplacé par l'entité `Recurrence`).

**`Projet`** : `montantCible` devient **dérivé** (= somme des achats du projet), donc retiré du modèle ; ajout de `dateDebut: string`. Le reste (`apportInitial`, `versementMensuel`, `tauxAnnuel`) est conservé pour la simulation hybride.

```ts
export interface Projet {
  id: string;
  nom: string;
  description?: string;
  apportInitial: number;
  versementMensuel: number;
  tauxAnnuel: number;
  dateDebut: string;            // ISO
}
```

**`CompteEpargne`** : inchangé.

## Règles métier

### Récurrence "passée dans le mois courant"

Pour une `Recurrence` `r`, à la date `d` :

- `r.active === true`
- `r.dateDebut` absent OU `r.dateDebut <= d`
- `r.dateFin` absent OU `r.dateFin >= d`
- `clampJour(r.jourDuMois, mois(d)) <= jour(d)`

où `clampJour(jour, mois)` renvoie `min(jour, dernierJourDuMois)`.

Une récurrence **à venir dans le mois courant** vérifie tout sauf la dernière condition (le jour est strictement futur dans le mois en cours).

### Reste à vivre par compte

Pour un compte `c` et un mois `m` :

```
soldeInitial(c)
+ Σ revenus(c, m, passés)
- Σ dépenses(c, m, passées)
= reste à vivre actuel(c, m)
```

avec :
- `revenus(c, m, passés)` = transactions de type revenu liées à `c` dont la `date` est dans `m` ET `<= aujourd'hui`, **plus** récurrences revenus liées à `c` passées dans `m`
- idem dépenses

**Indicateur affiché à côté** : "À venir ce mois-ci" = somme nette (revenus − dépenses) des récurrences **futures** du mois courant pour ce compte. Pas inclus dans le reste à vivre principal.

**Vue agrégée "Tous comptes"** : somme des reste-à-vivre par compte.

### Simulation projet hybride

Pour un projet `p` à une date cible `d_cible` :

```
épargneSimulée(p, d_cible) = apportInitial * (1 + tauxMensuel)^n
                           + versementMensuel * [((1 + tauxMensuel)^n − 1) / tauxMensuel]
```

avec `n = nbMois(p.dateDebut → d_cible)` et `tauxMensuel = tauxAnnuel / 100 / 12`.

Pour chaque achat `a` du projet :
- **Coût cumulé jusqu'à `a`** = somme des montants des achats dont `date <= a.date`
- **Épargne cumulée à `a.date`** = `épargneSimulée(p, a.date)`
- `a` est **atteignable** si `épargneCumulée >= coûtCumulé`

Coût total du projet = somme des montants de tous les achats.

## Architecture UI

### Nouvelles pages

- **`/comptes-courants`** : liste + CRUD `CompteCourant`. Marquer un compte par défaut (= `defaultCompteId` en paramètres).
- **`/recurrences`** : liste + CRUD `Recurrence`. Tableau avec toggle actif/inactif, badge revenu/dépense, jour du mois, compte associé.

### Pages modifiées

| Page | Changement |
|---|---|
| `/dashboard` | Sélecteur compte (incl. "Tous"), KPIs reste-à-vivre + à-venir + total mois + épargne ; cartes par compte si "Tous" sélectionné |
| `/transactions` | Filtre par compte, formulaire ajoute champ `compteId` obligatoire |
| `/simulateur` | Refonte : 1 onglet par projet, timeline d'achats, comparaison épargne vs coût cumulé |
| `/parametres` | Ajout sélection compte par défaut + stats étendues (comptes courants, récurrences, achats) |

### Navigation latérale

Ordre proposé : Dashboard, Transactions, Comptes courants, Récurrences, Épargne, Simulateur, Paramètres.

## Store (zustand persist)

### Nouvelles entrées d'état

```ts
comptesCourants: CompteCourant[];
recurrences: Recurrence[];
achatsProjet: AchatProjet[];
defaultCompteId: string | null;
```

### Nouvelles actions

```ts
addCompteCourant / updateCompteCourant / deleteCompteCourant
addRecurrence / updateRecurrence / deleteRecurrence / toggleRecurrence(id)
addAchat / updateAchat / deleteAchat / toggleAchatEffectue(id)
setDefaultCompte(id)
```

`importData` étendu pour gérer les nouvelles clés. `resetAll` réinitialise tout.

### Migration v1 → v2

Bump `version: 2`. Fonction `migrate` :

1. Si pas de `comptesCourants`, créer un compte par défaut `{ id: "compte-principal", nom: "Compte principal", type: "courant", soldeInitial: 0 }`
2. Toute `Transaction` sans `compteId` → set `compteId: "compte-principal"`
3. Initialiser `recurrences: []`, `achatsProjet: []`, `defaultCompteId: "compte-principal"`
4. Pour chaque `Projet` existant sans `dateDebut`, set `dateDebut: today()`. `montantCible` legacy ignoré (devient dérivé).

## Helpers de calcul (`src/lib/calculs.ts`)

Ajouts (les fonctions v1 restent, certaines refactorées pour prendre `compteId?` optionnel) :

```ts
clampJourDuMois(jour: number, annee: number, mois0Based: number): number

isRecurrencePasseeDansMois(rec: Recurrence, refDate: Date): boolean
isRecurrenceAVenirDansMois(rec: Recurrence, refDate: Date): boolean

totauxCompteMois(
  compteId: string,
  mois: string,
  transactions: Transaction[],
  recurrences: Recurrence[],
  refDate?: Date
): { revenusPasse, depensesPasse, revenusAVenir, depensesAVenir }

resteAVivreCompte(
  compte: CompteCourant,
  mois: string,
  transactions: Transaction[],
  recurrences: Recurrence[],
  refDate?: Date
): number

epargneSimulee(p: Projet, dateCible: string): number

simulerProjetV2(
  p: Projet,
  achats: AchatProjet[]
): {
  coutTotal: number;
  achatsAvecAtteignabilite: Array<{ achat: AchatProjet; coutCumule: number; epargneCumulee: number; atteignable: boolean }>;
  derniereDate: string | null;
  ecartFinal: number;     // épargne au dernier achat - coût total
}
```

`simulerProjet` v1 (signature ancienne) reste exporté pour compat tant que des appels existent ; sera retiré une fois la page simulateur refondue.

## Stratégie d'implémentation

### Lots (l'utilisateur peut suspendre/reprendre via `continu`)

1. **Lot 1 — Socle données** : types, store + migration, helpers calculs
2. **Lot 2 — Comptes courants** : page CRUD + nav
3. **Lot 3 — Récurrences** : page CRUD + nav
4. **Lot 4 — Transactions enrichies** : filtre + formulaire compteId
5. **Lot 5 — Dashboard refondu** : sélecteur compte + cartes reste-à-vivre
6. **Lot 6 — Simulateur refondu** : timeline achats + simulation hybride
7. **Lot 7 — Paramètres** : compte par défaut + stats étendues
8. **Lot 8 — Vérif build + smoke test manuel** : `npm run build` doit passer, ouvrir l'app et vérifier les écrans clés.

### Reprise

Fichier `docs/superpowers/state/CURRENT.md` mis à jour à chaque fin de lot. Si l'utilisateur tape `continu`, lire ce fichier et reprendre au prochain lot.

## Tests

Pas de framework de test installé en v1 ; on n'en ajoute pas (cohérent avec consigne "pas s'emballer"). Validation = `npm run build` qui passe + smoke test manuel des écrans clés.

## Risques / points d'attention

- **Récurrence jamais matérialisée** : l'utilisateur ne pourra pas exceptionnellement modifier une occurrence (ex: "ce mois-ci le loyer est plus élevé"). Workaround : désactiver la récurrence pour ce mois et créer une transaction ponctuelle, ou modifier le montant de la récurrence. Acceptable v2.
- **Compte joint = libellé** : pas de logique de partage. Si l'utilisateur veut suivre la part qui le concerne, il devra le faire manuellement (ex: créer 2 récurrences "loyer 50%"). Acceptable v2.
- **Cohérence transactions ↔ comptes** : suppression d'un compte courant doit bloquer si transactions/récurrences attachées (toast erreur), ou supprimer en cascade. **Choix** : bloquer avec message clair, l'utilisateur doit nettoyer manuellement.
- **Build TS** : refactor `Projet` peut casser l'ancien simulateur. À traiter pendant le lot 6.
