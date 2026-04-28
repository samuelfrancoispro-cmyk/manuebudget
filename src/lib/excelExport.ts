import * as XLSX from "xlsx";
import type { RapportCSV, RapportLigne } from "@/types";
import type { AnalyseRapport } from "./analytics";

export function exporterRapportExcel(
  rapport: RapportCSV,
  lignes: RapportLigne[],
  analyse: AnalyseRapport,
  nomCompte: string | undefined
) {
  const wb = XLSX.utils.book_new();

  const synthese: (string | number)[][] = [
    ["Rapport", rapport.nom],
    ["Compte", nomCompte ?? "—"],
    ["Mois", rapport.mois],
    ["Date import", new Date(rapport.dateImport).toLocaleString("fr-FR")],
    ["Fichier source", rapport.fichierNom ?? "—"],
    [],
    ["Total débits", -analyse.totalDebit],
    ["Total crédits", analyse.totalCredit],
    ["Solde net", analyse.solde],
    ["Nb opérations", lignes.length],
  ];
  const wsSynthese = XLSX.utils.aoa_to_sheet(synthese);
  wsSynthese["!cols"] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSynthese, "Synthèse");

  const txData = [
    ["Date", "Libellé", "Catégorie", "Sous-catégorie", "Type opération", "Montant"],
    ...lignes
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => [
        l.date,
        l.libelle,
        l.categorie ?? "",
        l.sousCategorie ?? "",
        l.typeOperation ?? "",
        l.montant,
      ]),
  ];
  const wsTx = XLSX.utils.aoa_to_sheet(txData);
  wsTx["!cols"] = [
    { wch: 12 }, { wch: 36 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, "Transactions");

  const catData = [
    ["Catégorie", "Total dépensé", "Nb opérations", "% du total"],
    ...analyse.parCategorie.map((c) => [
      c.categorie,
      c.total,
      c.nbOperations,
      analyse.totalDebit > 0 ? (c.total / analyse.totalDebit) * 100 : 0,
    ]),
  ];
  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  wsCat["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsCat, "Catégories");

  const topData = [
    ["Date", "Libellé", "Catégorie", "Montant"],
    ...analyse.topDepenses.map((t) => [t.date, t.libelle, t.categorie ?? "", t.montant]),
  ];
  const wsTop = XLSX.utils.aoa_to_sheet(topData);
  wsTop["!cols"] = [{ wch: 12 }, { wch: 36 }, { wch: 22 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsTop, "Top dépenses");

  const pistesData = [
    ["Niveau", "Titre", "Description", "Gain estimé"],
    ...analyse.pistesEconomie.map((p) => [
      p.niveau,
      p.titre,
      p.description,
      p.gainEstime ?? "",
    ]),
  ];
  const wsPistes = XLSX.utils.aoa_to_sheet(pistesData);
  wsPistes["!cols"] = [{ wch: 10 }, { wch: 32 }, { wch: 60 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsPistes, "Pistes éco");

  const fileName = `${rapport.nom.replace(/[^a-z0-9_-]+/gi, "_")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
