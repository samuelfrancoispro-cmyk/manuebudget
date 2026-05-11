import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOver: boolean;
  canDrop: boolean;
}

export default function DropZoneLayer({ isOver, canDrop }: Props) {
  return (
    <AnimatePresence>
      {isOver && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-30 rounded-2xl border-2"
          style={{
            borderColor: canDrop ? '#22c55e' : '#ef4444',
            backgroundColor: canDrop ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      )}
    </AnimatePresence>
  );
}
