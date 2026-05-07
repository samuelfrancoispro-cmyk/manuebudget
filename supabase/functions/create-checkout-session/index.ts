// supabase/functions/create-checkout-session/index.ts
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const PRICE_IDS: Record<string, string> = {
  "plus-monthly": Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY")!,
  "plus-yearly":  Deno.env.get("STRIPE_PRICE_PLUS_YEARLY")!,
  "pro-monthly":  Deno.env.get("STRIPE_PRICE_PRO_MONTHLY")!,
  "pro-yearly":   Deno.env.get("STRIPE_PRICE_PRO_YEARLY")!,
};

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response("Unauthorized", { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select('"stripeCustomerId", tier')
      .eq("user_id", user.id)
      .single();

    const { tierId, period } = await req.json() as { tierId: "plus" | "pro"; period: "monthly" | "yearly" };
    const priceKey = `${tierId}-${period}`;
    const priceId = PRICE_IDS[priceKey];
    if (!priceId) return new Response("Invalid tier/period", { status: 400 });

    let stripeCustomerId: string = profile?.stripeCustomerId ?? "";
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await supabase
        .from("profiles")
        .update({ "stripeCustomerId": stripeCustomerId })
        .eq("user_id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: { enabled: true },
      customer_update: { address: "auto" },
      success_url: `${APP_URL}/parametres?checkout=success`,
      cancel_url: `${APP_URL}/parametres?checkout=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
