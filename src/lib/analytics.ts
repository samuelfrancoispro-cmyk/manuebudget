import type { RapportLigne } from "@/types";

export interface CategorieAgg {
  categorie: string;
  total: number;
  nbOperations: number;
  couleur: string;
}

export interface TopDepense {
  libelle: string;
  montant: number;
  date: string;
  categorie?: string;
}

export interface AbonnementSuspect {
  libelle: string;
  montant: number;
  occurrences: number;
}

export interface PisteEconomie {
  titre: string;
  description: string;
  gainEstime?: number;
  niveau: "info" | "moyen" | "fort";
}

export interface AnalyseRapport {
  totalDebit: number;
  totalCredit: number;
  solde: number;
  parCategorie: CategorieAgg[];
  topDepenses: TopDepense[];
  abonnementsSuspects: AbonnementSuspect[];
  pistesEconomie: PisteEconomie[];
  evolutionJournaliere: { date: string; debit: number; credit: number }[];
}

const COULEURS_CAT: Record<string, string> = {
  Alimentation: "#f97316",
  "Shopping et services": "#a855f7",
  "Loisirs et vacances": "#06b6d4",
  "Logement - maison": "#ef4444",
  Transport: "#f59e0b",
  "Banque et assurances": "#64748b",
  Sante: "#10b981",
  "A categoriser - sortie d'argent": "#94a3b8",
  "A categoriser - rentree d'argent": "#22c55e",
  "Salaires et revenus": "#22c55e",
};

