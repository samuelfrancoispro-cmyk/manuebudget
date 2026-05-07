// supabase/functions/stripe-webhook/index.ts
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

function tierFromPriceId(priceId: string): "plus" | "pro" | null {
  const map: Record<string, "plus" | "pro"> = {
    [Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY") ?? ""]: "plus",
    [Deno.env.get("STRIPE_PRICE_PLUS_YEARLY") ?? ""]:  "plus",
    [Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? ""]:  "pro",
    [Deno.env.get("STRIPE_PRICE_PRO_YEARLY") ?? ""]:   "pro",
  };
  return map[priceId] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  async function updateProfileByCustomerId(
    stripeCustomerId: string,
    updates: Record<string, unknown>
  ) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq('"stripeCustomerId"', stripeCustomerId);
    if (error) console.error("Profile update error:", error);
  }

  async function updateProfileByUserId(
    userId: string,
    updates: Record<string, unknown>
  ) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
    if (error) console.error("Profile update error:", error);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const tier = tierFromPriceId(priceId);

        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = customer.metadata?.userId;

        if (userId) {
          await updateProfileByUserId(userId, {
            "stripeCustomerId": customerId,
            "stripeSubscriptionId": subscriptionId,
            subscriptionStatus: "active",
            ...(tier ? { tier } : {}),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const tier = tierFromPriceId(priceId);
        const status = ["active", "past_due", "canceled"].includes(sub.status)
          ? sub.status
          : null;
        await updateProfileByCustomerId(customerId, {
          ...(status ? { subscriptionStatus: status } : {}),
          ...(tier ? { tier } : {}),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await updateProfileByCustomerId(customerId, {
          tier: "free",
          subscriptionStatus: "canceled",
          "stripeSubscriptionId": null,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await updateProfileByCustomerId(customerId, { subscriptionStatus: "past_due" });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (invoice.billing_reason === "subscription_cycle") {
          await updateProfileByCustomerId(customerId, { subscriptionStatus: "active" });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
