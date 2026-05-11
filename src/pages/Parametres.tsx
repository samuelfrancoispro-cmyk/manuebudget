import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { setTierDirect, getMockTier } from '@/lib/pricing';

export default function Parametres() {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const clearLocal = useStore((s) => s.clearLocal);
  const navigate = useNavigate();
  const tier = getMockTier();

  const [form, setForm] = useState({ firstName: profile?.firstName ?? '', lastName: profile?.lastName ?? '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await updateProfile(form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearLocal();
    navigate('/login');
  };

  const tierLabel: Record<string, string> = { free: 'Gratuit', plus: 'Plus', pro: 'Pro' };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={16} /></Link>
          <h1 className="text-xl font-bold">Paramètres</h1>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profil</h2>
          <div className="flex gap-3">
            <input placeholder="Prénom" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
            <input placeholder="Nom" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <button onClick={save} disabled={saving}
            className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saved ? 'Enregistré ✓' : saving ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Abonnement</h2>
          <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card">
            <div>
              <p className="font-medium">{tierLabel[tier]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tier === 'free' ? 'Passez à Plus ou Pro pour plus de modules' : 'Abonnement actif'}</p>
            </div>
            {tier !== 'pro' && (
              <button onClick={() => setTierDirect('pro')}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
                Mettre à niveau
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {(['free', 'plus', 'pro'] as const).map((t) => (
              <button key={t} onClick={() => setTierDirect(t)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${tier === t ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                {t}
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-1">(dev mock)</span>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mon compte</h2>
          <button onClick={logout} className="self-start px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
            Se déconnecter
          </button>
          <button className="self-start px-4 py-2 border border-destructive/50 rounded-xl text-sm text-destructive hover:bg-destructive/5 transition-colors">
            Supprimer le compte
          </button>
        </section>
      </div>
    </div>
  );
}
