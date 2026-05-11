import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { MODULE_CATALOGUE, MODULE_CATEGORIES } from '@/store/slices/modulesSlice';
import { cn } from '@/lib/utils';
import { getMockTier } from '@/lib/pricing';

export default function Modules() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const tier = getMockTier();

  const filtered = MODULE_CATALOGUE.filter((m) => {
    const matchSearch = !search || m.key.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || m.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-xl font-bold">Catalogue des modules</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="pl-7 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setActiveCategory(null)}
            className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', !activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
            Tous
          </button>
          {MODULE_CATEGORIES.map(({ key }) => (
            <button key={key} onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize', activeCategory === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
              {key}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const isSoon = m.status === 'soon';
            const needsUpgrade = (m.tier === 'pro' && tier !== 'pro') || (m.tier === 'plus' && tier === 'free');
            return (
              <div key={m.key} className={cn('p-4 rounded-2xl border border-border bg-card', isSoon && 'opacity-60')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">{m.key.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{m.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isSoon && <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Bientôt</span>}
                    {!isSoon && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 rounded">Dispo</span>}
                    {m.tier !== 'free' && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', m.tier === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>{m.tier === 'pro' ? 'Pro' : 'Plus'}</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Min {m.minW}×{m.minH}px
                  {needsUpgrade && !isSoon && <span className="ml-2 text-amber-600">→ Mettre à niveau</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
