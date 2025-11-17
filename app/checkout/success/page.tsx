// app/checkout/success/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function CheckoutSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Optional: Refresh user subscription status
    // updateUserSubscription()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f14] via-[#1b3a1b]/10 to-[#4CBB17]/5 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-[#b8e6b8]/80 mb-8">
          Your FarmAgri Pro plan is now active. You can start using all premium features immediately.
        </p>

        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}