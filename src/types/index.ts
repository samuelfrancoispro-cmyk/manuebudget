export type TypeTransaction = "revenu" | "depense";

export type TypeCompteCourant = "perso" | "joint";

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
}

export interface TransactionRecurrente {
  id: string;
  libelle: string;
  type: TypeTransaction;
  montant: number;
  categorieId: string;
  compteCourantId?: string;
  /** Jour du mois où la transaction tombe (1-28) */
  jourMois: number;
  /** Mois ISO de début (YYYY-MM) */
  moisDebut: string;
  /** Mois ISO de fin optionnel (YYYY-MM) */
  moisFin?: string;
  description?: string;
}

export interface CompteEpargne {
  id: string;
  nom: string;
  soldeInitial: number;
  tauxAnnuel: number;
  description?: string;
}

export interface MouvementEpargne {
  id: string;
  compteId: string;
  date: string;
  montant: number;
  type: "versement" | "retrait" | "interet";
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
