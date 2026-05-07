// src/lib/stripe.ts
// Appels aux Edge Functions Supabase pour le billing Stripe.
import { supabase } from "@/lib/supabase";

export async function createCheckoutSession(
  tierId: "plus" | "pro",
  period: "monthly" | "yearly"
): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { tierId, period },
  });
  if (error) throw new Error(error.message);
  return data as { url: string };
}

export async function createPortalSession(): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    body: {},
  });
  if (error) throw new Error(error.message);
  return data as { url: string };
}
