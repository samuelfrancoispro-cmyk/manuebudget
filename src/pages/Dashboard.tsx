import React, { useCallback, useState, useRef } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { canUse } from '@/lib/pricing';
import WhiteboardCanvas from '@/whiteboard/WhiteboardCanvas';
import WhiteboardModule from '@/whiteboard/WhiteboardModule';
import DropZoneLayer from '@/whiteboard/DropZoneLayer';
import SheetTabs from '@/whiteboard/SheetTabs';
import FloatingToolbar from '@/toolbar/FloatingToolbar';
import ModuleSolde from '@/modules/solde/ModuleSolde';
import ModuleDepenses from '@/modules/depenses/ModuleDepenses';
import ModuleRecurrentes from '@/modules/recurrentes/ModuleRecurrentes';
import ModuleObjectif from '@/modules/objectif-epargne/ModuleObjectif';
import { screenToWorld, hasCollision } from '@/whiteboard/collisionUtils';
import { MODULE_CATALOGUE } from '@/store/slices/modulesSlice';
import type { WbModule, ModuleKey } from '@/types';

const MODULE_COMPONENTS: Partial<Record<ModuleKey, React.ComponentType<{ module: WbModule }>>> = {
  'solde':            ModuleSolde,
  'depenses':         ModuleDepenses,
  'recurrentes':      ModuleRecurrentes,
  'objectif-epargne': ModuleObjectif,
};

export default function Dashboard() {
  const activeSheetId = useStore((s) => s.activeSheetId);
  const sheets = useStore((s) => s.sheets);
  const wbModules = useStore((s) => s.wbModules);
  const addWbModule = useStore((s) => s.addWbModule);
  const profile = useStore((s) => s.profile);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  const [draggingKey, setDraggingKey] = useState<ModuleKey | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragOver = useCallback(() => {
    setIsOver(true);
    const modCount = wbModules.filter((m) => m.sheetId === activeSheetId).length;
    setCanDrop(canUse('whiteboard_modules', profile?.tier ?? 'free', modCount));
  }, [wbModules, activeSheetId, profile]);

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setIsOver(false);
    setDraggingKey(null);
    const current = e.active.data.current as { moduleKey: ModuleKey; meta: { defaultW: number; defaultH: number } } | undefined;
    const mk = current?.moduleKey;
    const meta = current?.meta;
    if (!mk || !meta || !activeSheetId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const zoom = activeSheet?.zoom ?? 1;
    const panX = activeSheet?.panX ?? 0;
    const panY = activeSheet?.panY ?? 0;

    const pointerEvent = e.activatorEvent as PointerEvent;
    const worldPos = screenToWorld(pointerEvent.clientX, pointerEvent.clientY, canvasRect, panX, panY, zoom);
    const rect = { x: worldPos.x - meta.defaultW / 2, y: worldPos.y - meta.defaultH / 2, w: meta.defaultW, h: meta.defaultH };
    const others = wbModules.filter((m) => m.sheetId === activeSheetId).map(({ x, y, w, h }) => ({ x, y, w, h }));

    if (hasCollision(rect, others)) return;

    const modCount = wbModules.filter((m) => m.sheetId === activeSheetId).length;
    if (!canUse('whiteboard_modules', profile?.tier ?? 'free', modCount)) return;

    const moduleMeta = MODULE_CATALOGUE.find((m) => m.key === mk);
    if (moduleMeta?.tier === 'pro' && profile?.tier !== 'pro') return;
    if (moduleMeta?.tier === 'plus' && profile?.tier === 'free') return;

    await addWbModule(activeSheetId, { moduleKey: mk, ...rect, config: {} });
  }, [activeSheetId, activeSheet, wbModules, addWbModule, profile]);

  const activeModules = activeSheetId
    ? wbModules.filter((m) => m.sheetId === activeSheetId)
    : [];

  if (!activeSheetId) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <SheetTabs />
      <DndContext
        sensors={sensors}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragStart={(e) => setDraggingKey(e.active.data.current?.moduleKey ?? null)}
        onDragCancel={() => { setIsOver(false); setDraggingKey(null); }}
      >
        <div ref={canvasRef} className="flex-1 relative">
          <WhiteboardCanvas sheetId={activeSheetId}>
            {activeModules.map((mod) => {
              const Component = MODULE_COMPONENTS[mod.moduleKey];
              return Component ? (
                <WhiteboardModule key={mod.id} module={mod} zoom={activeSheet?.zoom ?? 1}>
                  <Component module={mod} />
                </WhiteboardModule>
              ) : null;
            })}
          </WhiteboardCanvas>
          <DropZoneLayer isOver={isOver} canDrop={canDrop} />
        </div>
        <DragOverlay>
          {draggingKey && (
            <motion.div
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm font-medium shadow-2xl opacity-90"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            >
              {draggingKey}
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>
      <FloatingToolbar />
    </div>
  );
}
