// app/api/create-checkout-session/route.ts
import { NextRequest } from "next/server"
import { stripe } from "@/lib/stripe"

const prices = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()

    if (!['pro', 'enterprise'].includes(plan)) {
      return Response.json({ error: "Invalid plan" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: prices[plan] || prices.pro,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?premium=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      metadata: {
        plan,
      },
    })

    // ✅ Return the session URL
    return Response.json({ url: session.url }) // 👈 This is critical!

  } catch (error: any) {
    console.error("Stripe error:", error)
    return Response.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}