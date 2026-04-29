export type TypeTransaction = "revenu" | "depense";

export type TypeCompteCourant = "perso" | "joint";

/** Période d'une récurrence (jour, semaine, mois, année). */
export type Frequence = "jour" | "semaine" | "mois" | "annee";

export interface CompteCourant {
  id: string;
  nom: string;
  type: TypeCompteCourant;
  soldeInitial: number;
  description?: string;
}

export interface Categorie {
  id: string;
  nom: string;
  type: TypeTransaction;
  couleur: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TypeTransaction;
  montant: number;
  categorieId: string;
  compteCourantId?: string;
  description?: string;
  /** Marqueur d'origine récurrente (ne pas modifier en UI listing) */
  recurrenteId?: string;
  /** Marqueur d'origine virement épargne (transaction virtuelle, non éditable) */
  virementEpargneId?: string;
}

export interface TransactionRecurrente {
  id: string;
  libelle: string;
  type: TypeTransaction;
  montant: number;
  categorieId: string;
  compteCourantId?: string;
  /**
   * Fréquence de la récurrence. Si absente, l'app considère "mois" (compat v2).
   */
  frequence?: Frequence;
  /**
   * Tous les N période(s). Défaut 1.
   * Ex: frequence="mois" + intervalle=2 → tous les 2 mois.
   */
  intervalle?: number;
  /**
   * Date ISO de la première occurrence (YYYY-MM-DD). Format unique v3.
   * Si absente, l'app reconstruit depuis moisDebut + jourMois (compat v2).
   */
  dateDebut?: string;
  /** Date ISO de fin (incluse) optionnelle (YYYY-MM-DD). */
  dateFin?: string;
  /** @deprecated v2 — utiliser dateDebut. Conservé pour compat. */
  jourMois?: number;
  /** @deprecated v2 — utiliser dateDebut. */
  moisDebut?: string;
  /** @deprecated v2 — utiliser dateFin. */
  moisFin?: string;
  description?: string;
}

export type TypeCompteEpargne = "livret" | "assurance-vie" | "boursier" | "autre";

export interface CompteEpargne {
  id: string;
  nom: string;
  soldeInitial: number;
  /** Taux annuel en %. Pour les comptes boursiers, peut être 0 (taux non pertinent). */
  tauxAnnuel: number;
  type?: TypeCompteEpargne;
  description?: string;
}

/**
 * Position dans un compte boursier (action, ETF, obligation…).
 * Le solde du compte est recalculé comme Σ(quantite × prixActuel) si tous les actifs ont un prixActuel.
 */
export interface ActifBoursier {
  id: string;
  compteId: string;
  nom: string;
  /** Code ISIN optionnel (ex : FR0010315770) */
  isin?: string;
  quantite: number;
  prixAchat: number;
  dateAchat: string;
  /** Prix actuel unitaire saisi manuellement */
  prixActuel?: number;
  dateMAJ?: string;
  description?: string;
}

export interface MouvementEpargne {
  id: string;
  compteId: string;
  date: string;
  montant: number;
  type: "versement" | "retrait" | "interet";
  description?: string;
  /** Marqueur d'origine virement récurrent (mouvement virtuel, non éditable) */
  virementEpargneId?: string;
}

/**
 * Virement automatique d'un compte courant vers un compte épargne, à fréquence libre.
 * Génère à la volée :
 *  - une Transaction virtuelle de dépense sur le compte courant
 *  - un MouvementEpargne virtuel de versement sur le compte épargne
 * Pas de stockage des occurrences en DB (cohérent avec récurrentes).
 */
export interface VirementRecurrent {
  id: string;
  libelle: string;
  compteCourantId: string;
  compteEpargneId: string;
  montant: number;
  frequence: Frequence;
  intervalle: number;
  /** Date ISO première occurrence (YYYY-MM-DD). */
  dateDebut: string;
  /** Date ISO de fin (incluse) optionnelle. */
  dateFin?: string;
  description?: string;
}

export interface Objectif {
  id: string;
  nom: string;
  montantCible: number;
  dateCible?: string;
  compteId?: string;
  description?: string;
}

export interface AchatProjet {
  id: string;
  projetId: string;
  libelle: string;
  montant: number;
  /** Date prévue ou effective */
  date: string;
  /** true = achat effectué (compte dans le coût réel) */
  valide: boolean;
  description?: string;
}

export interface Projet {
  id: string;
  nom: string;
  montantCible: number;
  versementMensuel: number;
  apportInitial: number;
  tauxAnnuel: number;
  description?: string;
}

export interface RapportCSV {
  id: string;
  compteCourantId?: string;
  nom: string;
  mois: string;
  dateImport: string;
  fichierNom?: string;
  totalDebit: number;
  totalCredit: number;
  nbLignes: number;
}

/**
 * Mapping CSV sauvegardé pour reconnaître automatiquement le format d'une banque.
 * Le contenu détaillé du mapping (colonnes, format date/montant…) vit dans `lib/csvParser.ts`
 * et est stocké en JSONB côté Supabase pour rester flexible.
 */
export interface BankProfile {
  id: string;
  nom: string;
  fingerprint: string;
  mapping: unknown; // CsvMapping — typé fortement à l'usage via lib/csvParser.ts
}

export interface RapportLigne {
  id: string;
  rapportId: string;
  date: string;
  libelle: string;
  libelleOperation?: string;
  infosComplementaires?: string;
  typeOperation?: string;
  categorie?: string;
  sousCategorie?: string;
  /** Montant signé : négatif = débit, positif = crédit */
  montant: number;
}