function couleurPourCategorie(nom: string): string {
  if (COULEURS_CAT[nom]) return COULEURS_CAT[nom];
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = (hash * 31 + nom.charCodeAt(i)) >>> 0;
  const palette = [
    "#6366f1", "#ec4899", "#14b8a6", "#84cc16", "#f43f5e",
    "#0ea5e9", "#d946ef", "#eab308", "#8b5cf6", "#22d3ee",
  ];
  return palette[hash % palette.length];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bfact\s*\d+/g, "")
    .replace(/\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyserRapport(lignes: RapportLigne[]): AnalyseRapport {
  let totalDebit = 0;
  let totalCredit = 0;
  const catMap = new Map<string, { total: number; nb: number }>();
  const evoMap = new Map<string, { debit: number; credit: number }>();
  const depenses: TopDepense[] = [];
  const groupesLibelles = new Map<string, { libelle: string; montants: number[] }>();

  for (const l of lignes) {
    if (l.montant < 0) {
      const abs = -l.montant;
      totalDebit += abs;
      const cat = l.categorie || "Non catégorisé";
      const cur = catMap.get(cat) ?? { total: 0, nb: 0 };
      cur.total += abs;
      cur.nb += 1;
      catMap.set(cat, cur);

      depenses.push({
        libelle: l.libelle,
        montant: abs,
        date: l.date,
        categorie: l.categorie,
      });

      const key = normalize(l.libelle);
      if (key.length >= 3) {
        const grp = groupesLibelles.get(key) ?? { libelle: l.libelle, montants: [] };
        grp.montants.push(abs);
        groupesLibelles.set(key, grp);
      }
    } else {
      totalCredit += l.montant;
    }

    const e = evoMap.get(l.date) ?? { debit: 0, credit: 0 };
    if (l.montant < 0) e.debit += -l.montant;
    else e.credit += l.montant;
    evoMap.set(l.date, e);
  }

  const parCategorie: CategorieAgg[] = Array.from(catMap.entries())
    .map(([categorie, v]) => ({
      categorie,
      total: v.total,
      nbOperations: v.nb,
      couleur: couleurPourCategorie(categorie),
    }))
    .sort((a, b) => b.total - a.total);

  const topDepenses = depenses
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 10);

  const abonnementsSuspects: AbonnementSuspect[] = [];
  for (const grp of groupesLibelles.values()) {
    if (grp.montants.length >= 2) {
      const min = Math.min(...grp.montants);
      const max = Math.max(...grp.montants);
      const moyenne = grp.montants.reduce((a, b) => a + b, 0) / grp.montants.length;
      // Récurrent si écart faible (<20%) entre montants
      if (max - min < moyenne * 0.2 + 1) {
        abonnementsSuspects.push({
          libelle: grp.libelle,
          montant: moyenne,
          occurrences: grp.montants.length,
        });
      }
    }
  }
  abonnementsSuspects.sort((a, b) => b.montant * b.occurrences - a.montant * a.occurrences);

  const evolutionJournaliere = Array.from(evoMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Pistes d'économies — heuristiques simples
  const pistes: PisteEconomie[] = [];

  if (totalCredit > 0) {
    const tauxEpargne = ((totalCredit - totalDebit) / totalCredit) * 100;
    if (tauxEpargne < 0) {
      pistes.push({
        titre: "Solde négatif sur la période",
        description: `Tes dépenses dépassent tes revenus de ${(totalDebit - totalCredit).toFixed(2)} €. Identifie 1 ou 2 postes à réduire en priorité.`,
        niveau: "fort",
      });
    } else if (tauxEpargne < 10) {
      pistes.push({
        titre: "Taux d'épargne faible",
        description: `Tu épargnes ${tauxEpargne.toFixed(1)}% de tes revenus. L'objectif sain est ≥ 10-15%.`,
        niveau: "moyen",
      });
    }
  }

  // Top catégorie : si elle représente >35% des dépenses
  if (parCategorie.length > 0 && totalDebit > 0) {
    const top = parCategorie[0];
    const pct = (top.total / totalDebit) * 100;
    if (pct > 35) {
      pistes.push({
        titre: `${top.categorie} = ${pct.toFixed(0)}% de tes dépenses`,
        description: `${top.nbOperations} opérations pour ${top.total.toFixed(2)} €. Vois si certaines sont compressibles.`,
        gainEstime: top.total * 0.15,
        niveau: pct > 50 ? "fort" : "moyen",
      });
    }
  }

  // Restau/bar/loisirs
  const loisirsKeys = ["Restaurant", "Restauration rapide", "Bar", "Video, Musique et jeux"];
  let totalLoisirs = 0;
  for (const cat of parCategorie) {
    if (
      loisirsKeys.some((k) => cat.categorie.toLowerCase().includes(k.toLowerCase())) ||
      cat.categorie.toLowerCase().includes("loisir")
    ) {
      totalLoisirs += cat.total;
    }
  }
  if (totalDebit > 0 && totalLoisirs / totalDebit > 0.15) {
    pistes.push({
      titre: "Sorties / loisirs élevés",
      description: `${totalLoisirs.toFixed(2)} € sur la période (${((totalLoisirs / totalDebit) * 100).toFixed(0)}% du total). Essaie de plafonner ce poste.`,
      gainEstime: totalLoisirs * 0.25,
      niveau: "moyen",
    });
  }

  // Abonnements
  const totalAbo = abonnementsSuspects.reduce((s, a) => s + a.montant * a.occurrences, 0);
  if (abonnementsSuspects.length >= 2 && totalAbo > 30) {
    pistes.push({
      titre: `${abonnementsSuspects.length} abonnements / dépenses récurrentes détectés`,
      description: `Total estimé : ${totalAbo.toFixed(2)} €. Fais le tri sur ceux que tu n'utilises plus.`,
      gainEstime: totalAbo * 0.3,
      niveau: "info",
    });
  }

  // Petites dépenses fréquentes
  const petites = depenses.filter((d) => d.montant <= 5).length;
  if (petites >= 8) {
    pistes.push({
      titre: `${petites} petites dépenses (≤ 5 €)`,
      description:
        "Les micro-achats s'accumulent vite. Regroupe tes courses pour limiter les passages multiples.",
      niveau: "info",
    });
  }

  if (pistes.length === 0) {
    pistes.push({
      titre: "Bonne gestion sur ce rapport",
      description: "Rien d'alarmant détecté. Continue comme ça.",
      niveau: "info",
    });
  }

  return {
    totalDebit,
    totalCredit,
    solde: totalCredit - totalDebit,
    parCategorie,
    topDepenses,
    abonnementsSuspects: abonnementsSuspects.slice(0, 8),
    pistesEconomie: pistes,
    evolutionJournaliere,
  };
}
