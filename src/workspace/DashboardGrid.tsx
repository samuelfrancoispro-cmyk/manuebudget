import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useEntitlement } from "@/hooks/useEntitlement";
import { WidgetCard } from "./WidgetCard";
import { AddWidgetDialog } from "./AddWidgetDialog";
import type { DashboardPage, WidgetType } from "@/types";

interface DashboardGridProps {
  page: DashboardPage;
}

export function DashboardGrid({ page }: DashboardGridProps) {
  const { dashboardWidgets, addWidget, removeWidget, reorderWidgets } = useStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const pageWidgets = [...dashboardWidgets.filter((w) => w.pageId === page.id)].sort(
    (a, b) => a.order - b.order
  );

  const { allowed: canAddWidget } = useEntitlement("dashboard_widgets", pageWidgets.length);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pageWidgets.findIndex((w) => w.id === active.id);
    const newIndex = pageWidgets.findIndex((w) => w.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...pageWidgets];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    await reorderWidgets(page.id, reordered.map((w) => w.id));
  }

  async function handleAdd(type: WidgetType) {
    const { WIDGET_REGISTRY } = await import("./WidgetRegistry");
    const meta = WIDGET_REGISTRY[type];
    await addWidget(page.id, type, meta.defaultColSpan, meta.defaultRowSpan);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        {isEditMode && canAddWidget && (
          <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter un widget
          </Button>
        )}
        <Button
          size="sm"
          variant={isEditMode ? "default" : "outline"}
          onClick={() => setIsEditMode((v) => !v)}
        >
          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
          {isEditMode ? "Terminer" : "Modifier"}
        </Button>
      </div>

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pageWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-4 auto-rows-[160px]">
            {pageWidgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                onRemove={removeWidget}
                isEditMode={isEditMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {pageWidgets.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-ink-muted">
          <p>Cette page est vide.</p>
          <Button size="sm" variant="outline" onClick={() => { setIsEditMode(true); setShowAddDialog(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter un widget
          </Button>
        </div>
      )}

      <AddWidgetDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAdd}
        existingTypes={pageWidgets.map((w) => w.widgetType)}
      />
    </div>
  );
}
