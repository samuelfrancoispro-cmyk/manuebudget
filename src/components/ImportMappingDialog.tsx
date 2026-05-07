import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  AmountFormat,
  AmountStrategy,
  CsvMapping,
  DateFormat,
  DetectionResult,
} from "@/lib/csvParser";
import { parseCsvWithMapping } from "@/lib/csvParser";
import { formatEUR } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  detection: DetectionResult | null;
  onConfirm: (mapping: CsvMapping, saveAs: string | null) => void;
  /** Nom du profil pré-rempli si match auto. */
  defaultProfileName?: string;
}

const NONE = "__none__";

const DATE_FORMATS: DateFormat[] = [
  "DD/MM/YYYY",
  "DD-MM-YYYY",
  "DD.MM.YYYY",
  "YYYY-MM-DD",
  "YYYY/MM/DD",
  "MM/DD/YYYY",
];

const DELIMITERS = [
  { value: ";", label: "Point-virgule  ;" },
  { value: ",", label: "Virgule  ," },
  { value: "\t", label: "Tabulation  \\t" },
  { value: "|", label: "Pipe  |" },
];

export default function ImportMappingDialog({
  open,
  onOpenChange,
  detection,
  onConfirm,
  defaultProfileName,
}: Props) {
  const [mapping, setMapping] = useState<CsvMapping | null>(null);
  const [profileName, setProfileName] = useState("");
  const [saveProfileEnabled, setSaveProfileEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (detection) {
      setMapping({ ...detection.mapping });
      setProfileName(defaultProfileName ?? "");
      setSaveProfileEnabled(false);
    }
  }, [detection, defaultProfileName]);

  const colCount = useMemo(() => {
    if (!detection) return 0;
    return Math.max(
      detection.headers.length,
      ...(detection.preview.map((r) => r.length) as number[])
    );
  }, [detection]);

  const colOptions = useMemo(() => {
    const arr: { value: string; label: string }[] = [];
    for (let i = 0; i < colCount; i++) {
      const head = detection?.headers[i];
      arr.push({
        value: String(i),
        label: head ? `${i + 1}. ${head}` : `Colonne ${i + 1}`,
      });
    }
    return arr;
  }, [colCount, detection]);

  // re-parse en live pour preview
  const livePreview = useMemo(() => {
    if (!detection || !mapping) return null;
    try {
      return parseCsvWithMapping(detection.text, mapping);
    } catch {
      return null;
    }
  }, [detection, mapping]);

  if (!detection || !mapping) return null;

  function update<K extends keyof CsvMapping>(k: K, v: CsvMapping[K]) {
    setMapping((m) => (m ? { ...m, [k]: v } : m));
  }

  function indexValue(idx: number | undefined): string {
    return idx == null ? NONE : String(idx);
  }
  function parseIndex(v: string): number | undefined {
    return v === NONE ? undefined : parseInt(v, 10);
  }

  async function handleConfirm() {
    if (!mapping) return;
    setBusy(true);
    try {
      const saveAs = saveProfileEnabled && profileName.trim() ? profileName.trim() : null;
      onConfirm(mapping, saveAs);
    } finally {
      setBusy(false);
    }
  }

  const debit = livePreview
    ? livePreview.lignes.reduce((acc, l) => acc + (l.montant < 0 ? -l.montant : 0), 0)
    : 0;
  const credit = livePreview
    ? livePreview.lignes.reduce((acc, l) => acc + (l.montant > 0 ? l.montant : 0), 0)
    : 0;
  const previewOk = livePreview && livePreview.lignes.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajuster le mapping CSV</DialogTitle>
          <DialogDescription>
            Indique quelle colonne correspond à quoi. La détection auto a fait
            une suggestion — adapte si besoin. L'aperçu se met à jour en direct.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="mapping" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mapping">Colonnes</TabsTrigger>
            <TabsTrigger value="advanced">Format & avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="mapping" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Colonne Date *">
                <Select
                  value={String(mapping.dateIndex)}
                  onValueChange={(v) => update("dateIndex", parseInt(v, 10))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Colonne Libellé *">
                <Select
                  value={String(mapping.libelleIndex)}
                  onValueChange={(v) => update("libelleIndex", parseInt(v, 10))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Stratégie montant">
              <Select
                value={mapping.amountStrategy}
                onValueChange={(v) => update("amountStrategy", v as AmountStrategy)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit_credit">2 colonnes : Débit + Crédit séparées</SelectItem>
                  <SelectItem value="single">1 colonne : Montant signé (négatif = débit)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {mapping.amountStrategy === "debit_credit" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Colonne Débit">
                  <Select
                    value={indexValue(mapping.debitIndex)}
                    onValueChange={(v) => update("debitIndex", parseIndex(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— aucune —</SelectItem>
                      {colOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Colonne Crédit">
                  <Select
                    value={indexValue(mapping.creditIndex)}
                    onValueChange={(v) => update("creditIndex", parseIndex(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— aucune —</SelectItem>
                      {colOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ) : (
              <>
                <Field label="Colonne Montant">
                  <Select
                    value={indexValue(mapping.amountIndex)}
                    onValueChange={(v) => update("amountIndex", parseIndex(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— aucune —</SelectItem>
                      {colOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!mapping.invertSign}
                    onChange={(e) => update("invertSign", e.target.checked)}
                  />
                  Inverser le signe (CSV où débit = positif)
                </label>
              </>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Séparateur">
                <Select
                  value={mapping.delimiter}
                  onValueChange={(v) => update("delimiter", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DELIMITERS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Lignes à ignorer en haut">
                <Input
                  type="number"
                  min={0}
                  value={mapping.skipLines}
                  onChange={(e) => update("skipLines", Math.max(0, parseInt(e.target.value || "0", 10)))}
                />
              </Field>

              <Field label="Format date">
                <Select
                  value={mapping.dateFormat}
                  onValueChange={(v) => update("dateFormat", v as DateFormat)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Format montant">
                <Select
                  value={mapping.amountFormat}
                  onValueChange={(v) => update("amountFormat", v as AmountFormat)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">FR : 1 234,56</SelectItem>
                    <SelectItem value="us">US : 1,234.56</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Field label="Libellé secondaire (optionnel)">
                <ColSelect
                  value={mapping.libelleOperationIndex}
                  options={colOptions}
                  onChange={(v) => update("libelleOperationIndex", v)}
                />
              </Field>
              <Field label="Infos / référence (optionnel)">
                <ColSelect
                  value={mapping.infosIndex}
                  options={colOptions}
                  onChange={(v) => update("infosIndex", v)}
                />
              </Field>
              <Field label="Type opération (optionnel)">
                <ColSelect
                  value={mapping.typeIndex}
                  options={colOptions}
                  onChange={(v) => update("typeIndex", v)}
                />
              </Field>
              <Field label="Catégorie banque (optionnel)">
                <ColSelect
                  value={mapping.categorieIndex}
                  options={colOptions}
                  onChange={(v) => update("categorieIndex", v)}
                />
              </Field>
            </div>
          </TabsContent>
        </Tabs>

        {/* Aperçu */}
        <div className="rounded-md border bg-surface/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Aperçu</div>
            {previewOk ? (
              <div className="text-xs text-ink-muted">
                {livePreview!.lignes.length} ligne{livePreview!.lignes.length > 1 ? "s" : ""} •
                {" "}<span className="text-rose-600">−{formatEUR(debit)}</span>
                {" / "}
                <span className="text-emerald-600">+{formatEUR(credit)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" /> Aucune ligne valide avec ce mapping
              </div>
            )}
          </div>
          <div className="max-h-48 overflow-auto rounded border bg-paper">
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Libellé</th>
                  <th className="px-2 py-1 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {livePreview?.lignes.slice(0, 8).map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1 font-mono">{l.date}</td>
                    <td className="px-2 py-1 truncate max-w-[300px]">{l.libelle}</td>
                    <td className={`px-2 py-1 text-right font-mono ${l.montant < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {l.montant.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {!previewOk && (
                  <tr>
                    <td colSpan={3} className="px-2 py-3 text-center text-ink-muted">
                      Ajuste les colonnes pour voir l'aperçu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sauvegarde profil */}
        <div className="rounded-md border p-3 space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={saveProfileEnabled}
              onChange={(e) => setSaveProfileEnabled(e.target.checked)}
            />
            <Save className="h-3.5 w-3.5" />
            Sauvegarder ce mapping comme profil de banque
          </label>
          {saveProfileEnabled && (
            <Input
              placeholder='Nom du profil (ex : "BNP Paribas perso", "Boursorama")'
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          )}
          <p className="text-xs text-ink-muted">
            Le prochain CSV avec les mêmes colonnes sera importé automatiquement.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={busy || !previewOk}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Continuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ColSelect({
  value,
  options,
  onChange,
}: {
  value: number | undefined;
  options: { value: string; label: string }[];
  onChange: (v: number | undefined) => void;
}) {
  return (
    <Select
      value={value == null ? NONE : String(value)}
      onValueChange={(v) => onChange(v === NONE ? undefined : parseInt(v, 10))}
    >
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>— aucune —</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
