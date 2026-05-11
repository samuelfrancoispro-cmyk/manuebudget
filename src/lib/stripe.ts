// src/lib/stripe.ts
// MODE DEV — Stripe sera câblé à la création de l'entreprise.
// En attendant : mise à jour directe du profil Supabase pour tester le gating.
import { supabase } from "@/lib/supabase";
import type { Tier } from "@/types";

export async function setTierDirect(tierId: Tier): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Non connecté");

  const { error } = await supabase
    .from("profiles")
    .update({ tier: tierId })
    .eq("user_id", authData.user.id);

  if (error) throw error;
}

// Mock portal — redirige vers Paramètres en attendant Stripe réel
export async function createPortalSession(): Promise<{ url: string }> {
  return { url: "/parametres#abonnement" };
}
