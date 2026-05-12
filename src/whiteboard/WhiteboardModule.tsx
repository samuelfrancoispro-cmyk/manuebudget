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
  // mode: 'idle' | 'drag' | Handle
  const mode = useRef<'idle' | 'drag' | Handle>('idle');
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

  // Single pointerdown on the outer container — checks data attrs to know what to do
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const handleKey = target.dataset.handle as Handle | undefined;
    const isDrag = !!target.closest('[data-drag-handle]');
    if (!handleKey && !isDrag) return;

    e.stopPropagation();
    mode.current = handleKey ?? 'drag';
    startPointer.current = { x: e.clientX, y: e.clientY };
    startRect.current = { x: module.x, y: module.y, w: module.w, h: module.h };
    // Capture on the outer element so all subsequent events come here
    elRef.current?.setPointerCapture(e.pointerId);
    if (elRef.current) { elRef.current.style.willChange = 'transform'; elRef.current.style.zIndex = '20'; }
  }, [module.x, module.y, module.w, module.h]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (mode.current === 'idle') return;
    const dx = (e.clientX - startPointer.current.x) / zoom;
    const dy = (e.clientY - startPointer.current.y) / zoom;
    const s = startRect.current;

    if (mode.current === 'drag') {
      const nx = s.x + dx, ny = s.y + dy;
      applyPosition(nx, ny, s.w, s.h);
      const others = wbModules.filter((m) => m.id !== module.id).map(({ x, y, w, h }) => ({ x, y, w, h }));
      if (elRef.current)
        elRef.current.style.outline = hasCollision({ x: nx, y: ny, w: s.w, h: s.h }, others) ? '2px solid #ef4444' : 'none';
      return;
    }

    const h = mode.current as Handle;
    let x = s.x, y = s.y, w = s.w, rh = s.h;
    const minW = 200, minH = 150;
    if (h.includes('e')) w  = Math.max(minW, s.w + dx);
    if (h.includes('s')) rh = Math.max(minH, s.h + dy);
    if (h.includes('w')) { x = s.x + dx; w  = Math.max(minW, s.w - dx); }
    if (h.includes('n')) { y = s.y + dy; rh = Math.max(minH, s.h - dy); }
    applyPosition(x, y, w, rh);
  }, [zoom, module.id, wbModules, applyPosition]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (mode.current === 'idle') return;
    const dx = (e.clientX - startPointer.current.x) / zoom;
    const dy = (e.clientY - startPointer.current.y) / zoom;
    const s = startRect.current;
    let finalRect: Rect;

    if (mode.current === 'drag') {
      finalRect = { x: s.x + dx, y: s.y + dy, w: s.w, h: s.h };
    } else {
      const h = mode.current as Handle;
      let x = s.x, y = s.y, w = s.w, rh = s.h;
      const minW = 200, minH = 150;
      if (h.includes('e')) w  = Math.max(minW, s.w + dx);
      if (h.includes('s')) rh = Math.max(minH, s.h + dy);
      if (h.includes('w')) { x = s.x + dx; w  = Math.max(minW, s.w - dx); }
      if (h.includes('n')) { y = s.y + dy; rh = Math.max(minH, s.h - dy); }
      finalRect = { x, y, w, h: rh };
    }

    mode.current = 'idle';
    if (elRef.current) {
      elRef.current.style.outline = 'none';
      elRef.current.style.willChange = 'auto';
      elRef.current.style.zIndex = '';
    }
    updateWbModuleLayout(module.id, finalRect);
    flushLayoutUpdates();
  }, [zoom, module.id, updateWbModuleLayout, flushLayoutUpdates]);

  return (
    <motion.div
      ref={elRef as React.RefObject<HTMLDivElement>}
      className="absolute select-none"
      style={{ top: 0, left: 0 }}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.88, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Invisible drag zone over the module header */}
      <div
        data-drag-handle
        className="absolute top-0 left-0 right-10 h-9 z-10 cursor-grab active:cursor-grabbing"
      />
      {children}
      {HANDLES.map((h) => (
        <div
          key={h}
          data-handle={h}
          className="absolute w-3 h-3 opacity-0 hover:opacity-100 bg-primary rounded-full z-20 transition-opacity"
          style={{ cursor: CURSOR[h], ...handlePosition(h) }}
        />
      ))}
    </motion.div>
  );
}

function handlePosition(h: Handle): React.CSSProperties {
  const mid = 'calc(50% - 6px)', edge = '-5px';
  const map: Record<Handle, React.CSSProperties> = {
    n:  { top: edge,    left: mid    },
    ne: { top: edge,    right: edge  },
    e:  { top: mid,     right: edge  },
    se: { bottom: edge, right: edge  },
    s:  { bottom: edge, left: mid    },
    sw: { bottom: edge, left: edge   },
    w:  { top: mid,     left: edge   },
    nw: { top: edge,    left: edge   },
  };
  return map[h];
}
