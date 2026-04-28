import Papa from "papaparse";
import type { RapportLigne } from "@/types";

export interface CsvParseResult {
  lignes: Omit<RapportLigne, "id" | "rapportId">[];
  moisDetecte: string;
  warnings: string[];
}

/** Lit un fichier en essayant UTF-8 puis fallback windows-1252. */
async function readFileSmart(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  if (utf8.includes("\uFFFD")) {
    return new TextDecoder("windows-1252").decode(buf);
  }
  return utf8;
}

function parseDateFR(s: string): string | null {
  const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseMontantFR(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pick(row: Record<string, string>, candidates: string[]): string | undefined {
  for (const c of candidates) {
    const k = normalizeKey(c);
    if (row[k] != null && row[k] !== "") return row[k];
  }
  return undefined;
}

export async function parseCsvBanque(file: File): Promise<CsvParseResult> {
  const text = await readFileSmart(file);
  const warnings: string[] = [];

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: ";",
    transformHeader: (h) => normalizeKey(h),
  });

  if (parsed.errors.length) {
    parsed.errors.slice(0, 3).forEach((e) =>
      warnings.push(`Ligne ${e.row}: ${e.message}`)
    );
  }

  const lignes: Omit<RapportLigne, "id" | "rapportId">[] = [];
  const compteurMois = new Map<string, number>();

  for (const row of parsed.data) {
    if (!row || typeof row !== "object") continue;

    const dateStr =
      pick(row, ["Date operation", "Date d'operation", "Date de comptabilisation"]) ?? "";
    const date = parseDateFR(dateStr);
    if (!date) continue;

    const debitStr = pick(row, ["Debit"]) ?? "";
    const creditStr = pick(row, ["Credit"]) ?? "";
    const debit = parseMontantFR(debitStr);
    const credit = parseMontantFR(creditStr);
    const montant = debit !== 0 ? debit : credit;
    if (montant === 0) continue;

    const libelle =
      pick(row, ["Libelle simplifie", "Libelle"]) ??
      pick(row, ["Libelle operation"]) ??
      "Opération";

    lignes.push({
      date,
      libelle,
      libelleOperation: pick(row, ["Libelle operation"]),
      infosComplementaires: pick(row, ["Informations complementaires"]),
      typeOperation: pick(row, ["Type operation"]),
      categorie: pick(row, ["Categorie"]),
      sousCategorie: pick(row, ["Sous categorie"]),
      montant,
    });

    const mk = date.slice(0, 7);
    compteurMois.set(mk, (compteurMois.get(mk) ?? 0) + 1);
  }

  // Mois dominant = mois le plus représenté
  let moisDetecte = new Date().toISOString().slice(0, 7);
  let max = 0;
  for (const [k, v] of compteurMois.entries()) {
    if (v > max) {
      max = v;
      moisDetecte = k;
    }
  }

  if (lignes.length === 0) {
    warnings.push(
      "Aucune ligne valide détectée. Vérifie le séparateur (;) et la présence des colonnes Date / Débit / Crédit."
    );
  }

  return { lignes, moisDetecte, warnings };
}
