import Papa from "papaparse";
import type { RapportLigne } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// Types publics
// ──────────────────────────────────────────────────────────────────────────────

export type DateFormat =
  | "DD/MM/YYYY"
  | "DD-MM-YYYY"
  | "DD.MM.YYYY"
  | "YYYY-MM-DD"
  | "YYYY/MM/DD"
  | "MM/DD/YYYY";

export type AmountFormat = "fr" | "us";
export type AmountStrategy = "single" | "debit_credit";

export interface CsvMapping {
  delimiter: string;
  skipLines: number;
  dateIndex: number;
  dateFormat: DateFormat;
  amountStrategy: AmountStrategy;
  amountIndex?: number;
  debitIndex?: number;
  creditIndex?: number;
  amountFormat: AmountFormat;
  /** Si true et single : on inverse le signe (CSV où débit = positif). */
  invertSign?: boolean;
  libelleIndex: number;
  libelleOperationIndex?: number;
  infosIndex?: number;
  typeIndex?: number;
  categorieIndex?: number;
  sousCategorieIndex?: number;
}

export interface DetectionResult {
  /** Texte du fichier décodé (UTF-8 ou Windows-1252). */
  text: string;
  /** En-têtes détectés (vide si pas de header reconnu). */
  headers: string[];
  /** Aperçu des premières lignes data (jusqu'à 10). */
  preview: string[][];
  /** Mapping deviné. */
  mapping: CsvMapping;
  /** Confiance 0..1 — < 0.8 → afficher dialog mapping. */
  confidence: number;
  warnings: string[];
  /** Empreinte des headers pour matcher un profil. */
  fingerprint: string;
}

