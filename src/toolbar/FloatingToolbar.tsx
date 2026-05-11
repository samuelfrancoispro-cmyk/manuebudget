import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModuleSearch from './ModuleSearch';
import ModuleCategoryList from './ModuleCategoryList';

const STORAGE_KEY = 'fluxo_toolbar_pos';

function getSavedPos(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { x: 16, y: 80 };
}

export default function FloatingToolbar() {
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState(getSavedPos);
  const navigate = useNavigate();

  const onDragEnd = useCallback((_: unknown, info: { point: { x: number; y: number } }) => {
    const x = Math.max(16, Math.min(window.innerWidth - 236, info.point.x));
    const y = Math.max(16, Math.min(window.innerHeight - 100, info.point.y));
    const snapped = { x, y };
    setPos(snapped);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped));
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={onDragEnd}
      initial={pos}
      style={{ position: 'fixed', top: pos.y, left: pos.x, zIndex: 100, width: 220 }}
      className="bg-card/95 backdrop-blur border border-border rounded-xl shadow-xl flex flex-col gap-2 p-2 select-none"
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
    >
      <ModuleSearch value={search} onChange={setSearch} />
      <div className="flex-1 overflow-y-auto max-h-[60vh]">
        <ModuleCategoryList search={search} />
      </div>
      <div className="border-t border-border pt-1.5">
        <button
          onClick={() => navigate('/parametres')}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Settings size={12} />
          Paramètres
        </button>
      </div>
    </motion.div>
  );
}
