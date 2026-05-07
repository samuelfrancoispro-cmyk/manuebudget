import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { useEntitlement } from "@/hooks/useEntitlement";
import type { DashboardPage } from "@/types";

interface PageTabsProps {
  pages: DashboardPage[];
  activePage: DashboardPage;
  onSelect: (page: DashboardPage) => void;
}

export function PageTabs({ pages, activePage, onSelect }: PageTabsProps) {
  const { addPage, renamePage, deletePage } = useStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { allowed: canAddPage } = useEntitlement("dashboard_pages", pages.length);

  function startRename(page: DashboardPage) {
    setRenamingId(page.id);
    setRenameValue(page.name);
  }

  async function confirmRename(id: string) {
    if (renameValue.trim()) await renamePage(id, renameValue.trim());
    setRenamingId(null);
  }

  async function handleAdd() {
    const page = await addPage("Nouvelle page");
    onSelect(page);
  }

  async function handleDelete(page: DashboardPage) {
    if (page.isDefault) return;
    const next = pages.find((p) => p.id !== page.id) ?? pages[0];
    await deletePage(page.id);
    if (next && next.id !== page.id) onSelect(next);
  }

  return (
    <div className="flex items-center gap-1 border-b pb-0">
      {pages.map((page) => (
        <div
          key={page.id}
          className={`group relative flex items-center gap-1 rounded-t-md border-b-2 px-3 py-2 text-sm transition ${
            page.id === activePage.id
              ? "border-ink bg-surface font-medium text-ink"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          {renamingId === page.id ? (
            <>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmRename(page.id); if (e.key === "Escape") setRenamingId(null); }}
                className="h-6 w-24 px-1 text-xs"
                autoFocus
              />
              <button onClick={() => confirmRename(page.id)} className="text-emerald-600 hover:text-emerald-700"><Check className="h-3 w-3" /></button>
              <button onClick={() => setRenamingId(null)} className="text-rose-500 hover:text-rose-600"><X className="h-3 w-3" /></button>
            </>
          ) : (
            <>
              <button className="cursor-pointer" onClick={() => onSelect(page)}>{page.name}</button>
              <div className="hidden items-center gap-0.5 group-hover:flex">
                <button onClick={() => startRename(page)} className="rounded p-0.5 text-ink-muted hover:text-ink">
                  <Pencil className="h-3 w-3" />
                </button>
                {!page.isDefault && (
                  <button onClick={() => handleDelete(page)} className="rounded p-0.5 text-ink-muted hover:text-rose-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {canAddPage && (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd} aria-label="Ajouter une page">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
