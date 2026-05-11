import React, { useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { hasCollision } from './collisionUtils';
import type { WbModule, Rect } from '@/types';

interface Props {
  module: WbModule;
  zoom: number;
  children: React.ReactNode;
}

const HANDLES = ['n','ne','e','se','s','sw','w','nw'] as const;
type Handle = typeof HANDLES[number];

const CURSOR: Record<Handle, string> = {
  n: 'n-resize', ne: 'ne-resize', e: 'e-resize', se: 'se-resize',
  s: 's-resize', sw: 'sw-resize', w: 'w-resize', nw: 'nw-resize',
};

export default function WhiteboardModule({ module, zoom, children }: Props) {
  const updateWbModuleLayout = useStore((s) => s.updateWbModuleLayout);
  const flushLayoutUpdates = useStore((s) => s.flushLayoutUpdates);
  const wbModules = useStore((s) => s.wbModules);

  const elRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const resizing = useRef<Handle | null>(null);
  const startPointer = useRef({ x: 0, y: 0 });
  const startRect = useRef<Rect>({ x: module.x, y: module.y, w: module.w, h: module.h });

  const applyPosition = useCallback((x: number, y: number, w: number, h: number) => {
    if (!elRef.current) return;
    elRef.current.style.transform = `translate(${x}px, ${y}px)`;
    elRef.current.style.width = `${w}px`;
    elRef.current.style.height = `${h}px`;
  }, []);

  useEffect(() => {
    applyPosition(module.x, module.y, module.w, module.h);
  }, [module.x, module.y, module.w, module.h, applyPosition]);

  const onDragPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    startPointer.current = { x: e.clientX, y: e.clientY };
    startRect.current = { x: module.x, y: module.y, w: module.w, h: module.h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (elRef.current) elRef.current.style.willChange = 'transform';
  }, [module.x, module.y, module.w, module.h]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current && !resizing.current) return;
    const dx = (e.clientX - startPointer.current.x) / zoom;
    const dy = (e.clientY - startPointer.current.y) / zoom;
    const s = startRect.current;

    if (dragging.current) {
      applyPosition(s.x + dx, s.y + dy, s.w, s.h);
      const others = wbModules.filter((m) => m.id !== module.id).map(({ x, y, w, h }) => ({ x, y, w, h }));
      const newRect = { x: s.x + dx, y: s.y + dy, w: s.w, h: s.h };
      if (elRef.current) {
        elRef.current.style.outline = hasCollision(newRect, others) ? '2px solid #ef4444' : 'none';
      }
    }

    if (resizing.current) {
      const h = resizing.current;
      let x = s.x, y = s.y, w = s.w, wh = s.h;
      const minW = 200, minH = 150;
      if (h.includes('e')) w = Math.max(minW, s.w + dx);
      if (h.includes('s')) wh = Math.max(minH, s.h + dy);
      if (h.includes('w')) { x = s.x + dx; w = Math.max(minW, s.w - dx); }
      if (h.includes('n')) { y = s.y + dy; wh = Math.max(minH, s.h - dy); }
      applyPosition(x, y, w, wh);
    }
  }, [zoom, module.id, wbModules, applyPosition]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current && !resizing.current) return;
    const dx = (e.clientX - startPointer.current.x) / zoom;
    const dy = (e.clientY - startPointer.current.y) / zoom;
    const s = startRect.current;
    let finalRect: Rect;

    if (dragging.current) {
      finalRect = { x: s.x + dx, y: s.y + dy, w: s.w, h: s.h };
    } else {
      const h = resizing.current!;
      let x = s.x, y = s.y, w = s.w, wh = s.h;
      const minW = 200, minH = 150;
      if (h.includes('e')) w = Math.max(minW, s.w + dx);
      if (h.includes('s')) wh = Math.max(minH, s.h + dy);
      if (h.includes('w')) { x = s.x + dx; w = Math.max(minW, s.w - dx); }
      if (h.includes('n')) { y = s.y + dy; wh = Math.max(minH, s.h - dy); }
      finalRect = { x, y, w, h: wh };
    }

    dragging.current = false;
    resizing.current = null;
    if (elRef.current) { elRef.current.style.outline = 'none'; elRef.current.style.willChange = 'auto'; }
    updateWbModuleLayout(module.id, finalRect);
    flushLayoutUpdates();
  }, [zoom, module.id, updateWbModuleLayout, flushLayoutUpdates]);

  return (
    <motion.div
      ref={elRef as React.RefObject<HTMLDivElement>}
      className="absolute select-none"
      style={{ top: 0, left: 0, willChange: 'auto' }}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="absolute top-0 left-0 right-8 h-10 cursor-grab z-10"
        onPointerDown={onDragPointerDown}
      />
      {children}
      {HANDLES.map((h) => (
        <div
          key={h}
          className="absolute opacity-0 hover:opacity-100 w-3 h-3 bg-primary rounded-full z-20 transition-opacity"
          style={{ cursor: CURSOR[h], ...handlePosition(h) }}
          onPointerDown={(e) => {
            e.stopPropagation();
            resizing.current = h;
            startPointer.current = { x: e.clientX, y: e.clientY };
            startRect.current = { x: module.x, y: module.y, w: module.w, h: module.h };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
        />
      ))}
    </motion.div>
  );
}

function handlePosition(h: Handle): React.CSSProperties {
  const mid = 'calc(50% - 6px)';
  const edge = '-6px';
  const map: Record<Handle, React.CSSProperties> = {
    n:  { top: edge,  left: mid   },
    ne: { top: edge,  right: edge },
    e:  { top: mid,   right: edge },
    se: { bottom: edge, right: edge },
    s:  { bottom: edge, left: mid },
    sw: { bottom: edge, left: edge },
    w:  { top: mid,   left: edge  },
    nw: { top: edge,  left: edge  },
  };
  return map[h];
}
