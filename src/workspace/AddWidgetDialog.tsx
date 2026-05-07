import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WIDGET_REGISTRY, type WidgetMeta } from "./WidgetRegistry";
import type { WidgetType } from "@/types";

interface AddWidgetDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => void;
  existingTypes: WidgetType[];
}

export function AddWidgetDialog({ open, onClose, onAdd, existingTypes }: AddWidgetDialogProps) {
  const allWidgets = Object.values(WIDGET_REGISTRY) as WidgetMeta[];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un widget</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {allWidgets.map((meta) => {
            const already = existingTypes.includes(meta.type);
            return (
              <button
                key={meta.type}
                type="button"
                disabled={already}
                onClick={() => { onAdd(meta.type); onClose(); }}
                className="flex items-start gap-3 rounded-lg border p-3 text-left transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div>
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="text-xs text-ink-muted">{meta.description}</div>
                </div>
                {already && <span className="ml-auto shrink-0 text-xs text-ink-muted">Déjà ajouté</span>}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
