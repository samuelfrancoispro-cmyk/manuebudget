// ─── Shared ───────────────────────────────────────────────
export type Rect = { x: number; y: number; w: number; h: number };

// ─── Whiteboard ───────────────────────────────────────────
export interface Sheet {
  id: string;
  name: string;
  order: number;
  zoom: number;
  panX: number;
  panY: number;
}

export type ModuleKey =
  | 'solde' | 'depenses' | 'recurrentes' | 'objectif-epargne'
  | 'kpi-mensuel' | 'net-worth' | 'categories' | 'pots' | 'projets'
  | 'pea-cto' | 'performance' | 'tmi' | 'ir' | 'per' | 'famille' | 'partage';

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

// ─── Gating ───────────────────────────────────────────────
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

export type Tier = 'free' | 'plus' | 'pro';

// ─── Profile ──────────────────────────────────────────────
export interface Profile {
  id: string;
  userId: string;
  tier: Tier;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  onboardingStep: number;
}

// ─── Metier (conservé) ────────────────────────────────────
export interface CompteCourant {
  id: string;
  userId: string;
  nom: string;
  soldeInitial: number;
}

export interface Transaction {
  id: string;
  userId: string;
  compteCourantId: string;
  categorieId: string | null;
  libelle: string;
  montant: number;
  date: string;
  type: 'debit' | 'credit';
}

export interface TransactionRecurrente {
  id: string;
  userId: string;
  compteCourantId?: string;
  libelle: string;
  montant: number;
  jourPrelevement: number;
  type: 'debit' | 'credit';
  actif: boolean;
}

export interface Categorie {
  id: string;
  userId: string;
  nom: string;
  type: 'revenu' | 'depense';
  couleur: string;
  icone?: string;
}

export interface Objectif {
  id: string;
  userId: string;
  nom: string;
  montantCible: number;
  montantActuel: number;
  dateCible: string | null;
}

export interface CompteEpargne {
  id: string;
  nom: string;
  solde: number;
  type: 'livret' | 'pel' | 'assurance-vie' | 'autre';
}

export interface MouvementEpargne {
  id: string;
  compteId: string;
  libelle: string;
  montant: number;
  date: string;
  type: 'depot' | 'retrait';
}
