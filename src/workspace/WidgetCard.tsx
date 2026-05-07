import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WIDGET_REGISTRY } from "./WidgetRegistry";
import type { DashboardWidget } from "@/types";

interface WidgetCardProps {
  widget: DashboardWidget;
  onRemove: (id: string) => void;
  isEditMode: boolean;
}

const COL_SPAN_CLASS: Record<number, string> = { 1: "col-span-1", 2: "col-span-2", 4: "col-span-4" };
const ROW_SPAN_CLASS: Record<number, string> = { 1: "row-span-1", 2: "row-span-2" };

export function WidgetCard({ widget, onRemove, isEditMode }: WidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const meta = WIDGET_REGISTRY[widget.widgetType];
  if (!meta) return null;
  const WidgetComponent = meta.component;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${COL_SPAN_CLASS[widget.colSpan]} ${ROW_SPAN_CLASS[widget.rowSpan]} min-h-[120px]`}
    >
      <Card className="group relative h-full overflow-hidden">
        {isEditMode && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-surface/80 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              className="cursor-grab touch-none text-ink-muted hover:text-ink"
              {...attributes}
              {...listeners}
              aria-label="Déplacer"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:text-rose-600"
              onClick={() => onRemove(widget.id)}
              aria-label="Supprimer le widget"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <CardContent className="h-full p-4">
          <WidgetComponent config={widget.config} />
        </CardContent>
      </Card>
    </div>
  );
}
