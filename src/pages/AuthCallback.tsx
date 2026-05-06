import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true });
      }
    });
    const t = setTimeout(() => navigate("/login", { replace: true }), 5000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Connexion en cours…
      </div>
    </div>
  );
}
