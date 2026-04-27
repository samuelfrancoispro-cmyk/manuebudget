import { useState } from "react";
import { Wallet, Copy, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ============================================================
// Identifiants pré-remplis (édite ces 2 lignes pour changer)
// ============================================================
const DEMO_EMAIL = "manuebudget@gmail.com";
const DEMO_PASSWORD = "manuebudget105";
// ============================================================

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email et mot de passe requis");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) toast.error(error);
        else toast.success("Connexion réussie");
      } else {
        const { error, message } = await signUp(email.trim(), password);
        if (error) toast.error(error);
        else if (message) toast.info(message);
        else toast.success("Compte créé");
      }
    } finally {
      setBusy(false);
    }
  };

  const copier = async (val: string, libelle: string) => {
    try {
      await navigator.clipboard.writeText(val);
      toast.success(`${libelle} copié`);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const remplirEtConnecter = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setBusy(true);
    try {
      const { error } = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
      if (error) toast.error(error);
      else toast.success("Connexion réussie");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5" />
          </div>
          <CardTitle>Budget</CardTitle>
          <CardDescription>
            {mode === "signin" ? "Connecte-toi à ton espace" : "Crée ton compte"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "signin" && (
            <div className="mb-4 rounded-md border bg-muted/40 p-3 text-sm">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identifiants
              </div>
              <div className="space-y-1.5">
                <CredLine label="Email" value={DEMO_EMAIL} onCopy={copier} />
                <CredLine label="Mot de passe" value={DEMO_PASSWORD} onCopy={copier} />
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full"
                onClick={remplirEtConnecter}
                disabled={busy}
              >
                <LogIn className="h-4 w-4" />
                Connexion automatique
              </Button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.fr"
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Mot de passe</Label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-muted-foreground">Au moins 6 caractères.</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? "…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <>
                Pas de compte ?{" "}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => setMode("signup")}
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà inscrit ?{" "}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => setMode("signin")}
                >
                  Se connecter
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CredLine({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (v: string, l: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-1">
        <code className="truncate rounded bg-background px-2 py-0.5 text-xs">{value}</code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onCopy(value, label)}
          aria-label={`Copier ${label}`}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
