import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripHorizontal, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  onRemove: () => void;
  configPanel?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function ModuleShell({ title, onRemove, configPanel, children, className }: Props) {
  const [configOpen, setConfigOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  return (
    <div
      className={cn(
        'relative flex flex-col w-full h-full rounded-2xl bg-card border border-border shadow-md overflow-hidden',
        'transition-shadow hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
        <GripHorizontal size={14} className="text-muted-foreground shrink-0" />
        {editingTitle ? (
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm font-medium outline-none border-b border-primary"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <span
            className="flex-1 text-sm font-medium truncate cursor-default"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {localTitle}
          </span>
        )}
        <button
          onClick={() => setConfigOpen((v) => !v)}
          className={cn('p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors', configOpen && 'text-foreground bg-muted')}
        >
          <Settings size={13} />
        </button>
        <button
          onClick={onRemove}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 relative">
        {children}
        <AnimatePresence>
          {configOpen && configPanel && (
            <motion.div
              className="absolute inset-0 bg-card border-l border-border overflow-auto p-3 z-10"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Configuration</span>
                <button onClick={() => setConfigOpen(false)} className="p-1 rounded hover:bg-muted">
                  <X size={13} />
                </button>
              </div>
              {configPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
