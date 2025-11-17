// app/checkout/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "pro"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const plans = {
    pro: {
      name: "Professional",
      price: "$50",
      period: "per month",
      features: [
        "Advanced crop and soil analysis",
        "Multiple farm integration",
        "Up to 10 AI farm agents",
        "Automated irrigation recommendations",
        "Priority support",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: "$500",
      period: "per month",
      features: [
        "Custom farm dashboards",
        "Unlimited AI agents",
        "Full API & IoT integration",
        "Enterprise-grade security",
        "Dedicated account manager",
      ],
    },
  }

  const selectedPlan = plans[plan as keyof typeof plans] || plans.pro

  const handleCheckout = async () => {
  setLoading(true)
  setError("")

  try {
    const stripe = await stripePromise
    if (!stripe) {
      throw new Error("Stripe failed to load")
    }

    // Call your backend to create a Stripe Checkout Session
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })

    const session = await response.json()

    if (session.error) {
      throw new Error(session.error)
    }

    // ✅ Redirect using window.location.href (modern way)
    window.location.href = session.url

  } catch (err: any) {
    console.error("Checkout error:", err)
    setError(err.message || "Failed to start checkout. Please try again.")
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f14] via-[#1b3a1b]/10 to-[#4CBB17]/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#1a3a1a]/80 border border-[#4CBB17]/40 backdrop-blur-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold text-[#4CBB17]">Upgrade to {selectedPlan.name}</CardTitle>
          <p className="text-[#b8e6b8]/80 mt-2">
            Unlock premium AI tools for smarter farming
          </p>
        </CardHeader>

        <CardContent>
          {/* Plan Summary */}
          <div className="bg-gradient-to-r from-[#228B22]/30 to-[#4CBB17]/30 rounded-xl p-6 mb-8 border border-[#4CBB17]/30">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{selectedPlan.price}</div>
              <div className="text-[#b8e6b8]/70 mt-1">{selectedPlan.period}</div>
            </div>

            <ul className="mt-6 space-y-3">
              {selectedPlan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-[#b8e6b8]">
                  <Check className="w-5 h-5 text-[#4CBB17] mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#228B22] to-[#4CBB17] hover:from-[#4CBB17] hover:to-[#228B22] text-white font-semibold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Upgrade Now"
            )}
          </Button>

          <p className="text-center text-xs text-[#b8e6b8]/60 mt-4">
            Secure payment via Stripe • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  )
}