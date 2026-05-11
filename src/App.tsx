import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Modules from '@/pages/Modules';
import Parametres from '@/pages/Parametres';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const profile = useStore((s) => s.profile);
  const loaded = useStore((s) => s.loaded);
  const loadAll = useStore((s) => s.loadAll);
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadAll(session.user.id);
      else setAuthChecked(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadAll(session.user.id).finally(() => setAuthChecked(true));
      else setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, [loadAll]);

  if (!authChecked && !loaded) {
    return <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Chargement…</div>;
  }

  if (!loaded) return <Navigate to="/login" replace />;

  if (profile && profile.onboardingStep < 4 && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
      <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
      <Route path="/modules" element={<AuthGuard><Modules /></AuthGuard>} />
      <Route path="/parametres" element={<AuthGuard><Parametres /></AuthGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
