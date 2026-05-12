import React, { useState, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModuleSearch from './ModuleSearch';
import ModuleCategoryList from './ModuleCategoryList';

const STORAGE_KEY = 'fluxo_toolbar_pos';
const W = 200;

function getSavedPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { x: 16, y: 80 };
}

export default function FloatingToolbar() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const saved = useRef(getSavedPos());

  const mx = useMotionValue(saved.current.x);
  const my = useMotionValue(saved.current.y);

  const onDragEnd = () => {
    const nx = Math.max(8, Math.min(window.innerWidth - W - 8, mx.get()));
    const ny = Math.max(8, Math.min(window.innerHeight - 60, my.get()));
    mx.set(nx);
    my.set(ny);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: nx, y: ny }));
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={onDragEnd}
      style={{ position: 'fixed', top: 0, left: 0, x: mx, y: my, zIndex: 100, width: W }}
      className="bg-card/95 backdrop-blur border border-border rounded-xl shadow-lg flex flex-col gap-1.5 p-2 select-none"
      whileDrag={{ scale: 1.01 }}
    >
      {/* Drag handle visible */}
      <div className="flex items-center justify-between px-1 pb-1 border-b border-border cursor-grab">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Modules</span>
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
        </div>
      </div>

      <ModuleSearch value={search} onChange={setSearch} />

      <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
        <ModuleCategoryList search={search} />
      </div>

      <div className="border-t border-border pt-1">
        <button
          onClick={() => navigate('/parametres')}
          className="flex items-center gap-2 w-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Settings size={11} />
          Paramètres
        </button>
      </div>
    </motion.div>
  );
}
