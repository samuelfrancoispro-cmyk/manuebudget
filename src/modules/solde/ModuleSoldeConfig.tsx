import { useStore } from '@/store/useStore';

interface Props {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}

export default function ModuleSoldeConfig({ config, onChange }: Props) {
  const comptesCourants = useStore((s) => s.comptesCourants);
  const selected = (config.compteIds as string[]) ?? comptesCourants.map((c) => c.id);
  const showVariation = (config.showVariation as boolean) ?? true;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-medium mb-1.5">Comptes affichés</p>
        {comptesCourants.map((c) => (
          <label key={c.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id);
                onChange({ ...config, compteIds: next });
              }}
            />
            <span className="text-sm">{c.nom}</span>
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showVariation}
          onChange={(e) => onChange({ ...config, showVariation: e.target.checked })}
        />
        <span className="text-sm">Variation mensuelle</span>
      </label>
    </div>
  );
}
