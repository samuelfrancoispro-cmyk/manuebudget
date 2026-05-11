import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { setTierDirect } from '@/lib/pricing';

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div className="flex flex-col items-center gap-6 text-center max-w-sm"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
        <span className="text-3xl font-bold text-primary-foreground">F</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Bienvenue sur Fluxo</h1>
        <p className="text-muted-foreground mt-2 text-sm">Construisez votre tableau de bord financier en glissant des modules sur votre whiteboard.</p>
      </div>
      <button onClick={onNext} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
        Commencer
      </button>
    </motion.div>
  );
}

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' }, { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' }, { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' }, { code: 'IE', name: 'Irlande', flag: '🇮🇪' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' }, { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' }, { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
];

function IdentityStep({ onNext }: { onNext: () => void }) {
  const updateProfile = useStore((s) => s.updateProfile);
  const setOnboardingStep = useStore((s) => s.setOnboardingStep);
  const [form, setForm] = useState({ firstName: '', lastName: '', country: 'FR' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.firstName.trim()) return;
    setSaving(true);
    await updateProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), country: form.country });
    await setOnboardingStep(2);
    onNext();
    setSaving(false);
  };

  return (
    <motion.div className="flex flex-col gap-5 w-full max-w-sm"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div>
        <h2 className="text-xl font-bold">Votre identité</h2>
        <p className="text-sm text-muted-foreground mt-1">Pour personnaliser votre expérience.</p>
      </div>
      <input placeholder="Prénom *" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
        className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
      <input placeholder="Nom (optionnel)" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
        className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" />
      <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
        className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background outline-none">
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
      </select>
      <button onClick={submit} disabled={!form.firstName.trim() || saving}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
        {saving ? 'Enregistrement…' : 'Continuer'}
      </button>
    </motion.div>
  );
}

function TutorialStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div className="flex flex-col gap-5 w-full max-w-sm"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div>
        <h2 className="text-xl font-bold">Comment ça marche ?</h2>
        <p className="text-sm text-muted-foreground mt-1">Fluxo fonctionne comme un tableau blanc.</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          { n: '1', text: 'Glissez un module depuis la barre flottante vers le canvas.' },
          { n: '2', text: 'Repositionnez et redimensionnez chaque module librement.' },
          { n: '3', text: "Configurez chaque module via l'icône ⚙." },
          { n: '4', text: 'Créez plusieurs sheets pour organiser vos vues.' },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
            <p className="text-sm">{text}</p>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
        J'ai compris
      </button>
    </motion.div>
  );
}

const PLANS = [
  { tier: 'free' as const, name: 'Gratuit', price: '0€', features: ['1 sheet', '4 modules', '3 modules actifs'] },
  { tier: 'plus' as const, name: 'Plus', price: '2,99€/mois', features: ['5 sheets', '20 modules', 'Export données'] },
  { tier: 'pro' as const, name: 'Pro', price: '4,99€/mois', features: ['Sheets illimitées', 'Modules illimités', 'Sync bancaire', 'Support prioritaire'], highlight: true },
];

function PricingStep({ onComplete }: { onComplete: (tier: 'free' | 'plus' | 'pro') => void }) {
  return (
    <motion.div className="flex flex-col gap-5 w-full max-w-lg"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div className="text-center">
        <h2 className="text-xl font-bold">Choisissez votre plan</h2>
        <p className="text-sm text-muted-foreground mt-1">Changez à tout moment. 14 jours d'essai gratuit.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PLANS.map(({ tier, name, price, features, highlight }) => (
          <div key={tier} className={`flex flex-col gap-3 p-4 rounded-2xl border ${highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
            <div>
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-lg font-bold mt-0.5">{price}</p>
            </div>
            <ul className="flex flex-col gap-1">
              {features.map((f) => <li key={f} className="text-xs text-muted-foreground">• {f}</li>)}
            </ul>
            <button onClick={() => onComplete(tier)}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border hover:bg-muted'}`}>
              {tier === 'free' ? 'Continuer gratuitement' : 'Essayer 14 jours'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const STEPS = ['welcome', 'identity', 'tutorial', 'pricing'] as const;

export default function Onboarding() {
  const profile = useStore((s) => s.profile);
  const setOnboardingStep = useStore((s) => s.setOnboardingStep);
  const navigate = useNavigate();

  const [step, setStep] = useState(() => Math.min(profile?.onboardingStep ?? 0, STEPS.length - 1));

  const next = async () => {
    const nextStep = step + 1;
    await setOnboardingStep(nextStep);
    setStep(nextStep);
  };

  const complete = async (tier: 'free' | 'plus' | 'pro') => {
    setTierDirect(tier);
    await setOnboardingStep(4);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        {step === 0 && <WelcomeStep key="welcome" onNext={next} />}
        {step === 1 && <IdentityStep key="identity" onNext={next} />}
        {step === 2 && <TutorialStep key="tutorial" onNext={next} />}
        {step === 3 && <PricingStep key="pricing" onComplete={complete} />}
      </AnimatePresence>
    </div>
  );
}
