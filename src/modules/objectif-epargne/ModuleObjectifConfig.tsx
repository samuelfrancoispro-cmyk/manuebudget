import { useStore } from '@/store/useStore';

interface Props { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; }

export default function ModuleObjectifConfig({ config, onChange }: Props) {
  const objectifs = useStore((s) => s.objectifs);
  const selected = config.objectifId as string | undefined;
  const showConseil = (config.showConseil as boolean) ?? true;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium block mb-1">Objectif</label>
        <select className="w-full border border-border rounded px-2 py-1 text-sm bg-background"
          value={selected ?? ''} onChange={(e) => onChange({ ...config, objectifId: e.target.value || undefined })}>
          <option value="">— Choisir —</option>
          {objectifs.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={showConseil}
          onChange={(e) => onChange({ ...config, showConseil: e.target.checked })} />
        <span className="text-sm">Afficher conseil mensuel</span>
      </label>
    </div>
  );
}
