import { useMemo, useRef, useState } from "react";
import { Upload, Trash2, FileText, Loader2, Settings2, Database } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";
import RapportAnalytique from "@/components/RapportAnalytique";
import ImportMappingDialog from "@/components/ImportMappingDialog";
import { EmptyState } from "@/components/brand";
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
import {
  detectCsv,
  parseCsvWithMapping,
  type CsvMapping,
  type DetectionResult,
} from "@/lib/csvParser";
import type { BankProfile } from "@/types";
import { formatEUR, monthLabel } from "@/lib/utils";
import { UpgradeBadge } from "@/components/gate/UpgradeBadge";

const CONFIDENCE_OK = 0.8;

export default function Rapports() {
  const { t } = useTranslation();
  const {
    rapports,
    rapportLignes,
    comptesCourants,
    addRapport,
    deleteRapport,
    bankProfiles,
    saveBankProfile,
    deleteBankProfile,
  } = useStore();

  const [importOpen, setImportOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingMapping, setPendingMapping] = useState<CsvMapping | null>(null);
  const [matchedProfileName, setMatchedProfileName] = useState<string | null>(null);

  const [pendingNom, setPendingNom] = useState("");
  const [pendingCompteId, setPendingCompteId] = useState<string>("");
  const [pendingMois, setPendingMois] = useState("");
  const [pendingPreview, setPendingPreview] = useState<{
    nbLignes: number;
    debit: number;
    credit: number;
  } | null>(null);
  const [pendingLignes, setPendingLignes] = useState<
    ReturnType<typeof parseCsvWithMapping>["lignes"]
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

  function applyMappingToImportPreview(
    file: File,
    det: DetectionResult,
    mapping: CsvMapping,
    profileName: string | null
  ) {
    const result = parseCsvWithMapping(det.text, mapping);
    if (result.lignes.length === 0) {
      toast.error("Aucune ligne valide avec ce mapping", {
        description: result.warnings.join(" • ") || "Réajuste les colonnes.",
      });
      return false;
    }

    let debit = 0;
    let credit = 0;
    for (const l of result.lignes) {
      if (l.montant < 0) debit += -l.montant;
      else credit += l.montant;
    }

    setPendingFile(file);
    setPendingMapping(mapping);
    setPendingLignes(result.lignes);
    setPendingMois(result.moisDetecte);
    setPendingNom(`Rapport ${monthLabel(result.moisDetecte)}`);
    setPendingCompteId(comptesCourants[0]?.id ?? "");
    setPendingPreview({
      nbLignes: result.lignes.length,
      debit,
      credit,
    });
    setMatchedProfileName(profileName);
    setImportOpen(true);

    if (result.warnings.length) {
      toast.warning("Avertissements à l'import", {
        description: result.warnings.slice(0, 2).join(" • "),
      });
    }
    return true;
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const det = await detectCsv(file);
      setDetection(det);
      setPendingFile(file);

      // 1. Match profil sauvegardé ?
      const profile = bankProfiles.find((p) => p.fingerprint === det.fingerprint) ?? null;
      if (profile) {
        const ok = applyMappingToImportPreview(file, det, profile.mapping as CsvMapping, profile.nom);
        if (ok) {
          toast.success(`Format reconnu : ${profile.nom}`, {
            description: "Import via profil sauvegardé.",
          });
          return;
        }
      }

      // 2. Détection auto suffisante ?
      if (det.confidence >= CONFIDENCE_OK) {
        const ok = applyMappingToImportPreview(file, det, det.mapping, null);
        if (ok) return;
      }

      // 3. Fallback : ouvrir le dialog de mapping manuel
      toast.info("Format inconnu — ajuste le mapping", {
        description: "Sauvegarde-le ensuite pour les prochains imports.",
      });
      setMappingOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Échec de la lecture du fichier");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleMappingConfirm(mapping: CsvMapping, saveAs: string | null) {
    if (!detection || !pendingFile) return;
    const ok = applyMappingToImportPreview(pendingFile, detection, mapping, saveAs);
    if (!ok) return;

    if (saveAs) {
      try {
        await saveBankProfile({
          nom: saveAs,
          fingerprint: detection.fingerprint,
          mapping,
        });
        toast.success(`Profil "${saveAs}" sauvegardé`);
      } catch (err: any) {
        console.error(err);
        toast.error("Échec sauvegarde profil", {
          description: err?.message ?? "Vérifie le SQL Supabase (table bank_profiles).",
        });
      }
    }
    setMappingOpen(false);
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

  function reopenMappingFromPreview() {
    setImportOpen(false);
    setMappingOpen(true);
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
        title={t("reports.title")}
        description={t("reports.description")}
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
            <Button variant="outline" onClick={() => setProfilesOpen(true)} title="Profils de banque">
              <Database className="h-4 w-4" />
              Profils
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4" />
                Importer CSV
              </Button>
              <UpgradeBadge featureKey="import_csv" />
            </div>
            <div className="flex items-center gap-2">
              <UpgradeBadge featureKey="export_excel" />
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv,text/plain"
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
              <div className="px-4 py-8 text-center text-sm text-ink-muted">
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
                            ? "border-ink bg-ink/5"
                            : "border-transparent hover:bg-surface"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                              <span className="truncate font-medium">{r.nom}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
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
                            className="rounded p-1 text-ink-muted opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-950"
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
              <CardContent className="py-16">
                <EmptyState
                  title="Sélectionne un rapport"
                  description="Ou importe un nouveau CSV pour démarrer l'analyse."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal mapping manuel */}
      <ImportMappingDialog
        open={mappingOpen}
        onOpenChange={setMappingOpen}
        detection={detection}
        onConfirm={handleMappingConfirm}
        defaultProfileName={matchedProfileName ?? undefined}
      />

      {/* Modal preview + saisie nom rapport */}
      <Dialog open={importOpen} onOpenChange={(o) => !importing && setImportOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importer le rapport</DialogTitle>
            <DialogDescription>
              Vérifie les infos avant enregistrement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {pendingPreview && (
              <div className="rounded-md border bg-surface/50 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{pendingFile?.name}</div>
                  {matchedProfileName && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      <Database className="h-2.5 w-2.5 mr-1" />
                      {matchedProfileName}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-ink-muted">
                  {pendingPreview.nbLignes} opérations • Débits −
                  {formatEUR(pendingPreview.debit)} • Crédits +
                  {formatEUR(pendingPreview.credit)}
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1 text-xs"
                  onClick={reopenMappingFromPreview}
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  Ajuster le mapping
                </Button>
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
              <p className="text-xs text-ink-muted">
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

      {/* Gestion des profils */}
      <ProfilesDialog
        open={profilesOpen}
        onOpenChange={setProfilesOpen}
        profiles={bankProfiles}
        onDelete={async (id) => {
          if (!confirm("Supprimer ce profil ?")) return;
          try {
            await deleteBankProfile(id);
            toast.success("Profil supprimé");
          } catch (err: any) {
            toast.error("Échec suppression", { description: err?.message });
          }
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function ProfilesDialog({
  open,
  onOpenChange,
  profiles,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  profiles: BankProfile[];
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profils de banque</DialogTitle>
          <DialogDescription>
            Mappings sauvegardés sur ton compte. Un CSV avec les mêmes colonnes sera reconnu automatiquement.
          </DialogDescription>
        </DialogHeader>

        {profiles.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink-muted">
            Aucun profil enregistré.
            <br />
            Importe un CSV et coche « Sauvegarder comme profil ».
          </div>
        ) : (
          <ul className="space-y-2">
            {profiles.map((p) => {
              const m = p.mapping as CsvMapping;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{p.nom}</div>
                    <div className="text-xs text-ink-muted">
                      {m.amountStrategy === "debit_credit" ? "Débit/Crédit séparés" : "Montant signé"}
                      {" • "}
                      {m.dateFormat}
                      {" • "}
                      sép. <code className="text-[10px]">{m.delimiter === "\t" ? "\\t" : m.delimiter}</code>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
