import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Argent from "./pages/Argent";
import EpargneHub from "./pages/EpargneHub";
import Parametres from "./pages/Parametres";
import Aide from "./pages/Aide";
import Rapports from "./pages/Rapports";
import LoginPage from "./pages/Login";
import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./lib/auth";
import { useStore } from "./store/useStore";

export default function App() {
  const { user, loading } = useAuth();
  const { loaded, loadedUserId, loading: storeLoading, loadAll, clearLocal, profile } = useStore();

  useEffect(() => {
    if (user && user.id !== loadedUserId && !storeLoading) {
      loadAll(user.id);
    }
    if (!user && (loaded || loadedUserId)) {
      clearLocal();
    }
  }, [user, loaded, loadedUserId, storeLoading, loadAll, clearLocal]);

  if (loading) return <SplashLoader label="Chargement…" />;

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </>
    );
  }

  if (!loaded || loadedUserId !== user.id) {
    return <SplashLoader label="Synchronisation des données…" />;
  }

  // Redirect to onboarding if not completed
  if (profile && !profile.onboardingCompleted) {
    return (
      <>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/argent" element={<Argent />} />
          <Route path="/epargne" element={<EpargneHub />} />
          <Route path="/comptes" element={<Navigate to="/argent?tab=comptes" replace />} />
          <Route path="/transactions" element={<Navigate to="/argent?tab=transactions" replace />} />
          <Route path="/recurrents" element={<Navigate to="/argent?tab=recurrents" replace />} />
          <Route path="/simulateur" element={<Navigate to="/epargne?tab=simulateur" replace />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/aide" element={<Aide />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </>
  );
}

function SplashLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </div>
    </div>
  );
}
