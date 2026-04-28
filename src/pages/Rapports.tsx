import { useMemo, useRef, useState } from "react";
import { Upload, Trash2, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import RapportAnalytique from "@/components/RapportAnalytique";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { parseCsvBanque } from "@/lib/csvParser";
import { formatEUR, monthLabel } from "@/lib/utils";

export default function Rapports() {
  const {
    rapports,
    rapportLignes,
    comptesCourants,
    addRapport,
    deleteRapport,
  } = useStore();

  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingNom, setPendingNom] = useState("");
  const [pendingCompteId, setPendingCompteId] = useState<string>("");
  const [pendingMois, setPendingMois] = useState("");
  const [pendingPreview, setPendingPreview] = useState<{
    nbLignes: number;
    debit: number;
    credit: number;
  } | null>(null);
  const [pendingLignes, setPendingLignes] = useState<
    Awaited<ReturnType<typeof parseCsvBanque>>["lignes"]
  >([]);

  const [filtreCompte, setFiltreCompte] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  const rapportsFiltres = useMemo(() => {
    return rapports.filter((r) =>
      filtreCompte === "all" ? true : r.compteCourantId === filtreCompte
    );
  }, [rapports, filtreCompte]);

  const selected = rapports.find((r) => r.id === selectedId);
  const lignesSelected = useMemo(
    () => rapportLignes.filter((l) => l.rapportId === selectedId),
    [rapportLignes, selectedId]
  );
  const compteSelected = comptesCourants.find(
    (c) => c.id === selected?.compteCourantId
  );

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseCsvBanque(file);
      if (result.lignes.length === 0) {
        toast.error("Aucune ligne valide dans ce fichier", {
          description: result.warnings.join(" • ") || "Vérifie le format du CSV.",
        });
        if (fileInput.current) fileInput.current.value = "";
        return;
      }

      let debit = 0;
      let credit = 0;
      for (const l of result.lignes) {
        if (l.montant < 0) debit += -l.montant;
        else credit += l.montant;
      }

      setPendingFile(file);
      setPendingLignes(result.lignes);
      setPendingMois(result.moisDetecte);
      setPendingNom(`Rapport ${monthLabel(result.moisDetecte)}`);
      setPendingCompteId(comptesCourants[0]?.id ?? "");
      setPendingPreview({
        nbLignes: result.lignes.length,
        debit,
        credit,
      });
      setImportOpen(true);

      if (result.warnings.length) {
        toast.warning("Avertissements à l'import", {
          description: result.warnings.slice(0, 2).join(" • "),
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Échec de la lecture du fichier");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function confirmerImport() {
    if (!pendingFile || pendingLignes.length === 0) return;
    setImporting(true);
    try {
      const newRap = await addRapport(
        {
          compteCourantId: pendingCompteId || undefined,
          nom: pendingNom.trim() || `Rapport ${monthLabel(pendingMois)}`,
          mois: pendingMois,
          fichierNom: pendingFile.name,
        },
        pendingLignes
      );
      toast.success("Rapport importé", {
        description: `${pendingLignes.length} opérations ajoutées.`,
      });
      setImportOpen(false);
      setPendingFile(null);
      setPendingLignes([]);
      setPendingPreview(null);
      setSelectedId(newRap.id);
    } catch (err: any) {
      console.error(err);
      toast.error("Échec de l'enregistrement", {
        description: err?.message ?? "Vérifie que le SQL Supabase a bien été exécuté.",
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer définitivement ce rapport ?")) return;
    try {
      await deleteRapport(id);
      toast.success("Rapport supprimé");
      if (selectedId === id) setSelectedId(null);
    } catch (err: any) {
      toast.error("Échec de la suppression", { description: err?.message });
    }
  }

  return (
    <>
      <PageHeader
        title="Rapports CSV"
        description="Importe un relevé de compte CSV et explore tes dépenses : camembert, top postes, pistes d'économies."
        action={
          <div className="flex gap-2">
            <Select value={filtreCompte} onValueChange={setFiltreCompte}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                {comptesCourants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => fileInput.current?.click()}>
              <Upload className="h-4 w-4" />
              Importer CSV
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChosen}
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
            <CardDescription>
              {rapportsFiltres.length} rapport{rapportsFiltres.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            {rapportsFiltres.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun rapport. Clique sur « Importer CSV » pour commencer.
              </div>
            ) : (
              <ul className="space-y-1">
                {rapportsFiltres.map((r) => {
                  const compte = comptesCourants.find((c) => c.id === r.compteCourantId);
                  const active = r.id === selectedId;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className={`group w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate font-medium">{r.nom}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px]">
                                {monthLabel(r.mois)}
                              </Badge>
                              {compte && (
                                <Badge variant="outline" className="text-[10px]">
                                  {compte.nom}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 text-xs">
                              <span className="text-rose-600">
                                −{formatEUR(r.totalDebit)}
                              </span>
                              {" / "}
                              <span className="text-emerald-600">
                                +{formatEUR(r.totalCredit)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(r.id);
                            }}
                            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-950"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div>
          {selected ? (
            <RapportAnalytique
              rapport={selected}
              lignes={lignesSelected}
              compte={compteSelected}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileSpreadsheet className="mb-3 h-10 w-10 text-muted-foreground" />
                <div className="text-base font-medium">Sélectionne un rapport</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Ou importe un nouveau CSV pour démarrer l'analyse.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal import */}
      <Dialog open={importOpen} onOpenChange={(o) => !importing && setImportOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importer le rapport</DialogTitle>
            <DialogDescription>
              Vérifie les infos avant enregistrement. Le rapport restera dans
              l'historique tant que tu ne le supprimes pas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {pendingPreview && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="font-medium">{pendingFile?.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {pendingPreview.nbLignes} opérations • Débits −
                  {formatEUR(pendingPreview.debit)} • Crédits +
                  {formatEUR(pendingPreview.credit)}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="rap-nom">Nom du rapport</Label>
              <Input
                id="rap-nom"
                value={pendingNom}
                onChange={(e) => setPendingNom(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mois</Label>
              <Input
                value={pendingMois}
                onChange={(e) => setPendingMois(e.target.value)}
                placeholder="2026-04"
              />
              <p className="text-xs text-muted-foreground">
                Format : YYYY-MM (détecté automatiquement)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Compte courant</Label>
              <Select
                value={pendingCompteId || "none"}
                onValueChange={(v) => setPendingCompteId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sans compte rattaché</SelectItem>
                  {comptesCourants.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setImportOpen(false)}
              disabled={importing}
            >
              Annuler
            </Button>
            <Button onClick={confirmerImport} disabled={importing}>
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
