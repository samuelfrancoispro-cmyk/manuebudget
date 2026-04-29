import type {
  Transaction,
  TransactionRecurrente,
  MouvementEpargne,
  CompteEpargne,
  CompteCourant,
  Projet,
  AchatProjet,
  VirementRecurrent,
  Frequence,
} from "@/types";
import { monthKey } from "./utils";

function dateISO(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function clampJour(jour: number): number {
  return Math.min(Math.max(jour, 1), 28);
}

/**
 * Reconstruit la date ISO de la première occurrence d'une récurrente
 * en gérant la compat v2 (jourMois + moisDebut).
 */
function dateDebutEffective(r: TransactionRecurrente): string | null {
  if (r.dateDebut) return r.dateDebut;
  if (r.moisDebut) {
    const j = clampJour(r.jourMois ?? 1);
    return `${r.moisDebut}-${String(j).padStart(2, "0")}`;
  }
  return null;
}

function dateFinEffective(r: TransactionRecurrente): string | null {
  if (r.dateFin) return r.dateFin;
  if (r.moisFin) {
    const j = clampJour(r.jourMois ?? 28);
    return `${r.moisFin}-${String(j).padStart(2, "0")}`;
  }
  return null;
}

function frequenceEffective(r: TransactionRecurrente): Frequence {
  return r.frequence ?? "mois";
}

function intervalleEffectif(r: TransactionRecurrente | VirementRecurrent): number {
  const i = (r as any).intervalle;
  return typeof i === "number" && i >= 1 ? i : 1;
}

/**
 * Avance une date ISO de N période(s) selon la fréquence.
 * Pour les fréquences "mois" et "annee", la stratégie est :
 *  - on garde le jour de la date de départ ;
 *  - si le mois cible n'a pas ce jour (ex: 31 février), on clampe au dernier jour du mois.
 */
function avancerDate(dateISO: string, freq: Frequence, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (freq === "jour") {
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  if (freq === "semaine") {
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 7 * n);
    return dt.toISOString().slice(0, 10);
  }
  if (freq === "mois") {
    let mm = m - 1 + n;
    let yy = y + Math.floor(mm / 12);
    mm = ((mm % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
    const dd = Math.min(d, lastDay);
    return `${yy.toString().padStart(4, "0")}-${String(mm + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  // annee
  const yy = y + n;
  const lastDay = new Date(Date.UTC(yy, m, 0)).getUTCDate();
  const dd = Math.min(d, lastDay);
  return `${yy.toString().padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/**
 * Génère toutes les dates d'occurrence d'une récurrence dans une fenêtre [debut, fin] inclusive.
 * Avance par pas de `intervalle` × frequence depuis `dateDebut`.
 */
export function occurrencesEntreDates(
  dateDebut: string,
  dateFin: string | null,
  freq: Frequence,
  intervalle: number,
  fenetreDebut: string,
  fenetreFin: string
): string[] {
  if (intervalle < 1) intervalle = 1;
  const out: string[] = [];
  let curr = dateDebut;
  // safety guard
  let safety = 0;
  const stopBound = dateFin && dateFin < fenetreFin ? dateFin : fenetreFin;
  while (curr <= stopBound && safety < 50000) {
    if (curr >= fenetreDebut) out.push(curr);
    curr = avancerDate(curr, freq, intervalle);
    safety++;
  }
  return out;
}

/**
 * Génère les transactions virtuelles produites par les récurrentes pour un mois donné.
 * - `seulementEchues` : si true, exclut les occurrences postérieures à `aujourdhui`.
 */
export function expandRecurrentesPourMois(
  recurrentes: TransactionRecurrente[],
  mois: string,
  options?: { seulementEchues?: boolean; aujourdhui?: string }
): Transaction[] {
  const auj = options?.aujourdhui ?? dateISO();
  const fenetreDebut = `${mois}-01`;
  const [y, m] = mois.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const fenetreFin = `${mois}-${String(lastDay).padStart(2, "0")}`;
  const out: Transaction[] = [];
  for (const r of recurrentes) {
    const debut = dateDebutEffective(r);
    if (!debut) continue;
    const fin = dateFinEffective(r);
    const freq = frequenceEffective(r);
    const intervalle = intervalleEffectif(r);
    const dates = occurrencesEntreDates(debut, fin, freq, intervalle, fenetreDebut, fenetreFin);
    for (const d of dates) {
      if (options?.seulementEchues && d > auj) continue;
      out.push({
        id: `rec-${r.id}-${d}`,
        date: d,
        type: r.type,
        montant: r.montant,
        categorieId: r.categorieId,
        compteCourantId: r.compteCourantId,
        description: r.libelle + (r.description ? ` — ${r.description}` : ""),
        recurrenteId: r.id,
      });
    }
  }
  return out;
}

/**
 * Génère les transactions virtuelles d'un virement récurrent (sortie compte courant).
 * Catégorie : null (les virements épargne ne consomment pas une catégorie).
 */
export function expandVirementsTransactionsPourMois(
  virements: VirementRecurrent[],
  comptesEpargne: CompteEpargne[],
  mois: string,
  options?: { seulementEchues?: boolean; aujourdhui?: string }
): Transaction[] {
  const auj = options?.aujourdhui ?? dateISO();
  const fenetreDebut = `${mois}-01`;
  const [y, m] = mois.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const fenetreFin = `${mois}-${String(lastDay).padStart(2, "0")}`;
  const out: Transaction[] = [];
  for (const v of virements) {
    const dates = occurrencesEntreDates(
      v.dateDebut,
      v.dateFin ?? null,
      v.frequence,
      intervalleEffectif(v),
      fenetreDebut,
      fenetreFin
    );
    const ce = comptesEpargne.find((c) => c.id === v.compteEpargneId);
    const labelCible = ce?.nom ?? "épargne";
    for (const d of dates) {
      if (options?.seulementEchues && d > auj) continue;
      out.push({
        id: `vir-${v.id}-${d}`,
        date: d,
        type: "depense",
        montant: v.montant,
        categorieId: "",
        compteCourantId: v.compteCourantId,
        description: `${v.libelle} → ${labelCible}`,
        virementEpargneId: v.id,
      });
    }
  }
  return out;
}

/**
 * Génère les mouvements d'épargne virtuels d'un virement récurrent (entrée compte épargne).
 */
export function expandVirementsMouvementsPourMois(
  virements: VirementRecurrent[],
  mois: string,
  options?: { seulementEchues?: boolean; aujourdhui?: string }
): MouvementEpargne[] {
  const auj = options?.aujourdhui ?? dateISO();
  const fenetreDebut = `${mois}-01`;
  const [y, m] = mois.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const fenetreFin = `${mois}-${String(lastDay).padStart(2, "0")}`;
  const out: MouvementEpargne[] = [];
  for (const v of virements) {
    const dates = occurrencesEntreDates(
      v.dateDebut,
      v.dateFin ?? null,
      v.frequence,
      intervalleEffectif(v),
      fenetreDebut,
      fenetreFin
    );
    for (const d of dates) {
      if (options?.seulementEchues && d > auj) continue;
      out.push({
        id: `vir-${v.id}-${d}`,
        compteId: v.compteEpargneId,
        date: d,
        montant: v.montant,
        type: "versement",
        description: `Virement automatique — ${v.libelle}`,
        virementEpargneId: v.id,
      });
    }
  }
  return out;
}

/**
 * Toutes les transactions effectives d'un mois (ponctuelles + récurrentes virtuelles
 * + virements épargne virtuels), éventuellement filtrées par compte courant.
 */
export function transactionsEffectivesMois(
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[],
  mois: string,
  compteCourantId?: string,
  virements: VirementRecurrent[] = [],
  comptesEpargne: CompteEpargne[] = []
): Transaction[] {
  const ponctuelles = transactions.filter((t) => monthKey(t.date) === mois);
  const recs = expandRecurrentesPourMois(recurrentes, mois);
  const virs = expandVirementsTransactionsPourMois(virements, comptesEpargne, mois);
  const all = [...ponctuelles, ...recs, ...virs];
  return compteCourantId ? all.filter((t) => t.compteCourantId === compteCourantId) : all;
}

export function totauxMois(
  transactions: Transaction[],
  mois: string,
  recurrentes: TransactionRecurrente[] = [],
  compteCourantId?: string,
  virements: VirementRecurrent[] = [],
  comptesEpargne: CompteEpargne[] = []
) {
  const filtres = transactionsEffectivesMois(
    transactions,
    recurrentes,
    mois,
    compteCourantId,
    virements,
    comptesEpargne
  );
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
  compteCourantId?: string,
  virements: VirementRecurrent[] = [],
  comptesEpargne: CompteEpargne[] = []
) {
  const map = new Map<string, number>();
  transactionsEffectivesMois(transactions, recurrentes, mois, compteCourantId, virements, comptesEpargne)
    .filter((t) => t.type === "depense")
    .forEach((t) => map.set(t.categorieId || "_virement", (map.get(t.categorieId || "_virement") || 0) + t.montant));
  return map;
}

export function moisDisponibles(
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[] = [],
  virements: VirementRecurrent[] = []
): string[] {
  const set = new Set<string>();
  transactions.forEach((t) => set.add(monthKey(t.date)));
  recurrentes.forEach((r) => {
    const d = dateDebutEffective(r);
    if (d) set.add(monthKey(d));
  });
  virements.forEach((v) => set.add(monthKey(v.dateDebut)));
  return Array.from(set).sort().reverse();
}

/**
 * Cumul net (signé) des transactions ponctuelles + récurrentes + virements épargne
 * pour un compte courant, jusqu'à `jusquauDate`.
 */
export function cumulCompteCourant(
  compteId: string,
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[],
  jusquauDate: string = dateISO(),
  virements: VirementRecurrent[] = [],
  comptesEpargne: CompteEpargne[] = []
): number {
  let cumul = 0;
  for (const t of transactions) {
    if (t.compteCourantId !== compteId) continue;
    if (t.date > jusquauDate) continue;
    cumul += t.type === "revenu" ? t.montant : -t.montant;
  }
  // Récurrentes échues
  const moisLimite = jusquauDate.slice(0, 7);
  const moisListe = moisJusquA(moisLimite);
  for (const m of moisListe) {
    const recs = expandRecurrentesPourMois(recurrentes, m, {
      seulementEchues: true,
      aujourdhui: jusquauDate,
    });
    for (const t of recs) {
      if (t.compteCourantId !== compteId) continue;
      cumul += t.type === "revenu" ? t.montant : -t.montant;
    }
    const virs = expandVirementsTransactionsPourMois(virements, comptesEpargne, m, {
      seulementEchues: true,
      aujourdhui: jusquauDate,
    });
    for (const t of virs) {
      if (t.compteCourantId !== compteId) continue;
      cumul -= t.montant; // virement = sortie
    }
  }
  return cumul;
}

/**
 * Liste tous les mois ISO du début raisonnable (5 ans en arrière) jusqu'au `moisLimite`.
 * On limite à 60 mois pour borner le coût.
 */
function moisJusquA(moisLimite: string): string[] {
  const out: string[] = [];
  let [y, m] = moisLimite.split("-").map(Number);
  let yMin = y - 5;
  let mois = `${yMin.toString().padStart(4, "0")}-01`;
  while (mois <= moisLimite) {
    out.push(mois);
    let [yy, mm] = mois.split("-").map(Number);
    mm++;
    if (mm > 12) {
      mm = 1;
      yy++;
    }
    mois = `${yy.toString().padStart(4, "0")}-${String(mm).padStart(2, "0")}`;
  }
  return out;
}

/**
 * Solde courant d'un compte = solde initial + cumul de toutes les transactions
 * échues à `jusquauDate` (date système par défaut).
 */
export function soldeCompteCourant(
  compte: CompteCourant,
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[],
  jusquauDate: string = dateISO(),
  virements: VirementRecurrent[] = [],
  comptesEpargne: CompteEpargne[] = []
): number {
  return (
    compte.soldeInitial +
    cumulCompteCourant(compte.id, transactions, recurrentes, jusquauDate, virements, comptesEpargne)
  );
}

/**
 * Solde d'un compte épargne = solde initial + mouvements (manuels + virements auto échus).
 */
export function soldeCompte(
  compte: CompteEpargne,
  mouvements: MouvementEpargne[],
  virements: VirementRecurrent[] = [],
  jusquauDate: string = dateISO()
): number {
  const mvts = mouvements.filter((m) => m.compteId === compte.id);
  let delta = mvts.reduce((acc, m) => {
    if (m.type === "retrait") return acc - m.montant;
    return acc + m.montant;
  }, 0);
  // Virements automatiques échus vers ce compte
  const moisLimite = jusquauDate.slice(0, 7);
  const moisListe = moisJusquA(moisLimite);
  for (const mois of moisListe) {
    const virs = expandVirementsMouvementsPourMois(virements, mois, {
      seulementEchues: true,
      aujourdhui: jusquauDate,
    });
    for (const v of virs) {
      if (v.compteId === compte.id) delta += v.montant;
    }
  }
  return compte.soldeInitial + delta;
}

export function totalEpargne(
  comptes: CompteEpargne[],
  mouvements: MouvementEpargne[],
  virements: VirementRecurrent[] = []
): number {
  return comptes.reduce((sum, c) => sum + soldeCompte(c, mouvements, virements), 0);
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

/**
 * Étiquette humaine d'une fréquence + intervalle.
 * Ex: ("mois", 1) → "Tous les mois" ; ("semaine", 2) → "Toutes les 2 semaines"
 */
export function labelFrequence(freq: Frequence, intervalle: number = 1): string {
  const i = Math.max(1, intervalle);
  const map: Record<Frequence, [string, string]> = {
    jour: ["jour", "jours"],
    semaine: ["semaine", "semaines"],
    mois: ["mois", "mois"],
    annee: ["an", "ans"],
  };
  const [singulier, pluriel] = map[freq];
  if (i === 1) {
    if (freq === "jour") return "Tous les jours";
    if (freq === "semaine") return "Toutes les semaines";
    if (freq === "mois") return "Tous les mois";
    return "Tous les ans";
  }
  const article = freq === "semaine" ? "Toutes les" : "Tous les";
  return `${article} ${i} ${pluriel === "mois" ? "mois" : pluriel}`;
  void singulier;
}

/**
 * Calcule la prochaine occurrence (>= aujourd'hui) d'une récurrence.
 * Retourne null si la récurrence est terminée.
 */
export function prochaineOccurrence(
  dateDebut: string,
  dateFin: string | null,
  freq: Frequence,
  intervalle: number,
  aujourdhui: string = dateISO()
): string | null {
  let curr = dateDebut;
  let safety = 0;
  while (curr < aujourdhui && safety < 50000) {
    curr = avancerDate(curr, freq, Math.max(1, intervalle));
    safety++;
  }
  if (dateFin && curr > dateFin) return null;
  return curr;
}

/**
 * Évolution mensuelle du solde d'un compte courant sur N mois (passés + futurs).
 * Utile pour tracer une courbe / sparkline sur le dashboard.
 */
export function evolutionSoldeCompteCourant(
  compte: CompteCourant,
  transactions: Transaction[],
  recurrentes: TransactionRecurrente[],
  virements: VirementRecurrent[],
  comptesEpargne: CompteEpargne[],
  moisDebut: string,
  moisFin: string
): Array<{ mois: string; solde: number }> {
  const out: Array<{ mois: string; solde: number }> = [];
  let curr = moisDebut;
  while (curr <= moisFin) {
    const [y, m] = curr.split("-").map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const finMois = `${curr}-${String(lastDay).padStart(2, "0")}`;
    const solde = soldeCompteCourant(compte, transactions, recurrentes, finMois, virements, comptesEpargne);
    out.push({ mois: curr, solde });
    let yy = y, mm = m + 1;
    if (mm > 12) {
      mm = 1;
      yy++;
    }
    curr = `${yy.toString().padStart(4, "0")}-${String(mm).padStart(2, "0")}`;
  }
  return out;
}
