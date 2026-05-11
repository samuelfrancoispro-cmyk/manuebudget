import React, { useRef, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

interface Props {
  sheetId: string;
  children: React.ReactNode;
}

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;

export default function WhiteboardCanvas({ sheetId, children }: Props) {
  const sheet = useStore((s) => s.sheets.find((sh) => sh.id === sheetId));
  const saveSheetViewport = useStore((s) => s.saveSheetViewport);

  const worldRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom: sheet?.zoom ?? 1, panX: sheet?.panX ?? 0, panY: sheet?.panY ?? 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const applyTransform = useCallback(() => {
    if (!worldRef.current) return;
    const { zoom, panX, panY } = stateRef.current;
    worldRef.current.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 1 && !(e.button === 0 && e.altKey)) return;
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    stateRef.current.panX += dx;
    stateRef.current.panY += dy;
    applyTransform();
  }, [applyTransform]);

  const onPointerUp = useCallback(() => {
    if (!isPanning.current) return;
    isPanning.current = false;
    const { zoom, panX, panY } = stateRef.current;
    saveSheetViewport(sheetId, zoom, panX, panY);
  }, [sheetId, saveSheetViewport]);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = worldRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const { zoom, panX, panY } = stateRef.current;
    const factor = e.ctrlKey ? 0.02 : 0.1;
    const delta = e.deltaY > 0 ? -factor : factor;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta));
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    stateRef.current = {
      zoom: newZoom,
      panX: mx - (mx - panX) * (newZoom / zoom),
      panY: my - (my - panY) * (newZoom / zoom),
    };
    applyTransform();
  }, [applyTransform]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target !== document.body) return;
    if (e.key !== '+' && e.key !== '-' && e.key !== '=') return;
    const { zoom, panX, panY } = stateRef.current;
    const delta = (e.key === '-') ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta));
    const parent = worldRef.current?.parentElement;
    if (!parent) return;
    const cx = parent.clientWidth / 2;
    const cy = parent.clientHeight / 2;
    stateRef.current = {
      zoom: newZoom,
      panX: cx - (cx - panX) * (newZoom / zoom),
      panY: cy - (cy - panY) * (newZoom / zoom),
    };
    applyTransform();
    saveSheetViewport(sheetId, stateRef.current.zoom, stateRef.current.panX, stateRef.current.panY);
  }, [applyTransform, sheetId, saveSheetViewport]);

  useEffect(() => {
    const el = worldRef.current?.parentElement;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onWheel, onKeyDown]);

  useEffect(() => {
    if (!sheet) return;
    stateRef.current = { zoom: sheet.zoom, panX: sheet.panX, panY: sheet.panY };
    applyTransform();
  }, [sheetId, sheet, applyTransform]);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[var(--canvas-bg)] cursor-default select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.4,
        }}
      />
      <div
        ref={worldRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{ willChange: 'transform' }}
      >
        <AnimatePresence>{children}</AnimatePresence>
      </div>
    </div>
  );
}
