// src/lib/stripe.ts
// MODE DEV — Stripe sera câblé à la création de l'entreprise.
// En attendant : mise à jour directe du profil Supabase pour tester le gating.
import { supabase } from "@/lib/supabase";
import { tiers, type TierId } from "@/lib/pricing";

export async function setTierDirect(tierId: TierId): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Non connecté");

  const trialDays = tiers.find((ti) => ti.id === tierId)?.trialDays ?? 0;
  const trialEndsAt =
    tierId !== "free" && trialDays > 0
      ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      tier: tierId,
      subscriptionStatus: tierId === "free" ? null : "active",
      trialEndsAt,
    })
    .eq("user_id", authData.user.id);

  if (error) throw error;
}

// Mock portal — redirige vers Paramètres en attendant Stripe réel
export async function createPortalSession(): Promise<{ url: string }> {
  return { url: "/parametres#abonnement" };
}
