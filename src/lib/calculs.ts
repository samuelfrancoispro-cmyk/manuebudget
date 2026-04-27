import type {
  Transaction,
  TransactionRecurrente,
  MouvementEpargne,
  CompteEpargne,
  CompteCourant,
  Projet,
  AchatProjet,
} from "@/types";
import { monthKey } from "./utils";

function dateISO(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function clampJour(jour: number): number {
  return Math.min(Math.max(jour, 1), 28);
}

function dateRecurrente(r: TransactionRecurrente, mois: string): string {
  const [y, m] = mois.split("-").map(Number);
  const j = clampJour(r.jourMois);
  return `${y.toString().padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
}

/**
 * Génère les transactions virtuelles produites par les récurrentes pour un mois donné.
 * - `seulementEchues` : si true, exclut les occurrences postérieures à `aujourdhui`
 *   (date système). Utile pour calculer le solde réel d'un compte.
 */
export function expandRecurrentesPourMois(
  recurrentes: TransactionRecurrente[],
  mois: string,
  options?: { seulementEchues?: boolean; aujourdhui?: string }
): Transaction[] {
  const auj = options?.aujourdhui ?? dateISO();
  return recurrentes
    .filter((r) => {
      if (r.moisDebut > mois) return false;
      if (r.moisFin && r.moisFin < mois) return false;
      return true;
    })
    .map<Transaction>((r) => {
      const date = dateRecurrente(r, mois);
      return {
        id: `rec-${r.id}-${mois}`,
        date,
        type: r.type,
        montant: r.montant,
        categorieId: r.categorieId,
        compteCourantId: r.compteCourantId,
        description: r.libelle + (r.description ? ` — ${r.description}` : ""),
        recurrenteId: r.id,
      };
    })
    .filter((t) => (options?.seulementEchues ? t.date <= auj : true));
}

/**
 * Toutes les transactions effectives d'un mois (ponctuelles + récurrentes virtuelles),
 * éventuellement filtrées par compte courant.
 */
export function transactionsEffectivesMois(
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[],
  mois: string,
  compteCourantId?: string
): Transaction[] {
  const ponctuelles = transactions.filter((t) => monthKey(t.date) === mois);
  const recs = expandRecurrentesPourMois(recurrentes, mois);
  const all = [...ponctuelles, ...recs];
  return compteCourantId ? all.filter((t) => t.compteCourantId === compteCourantId) : all;
}

export function totauxMois(
  transactions: Transaction[],
  mois: string,
  recurrentes: TransactionRecurrente[] = [],
  compteCourantId?: string
) {
  const filtres = transactionsEffectivesMois(transactions, recurrentes, mois, compteCourantId);
  const revenus = filtres
    .filter((t) => t.type === "revenu")
    .reduce((sum, t) => sum + t.montant, 0);
  const depenses = filtres
    .filter((t) => t.type === "depense")
    .reduce((sum, t) => sum + t.montant, 0);
  return { revenus, depenses, solde: revenus - depenses, count: filtres.length };
}

export function depensesParCategorie(
  transactions: Transaction[],
  mois: string,
  recurrentes: TransactionRecurrente[] = [],
  compteCourantId?: string
) {
  const map = new Map<string, number>();
  transactionsEffectivesMois(transactions, recurrentes, mois, compteCourantId)
    .filter((t) => t.type === "depense")
    .forEach((t) => map.set(t.categorieId, (map.get(t.categorieId) || 0) + t.montant));
  return map;
}

export function moisDisponibles(
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[] = []
): string[] {
  const set = new Set<string>();
  transactions.forEach((t) => set.add(monthKey(t.date)));
  recurrentes.forEach((r) => set.add(r.moisDebut));
  return Array.from(set).sort().reverse();
}

function moisEntre(debut: string, fin: string): string[] {
  const out: string[] = [];
  if (debut > fin) return out;
  let [y, m] = debut.split("-").map(Number);
  const [yf, mf] = fin.split("-").map(Number);
  while (y < yf || (y === yf && m <= mf)) {
    out.push(`${y.toString().padStart(4, "0")}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

/**
 * Cumul net (signé) des transactions ponctuelles + récurrentes pour un compte,
 * jusqu'à `jusquauDate` (date ISO). Les récurrentes ne sont prises en compte que
 * si leur jour de tombée est <= jusquauDate.
 */
export function cumulCompteCourant(
  compteId: string,
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[],
  jusquauDate: string = dateISO()
): number {
  let cumul = 0;
  for (const t of transactions) {
    if (t.compteCourantId !== compteId) continue;
    if (t.date > jusquauDate) continue;
    cumul += t.type === "revenu" ? t.montant : -t.montant;
  }
  const moisLimite = jusquauDate.slice(0, 7);
  for (const r of recurrentes.filter((r) => r.compteCourantId === compteId)) {
    const finBoucle = r.moisFin && r.moisFin < moisLimite ? r.moisFin : moisLimite;
    const mois = moisEntre(r.moisDebut, finBoucle);
    for (const m of mois) {
      const dateOcc = dateRecurrente(r, m);
      if (dateOcc <= jusquauDate) {
        cumul += r.type === "revenu" ? r.montant : -r.montant;
      }
    }
  }
  return cumul;
}

/**
 * Solde courant d'un compte = solde initial + cumul de toutes les transactions
 * échues à `jusquauDate` (date système par défaut).
 */
export function soldeCompteCourant(
  compte: CompteCourant,
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[],
  jusquauDate: string = dateISO()
): number {
  return compte.soldeInitial + cumulCompteCourant(compte.id, transactions, recurrentes, jusquauDate);
}

export function soldeCompte(
  compte: CompteEpargne,
  mouvements: MouvementEpargne[]
): number {
  const mvts = mouvements.filter((m) => m.compteId === compte.id);
  const delta = mvts.reduce((acc, m) => {
    if (m.type === "retrait") return acc - m.montant;
    return acc + m.montant;
  }, 0);
  return compte.soldeInitial + delta;
}

export function totalEpargne(
  comptes: CompteEpargne[],
  mouvements: MouvementEpargne[]
): number {
  return comptes.reduce((sum, c) => sum + soldeCompte(c, mouvements), 0);
}

export interface SimulationResultat {
  moisNecessaires: number;
  anneesNecessaires: number;
  totalVerse: number;
  interetsGagnes: number;
  capitalFinal: number;
  evolution: Array<{ mois: number; capital: number; verse: number }>;
  atteignable: boolean;
}

export function simulerProjet(p: Projet): SimulationResultat {
  const tauxMensuel = p.tauxAnnuel / 100 / 12;
  const evolution: Array<{ mois: number; capital: number; verse: number }> = [];
  let capital = p.apportInitial;
  let verse = p.apportInitial;
  evolution.push({ mois: 0, capital, verse });

  if (p.versementMensuel <= 0 && capital < p.montantCible) {
    return {
      moisNecessaires: Infinity,
      anneesNecessaires: Infinity,
      totalVerse: verse,
      interetsGagnes: 0,
      capitalFinal: capital,
      evolution,
      atteignable: false,
    };
  }

  let mois = 0;
  const maxMois = 12 * 100;
  while (capital < p.montantCible && mois < maxMois) {
    mois++;
    capital = capital * (1 + tauxMensuel) + p.versementMensuel;
    verse += p.versementMensuel;
    evolution.push({ mois, capital, verse });
  }

  return {
    moisNecessaires: capital >= p.montantCible ? mois : Infinity,
    anneesNecessaires: capital >= p.montantCible ? mois / 12 : Infinity,
    totalVerse: verse,
    interetsGagnes: capital - verse,
    capitalFinal: capital,
    evolution,
    atteignable: capital >= p.montantCible,
  };
}

export function totalAchatsProjet(achats: AchatProjet[] = []): {
  total: number;
  effectue: number;
  prevu: number;
} {
  let effectue = 0;
  let prevu = 0;
  for (const a of achats) {
    if (a.valide) effectue += a.montant;
    else prevu += a.montant;
  }
  return { total: effectue + prevu, effectue, prevu };
}

export function progressionObjectif(
  cible: number,
  actuel: number
): { pct: number; restant: number } {
  if (cible <= 0) return { pct: 0, restant: 0 };
  const pct = Math.min(100, (actuel / cible) * 100);
  return { pct, restant: Math.max(0, cible - actuel) };
}
