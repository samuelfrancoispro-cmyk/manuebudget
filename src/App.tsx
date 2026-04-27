import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Comptes from "./pages/Comptes";
import Transactions from "./pages/Transactions";
import Recurrents from "./pages/Recurrents";
import Epargne from "./pages/Epargne";
import Simulateur from "./pages/Simulateur";
import Parametres from "./pages/Parametres";
import Aide from "./pages/Aide";
import LoginPage from "./pages/Login";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./lib/auth";
import { useStore } from "./store/useStore";

export default function App() {
  const { user, loading } = useAuth();
  const { loaded, loading: storeLoading, loadAll, clearLocal } = useStore();

  useEffect(() => {
    if (user && !loaded && !storeLoading) {
      loadAll(user.id);
    }
    if (!user) {
      clearLocal();
    }
  }, [user, loaded, storeLoading, loadAll, clearLocal]);

  if (loading) return <SplashLoader label="Chargement…" />;

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster position="bottom-right" />
      </>
    );
  }

  if (!loaded) return <SplashLoader label="Synchronisation des données…" />;

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/comptes" element={<Comptes />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/recurrents" element={<Recurrents />} />
          <Route path="/epargne" element={<Epargne />} />
          <Route path="/simulateur" element={<Simulateur />} />
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
