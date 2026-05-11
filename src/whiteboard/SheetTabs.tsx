import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useWbEntitlement } from '@/hooks/useWbEntitlement';
import { cn } from '@/lib/utils';

export default function SheetTabs() {
  const sheets = useStore((s) => s.sheets);
  const activeSheetId = useStore((s) => s.activeSheetId);
  const setActiveSheet = useStore((s) => s.setActiveSheet);
  const createSheet = useStore((s) => s.createSheet);
  const deleteSheet = useStore((s) => s.deleteSheet);
  const renameSheet = useStore((s) => s.renameSheet);
  const { value } = useWbEntitlement();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    const maxSheets = value('whiteboard_sheets') as number;
    if (sheets.length >= maxSheets) return;
    const sheet = await createSheet(`Sheet ${sheets.length + 1}`);
    setActiveSheet(sheet.id);
  };

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const commitRename = async () => {
    if (editingId && editValue.trim()) await renameSheet(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-background/80 backdrop-blur overflow-x-auto">
      {sheets
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((sheet) => (
          <div
            key={sheet.id}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-t text-sm cursor-pointer select-none transition-colors',
              sheet.id === activeSheetId
                ? 'bg-card border border-b-card border-border text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            onClick={() => setActiveSheet(sheet.id)}
            onDoubleClick={() => startRename(sheet.id, sheet.name)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (window.confirm(`Supprimer "${sheet.name}" ?`)) deleteSheet(sheet.id);
            }}
          >
            {editingId === sheet.id ? (
              <input
                ref={inputRef}
                className="bg-transparent outline-none w-24 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="max-w-[120px] truncate">{sheet.name}</span>
            )}
          </div>
        ))}
      <button
        onClick={handleCreate}
        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Nouvelle sheet"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
