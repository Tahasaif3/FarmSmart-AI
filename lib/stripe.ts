// lib/stripe.ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    //@ts-expect-error:error
  apiVersion: "2024-06-20",
  appInfo: {
    name: "FarmAgri",
    version: "1.0.0",
  },
})