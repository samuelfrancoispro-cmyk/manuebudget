import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ModuleSearch({ value, onChange }: Props) {
  return (
    <div className="relative flex items-center">
      <Search size={13} className="absolute left-2.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        className="w-full pl-7 pr-6 py-1.5 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/50"
        placeholder="Rechercher…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 text-muted-foreground hover:text-foreground">
          <X size={11} />
        </button>
      )}
    </div>
  );
}
