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
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./lib/auth";
import { useStore } from "./store/useStore";

export default function App() {
  const { user, loading } = useAuth();
  const { loaded, loadedUserId, loading: storeLoading, loadAll, clearLocal } = useStore();

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
        <LoginPage />
        <Toaster position="bottom-right" />
      </>
    );
  }

  if (!loaded || loadedUserId !== user.id) {
    return <SplashLoader label="Synchronisation des données…" />;
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </div>
    </div>
  );
}