export interface CsvParseResult {
  lignes: Omit<RapportLigne, "id" | "rapportId">[];
  moisDetecte: string;
  warnings: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Lecture / décodage
// ──────────────────────────────────────────────────────────────────────────────

async function readFileSmart(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  if (utf8.includes("\uFFFD")) {
    return new TextDecoder("windows-1252").decode(buf);
  }
  return utf8;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers normalisation
// ──────────────────────────────────────────────────────────────────────────────

function normalizeKey(s: string): string {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ──────────────────────────────────────────────────────────────────────────────
// Détection séparateur
// ──────────────────────────────────────────────────────────────────────────────

function detectDelimiter(text: string): string {
  const candidates = [";", ",", "\t", "|"];
  const sample = text.split(/\r?\n/).slice(0, 20).filter((l) => l.trim().length);
  if (sample.length === 0) return ";";

  let best = ";";
  let bestScore = -1;
  for (const c of candidates) {
    const counts = sample.map((l) => (l.match(new RegExp(`\\${c === "\t" ? "t" : c}`, "g")) ?? []).length);
    // score = médiane × constance (faible variance = bon)
    const sorted = [...counts].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median === 0) continue;
    const variance =
      counts.reduce((acc, n) => acc + Math.abs(n - median), 0) / counts.length;
    const score = median - variance;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

// ──────────────────────────────────────────────────────────────────────────────
// Détection lignes parasites en tête (titres banque, lignes vides…)
// ──────────────────────────────────────────────────────────────────────────────

function detectHeaderRowIndex(rows: string[][], delimiter: string): number {
  // Heuristique : on cherche la première ligne qui :
  // - a au moins 3 colonnes
  // - contient des mots-clés métier (date, libelle, montant, debit, credit, amount, description)
  const KEYWORDS = [
    "date",
    "libelle",
    "libell",
    "description",
    "montant",
    "amount",
    "debit",
    "credit",
    "operation",
    "valeur",
  ];
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;
    const normalized = row.map((c) => normalizeKey(c));
    const score = normalized.reduce(
      (acc, c) => acc + (KEYWORDS.some((k) => c.includes(k)) ? 1 : 0),
      0
    );
    if (score >= 2) return i;
  }
  void delimiter;
  return 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// Détection rôles colonnes par mots-clés
// ──────────────────────────────────────────────────────────────────────────────

const ROLE_KEYWORDS: Record<string, string[]> = {
  date: ["date_operation", "date_d_operation", "date_comptabilisation", "date_valeur", "date", "operation_date", "transaction_date"],
  libelle: ["libelle_simplifie", "libelle", "description", "objet", "narrative", "details", "designation", "wording"],
  libelleOp: ["libelle_operation", "operation"],
  infos: ["informations_complementaires", "info", "infos", "reference", "note", "comment", "memo"],
  type: ["type_operation", "type", "category_type", "operation_type"],
  categorie: ["categorie", "category"],
  sousCategorie: ["sous_categorie", "sub_category", "subcategory"],
  debit: ["debit", "debits", "withdrawal", "sortie", "depense"],
  credit: ["credit", "credits", "deposit", "entree", "recette"],
  amount: ["montant", "amount", "value", "somme", "valeur"],
};

function findIndex(headers: string[], keys: string[]): number {
  for (const k of keys) {
    const idx = headers.findIndex((h) => h === k);
    if (idx >= 0) return idx;
  }
  // contains-match
  for (const k of keys) {
    const idx = headers.findIndex((h) => h.includes(k));
    if (idx >= 0) return idx;
  }
  return -1;
}

// ──────────────────────────────────────────────────────────────────────────────
// Détection format date
// ──────────────────────────────────────────────────────────────────────────────

const DATE_PATTERNS: { fmt: DateFormat; re: RegExp }[] = [
  { fmt: "DD/MM/YYYY", re: /^(\d{2})\/(\d{2})\/(\d{4})$/ },
  { fmt: "DD-MM-YYYY", re: /^(\d{2})-(\d{2})-(\d{4})$/ },
  { fmt: "DD.MM.YYYY", re: /^(\d{2})\.(\d{2})\.(\d{4})$/ },
  { fmt: "YYYY-MM-DD", re: /^(\d{4})-(\d{2})-(\d{2})$/ },
  { fmt: "YYYY/MM/DD", re: /^(\d{4})\/(\d{2})\/(\d{2})$/ },
  { fmt: "MM/DD/YYYY", re: /^(\d{2})\/(\d{2})\/(\d{4})$/ }, // ambigu avec DD/MM
];

function detectDateFormat(samples: string[]): DateFormat {
  const trimmed = samples.map((s) => (s ?? "").trim()).filter(Boolean);
  if (trimmed.length === 0) return "DD/MM/YYYY";

  // priorité : YYYY-XX-XX (non ambigu)
  if (trimmed.every((s) => DATE_PATTERNS[3].re.test(s))) return "YYYY-MM-DD";
  if (trimmed.every((s) => DATE_PATTERNS[4].re.test(s))) return "YYYY/MM/DD";

  // DD/MM ou MM/DD ? on vérifie si 1er composant > 12 → DD
  const slashHits = trimmed.filter((s) => /^(\d{2})\/(\d{2})\/(\d{4})$/.test(s));
  if (slashHits.length) {
    const allDDfirst = slashHits.every((s) => {
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)!;
      return parseInt(m[1], 10) > 12;
    });
    const anyMMfirst = slashHits.some((s) => {
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)!;
      return parseInt(m[2], 10) > 12;
    });
    if (anyMMfirst) return "MM/DD/YYYY";
    if (allDDfirst) return "DD/MM/YYYY";
    return "DD/MM/YYYY"; // défaut FR
  }

  if (trimmed.every((s) => DATE_PATTERNS[1].re.test(s))) return "DD-MM-YYYY";
  if (trimmed.every((s) => DATE_PATTERNS[2].re.test(s))) return "DD.MM.YYYY";

  return "DD/MM/YYYY";
}

export function parseDateWithFormat(s: string, fmt: DateFormat): string | null {
  const t = (s ?? "").trim();
  if (!t) return null;
  const pat = DATE_PATTERNS.find((p) => p.fmt === fmt);
  if (!pat) return null;
  const m = t.match(pat.re);
  if (!m) return null;
  let y: string, mo: string, d: string;
  switch (fmt) {
    case "DD/MM/YYYY":
    case "DD-MM-YYYY":
    case "DD.MM.YYYY":
      d = m[1]; mo = m[2]; y = m[3]; break;
    case "MM/DD/YYYY":
      mo = m[1]; d = m[2]; y = m[3]; break;
    case "YYYY-MM-DD":
    case "YYYY/MM/DD":
      y = m[1]; mo = m[2]; d = m[3]; break;
  }
  return `${y}-${mo}-${d}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Détection format montant
// ──────────────────────────────────────────────────────────────────────────────

function detectAmountFormat(samples: string[]): AmountFormat {
  const t = samples.map((s) => (s ?? "").trim()).filter(Boolean);
  if (t.length === 0) return "fr";

  // FR : décimale = ',', millier = ' ' ou '.'  (ex: "1 234,56", "1.234,56")
  // US : décimale = '.', millier = ','         (ex: "1,234.56")
  let frScore = 0;
  let usScore = 0;
  for (const s of t) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma >= 0 && lastDot >= 0) {
      if (lastComma > lastDot) frScore++;
      else usScore++;
    } else if (lastComma >= 0) {
      // si une seule virgule et 2 chiffres après → FR très probable
      if (/,\d{1,2}$/.test(s)) frScore++;
      else usScore++;
    } else if (lastDot >= 0) {
      if (/\.\d{1,2}$/.test(s)) usScore++;
    }
  }
  return frScore >= usScore ? "fr" : "us";
}

export function parseAmountWithFormat(s: string, fmt: AmountFormat): number {
  if (s == null) return 0;
  let str = String(s).trim();
  if (!str) return 0;

  // gérer les parenthèses (négatif comptable)
  let negParen = false;
  if (/^\(.*\)$/.test(str)) {
    negParen = true;
    str = str.slice(1, -1);
  }

  // retire espaces + caractères non numériques superflus (€, $, etc.)
  str = str.replace(/[\s\u00A0\u202F€$£]/g, "");

  if (fmt === "fr") {
    // retire séparateurs de milliers (.) ; remplace , décimal par .
    // ATTENTION : si plusieurs ',' ce n'est pas FR — on tente quand même
    str = str.replace(/\.(?=\d{3}(\D|$))/g, ""); // retire . si 3 chiffres après
    str = str.replace(",", ".");
  } else {
    // US : retire ',' de milliers
    str = str.replace(/,/g, "");
  }

  const n = Number(str);
  if (!Number.isFinite(n)) return 0;
  return negParen ? -n : n;
}

// ──────────────────────────────────────────────────────────────────────────────
// Fingerprint pour matcher un profil sauvegardé
// ──────────────────────────────────────────────────────────────────────────────

export function computeFingerprint(headers: string[]): string {
  const norm = headers
    .map((h) => normalizeKey(h))
    .filter(Boolean)
    .sort()
    .join("|");
  // hash simple — pas crypto mais suffisant
  let h = 0;
  for (let i = 0; i < norm.length; i++) {
    h = (h * 31 + norm.charCodeAt(i)) | 0;
  }
  return `fp_${(h >>> 0).toString(36)}_${norm.length}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Détection complète
// ──────────────────────────────────────────────────────────────────────────────

export async function detectCsv(file: File): Promise<DetectionResult> {
  const text = await readFileSmart(file);
  const warnings: string[] = [];

  const delimiter = detectDelimiter(text);

  // parse brut sans header (on gère skipLines manuellement)
  const parsedRaw = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    delimiter,
  });

  const rows: string[][] = (parsedRaw.data as string[][]).filter(
    (r) => Array.isArray(r) && r.some((c) => (c ?? "").toString().trim().length > 0)
  );

  if (rows.length === 0) {
    return {
      text,
      headers: [],
      preview: [],
      mapping: {
        delimiter,
        skipLines: 0,
        dateIndex: 0,
        dateFormat: "DD/MM/YYYY",
        amountStrategy: "single",
        amountFormat: "fr",
        libelleIndex: 1,
      },
      confidence: 0,
      warnings: ["Fichier vide ou illisible."],
      fingerprint: "",
    };
  }

  const headerIdx = detectHeaderRowIndex(rows, delimiter);
  const rawHeaders = rows[headerIdx] ?? [];
  const headers = rawHeaders.map((h) => normalizeKey(h));
  const dataRows = rows.slice(headerIdx + 1);

  // colonnes
  const dateIndex = findIndex(headers, ROLE_KEYWORDS.date);
  const libelleIndex = findIndex(headers, ROLE_KEYWORDS.libelle);
  const debitIndex = findIndex(headers, ROLE_KEYWORDS.debit);
  const creditIndex = findIndex(headers, ROLE_KEYWORDS.credit);
  const amountIndex = findIndex(headers, ROLE_KEYWORDS.amount);
  const libelleOpIndex = findIndex(headers, ROLE_KEYWORDS.libelleOp);
  const infosIndex = findIndex(headers, ROLE_KEYWORDS.infos);
  const typeIndex = findIndex(headers, ROLE_KEYWORDS.type);
  const categorieIndex = findIndex(headers, ROLE_KEYWORDS.categorie);
  const sousCategorieIndex = findIndex(headers, ROLE_KEYWORDS.sousCategorie);

  // stratégie montant
  let amountStrategy: AmountStrategy;
  let amountIdx: number | undefined;
  if (debitIndex >= 0 && creditIndex >= 0) {
    amountStrategy = "debit_credit";
  } else if (amountIndex >= 0) {
    amountStrategy = "single";
    amountIdx = amountIndex;
  } else {
    // fallback : on prend la première colonne numérique
    amountStrategy = "single";
    amountIdx = guessFirstNumericColumn(dataRows);
  }

  // samples date / montant
  const dateSamples = dateIndex >= 0 ? dataRows.slice(0, 20).map((r) => r[dateIndex] ?? "") : [];
  const dateFormat = detectDateFormat(dateSamples);

  const amountSamples =
    amountStrategy === "single" && amountIdx != null
      ? dataRows.slice(0, 20).map((r) => r[amountIdx!] ?? "")
      : debitIndex >= 0
      ? dataRows.slice(0, 20).map((r) => r[debitIndex] || r[creditIndex] || "")
      : [];
  const amountFormat = detectAmountFormat(amountSamples);

  // confiance
  let confidence = 0;
  if (dateIndex >= 0) confidence += 0.35;
  if (libelleIndex >= 0) confidence += 0.25;
  if (amountStrategy === "debit_credit" || amountIdx != null) confidence += 0.3;
  if (dateSamples.some((s) => parseDateWithFormat(s, dateFormat))) confidence += 0.1;
  confidence = Math.min(1, confidence);

  if (dateIndex < 0) warnings.push("Colonne date non identifiée automatiquement.");
  if (libelleIndex < 0) warnings.push("Colonne libellé non identifiée automatiquement.");
  if (amountStrategy === "single" && amountIdx == null)
    warnings.push("Aucune colonne montant trouvée.");

  const fingerprint = computeFingerprint(rawHeaders);

  const mapping: CsvMapping = {
    delimiter,
    skipLines: headerIdx, // on saute jusqu'au header (le header lui-même est consommé)
    dateIndex: Math.max(0, dateIndex),
    dateFormat,
    amountStrategy,
    amountIndex: amountIdx,
    debitIndex: debitIndex >= 0 ? debitIndex : undefined,
    creditIndex: creditIndex >= 0 ? creditIndex : undefined,
    amountFormat,
    libelleIndex: libelleIndex >= 0 ? libelleIndex : 0,
    libelleOperationIndex: libelleOpIndex >= 0 ? libelleOpIndex : undefined,
    infosIndex: infosIndex >= 0 ? infosIndex : undefined,
    typeIndex: typeIndex >= 0 ? typeIndex : undefined,
    categorieIndex: categorieIndex >= 0 ? categorieIndex : undefined,
    sousCategorieIndex: sousCategorieIndex >= 0 ? sousCategorieIndex : undefined,
  };

  return {
    text,
    headers: rawHeaders,
    preview: dataRows.slice(0, 10),
    mapping,
    confidence,
    warnings,
    fingerprint,
  };
}

function guessFirstNumericColumn(rows: string[][]): number | undefined {
  if (rows.length === 0) return undefined;
  const cols = rows[0].length;
  for (let c = 0; c < cols; c++) {
    let numCount = 0;
    for (const r of rows.slice(0, 10)) {
      const v = (r[c] ?? "").toString().trim();
      if (/^[+-]?[\d\s.,()]+$/.test(v) && /\d/.test(v)) numCount++;
    }
    if (numCount >= 3) return c;
  }
  return undefined;
}

// ──────────────────────────────────────────────────────────────────────────────
// Parsing avec mapping fourni
// ──────────────────────────────────────────────────────────────────────────────

export function parseCsvWithMapping(text: string, mapping: CsvMapping): CsvParseResult {
  const warnings: string[] = [];

  const parsed = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    delimiter: mapping.delimiter,
  });

  if (parsed.errors.length) {
    parsed.errors.slice(0, 3).forEach((e) =>
      warnings.push(`Ligne ${e.row}: ${e.message}`)
    );
  }

  const allRows: string[][] = (parsed.data as string[][]).filter(
    (r) => Array.isArray(r) && r.some((c) => (c ?? "").toString().trim().length > 0)
  );

  // skipLines = nombre de lignes à ignorer avant le header
  // header = ligne à index skipLines → on commence les data à skipLines + 1
  const dataRows = allRows.slice(mapping.skipLines + 1);

  const lignes: Omit<RapportLigne, "id" | "rapportId">[] = [];
  const compteurMois = new Map<string, number>();

  for (const row of dataRows) {
    if (!row) continue;

    const dateStr = row[mapping.dateIndex] ?? "";
    const date = parseDateWithFormat(dateStr, mapping.dateFormat);
    if (!date) continue;

    let montant = 0;
    if (mapping.amountStrategy === "debit_credit") {
      const debit = mapping.debitIndex != null
        ? parseAmountWithFormat(row[mapping.debitIndex] ?? "", mapping.amountFormat)
        : 0;
      const credit = mapping.creditIndex != null
        ? parseAmountWithFormat(row[mapping.creditIndex] ?? "", mapping.amountFormat)
        : 0;
      // dans la plupart des CSV banque FR : débit positif et crédit positif → on signe
      // si débit > 0 → dépense (négatif), si crédit > 0 → recette (positif)
      if (debit !== 0) montant = -Math.abs(debit);
      else if (credit !== 0) montant = Math.abs(credit);
    } else if (mapping.amountIndex != null) {
      const v = parseAmountWithFormat(row[mapping.amountIndex] ?? "", mapping.amountFormat);
      montant = mapping.invertSign ? -v : v;
    }
    if (montant === 0) continue;

    const libelle = (row[mapping.libelleIndex] ?? "").toString().trim() || "Opération";

    lignes.push({
      date,
      libelle,
      libelleOperation: mapping.libelleOperationIndex != null
        ? (row[mapping.libelleOperationIndex] ?? "").toString().trim() || undefined
        : undefined,
      infosComplementaires: mapping.infosIndex != null
        ? (row[mapping.infosIndex] ?? "").toString().trim() || undefined
        : undefined,
      typeOperation: mapping.typeIndex != null
        ? (row[mapping.typeIndex] ?? "").toString().trim() || undefined
        : undefined,
      categorie: mapping.categorieIndex != null
        ? (row[mapping.categorieIndex] ?? "").toString().trim() || undefined
        : undefined,
      sousCategorie: mapping.sousCategorieIndex != null
        ? (row[mapping.sousCategorieIndex] ?? "").toString().trim() || undefined
        : undefined,
      montant,
    });

    const mk = date.slice(0, 7);
    compteurMois.set(mk, (compteurMois.get(mk) ?? 0) + 1);
  }

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
      "Aucune ligne valide. Vérifie le mapping (date, libellé, montant) dans la fenêtre d'ajustement."
    );
  }

  return { lignes, moisDetecte, warnings };
}

// ──────────────────────────────────────────────────────────────────────────────
// Compat — ancienne fonction utilisée ailleurs
// ──────────────────────────────────────────────────────────────────────────────

export async function parseCsvBanque(file: File): Promise<CsvParseResult> {
  const det = await detectCsv(file);
  const res = parseCsvWithMapping(det.text, det.mapping);
  return {
    lignes: res.lignes,
    moisDetecte: res.moisDetecte,
    warnings: [...det.warnings, ...res.warnings],
  };
}
