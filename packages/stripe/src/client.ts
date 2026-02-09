import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not set");

  return new Stripe(secretKey);
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!globalForStripe.stripe) {
      globalForStripe.stripe = createStripeClient();
    }
    return Reflect.get(globalForStripe.stripe, prop);
  },
});
