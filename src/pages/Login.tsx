import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand/BrandLogo";

type Screen = "form" | "confirm";

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("form");

  const handleSubmit = async (e: React.FormEvent) => {
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
        else if (message === "confirm") setScreen("confirm");
        else toast.success(t("auth.successSignUp"));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setBusy(false);
    }
  };

  const handleResend = async () => {
    const { error } = await signUp(email.trim(), password);
    if (!error) toast.success(t("auth.resendSent"));
  };

  if (screen === "confirm") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <BrandLogo variant="mark" className="mx-auto h-10" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-ink">{t("auth.emailConfirmTitle")}</h1>
            <p className="text-sm text-ink-muted">
              {t("auth.emailConfirmDesc", { email })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleResend}>
              {t("auth.resendEmail")}
            </Button>
            <Button variant="ghost" onClick={() => setScreen("form")}>
              {t("auth.backToLogin")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <BrandLogo variant="mark" className="h-10" />
          <p className="text-sm text-ink-muted">
            {mode === "signin" ? t("auth.signInDesc") : t("auth.signUpDesc")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 bg-paper"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("auth.continueGoogle")}
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-ink-muted">{t("auth.orSeparator")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-ink">{t("auth.email")}</Label>
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
              <Label className="mb-1.5 block text-ink">{t("auth.password")}</Label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-ink-muted">{t("auth.passwordHint")}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? t("auth.busy") : mode === "signin" ? t("auth.submitSignIn") : t("auth.submitSignUp")}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-muted">
            {mode === "signin" ? (
              <>
                {t("auth.noAccount")}{" "}
                <button type="button" className="font-medium text-ink underline-offset-4 hover:underline" onClick={() => setMode("signup")}>
                  {t("auth.createAccount")}
                </button>
              </>
            ) : (
              <>
                {t("auth.alreadySignedUp")}{" "}
                <button type="button" className="font-medium text-ink underline-offset-4 hover:underline" onClick={() => setMode("signin")}>
                  {t("auth.goToSignIn")}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
