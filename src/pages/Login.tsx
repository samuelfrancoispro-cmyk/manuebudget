import { useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(t("auth.errorRequired"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) toast.error(error);
        else toast.success(t("auth.successSignIn"));
      } else {
        const { error, message } = await signUp(email.trim(), password);
        if (error) toast.error(error);
        else if (message) toast.info(message);
        else toast.success(t("auth.successSignUp"));
      }
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
          <CardTitle>{t("nav.appName")}</CardTitle>
          <CardDescription>
            {mode === "signin" ? t("auth.signInDesc") : t("auth.signUpDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{t("auth.email")}</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t("auth.password")}</Label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? t("auth.busy") : mode === "signin" ? t("auth.submitSignIn") : t("auth.submitSignUp")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <>
                {t("auth.noAccount")}{" "}
                <button type="button" className="font-medium underline" onClick={() => setMode("signup")}>
                  {t("auth.createAccount")}
                </button>
              </>
            ) : (
              <>
                {t("auth.alreadySignedUp")}{" "}
                <button type="button" className="font-medium underline" onClick={() => setMode("signin")}>
                  {t("auth.goToSignIn")}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
