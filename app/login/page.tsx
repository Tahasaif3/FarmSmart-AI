"use client"

import LoginPage from "@/components/login-page"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard") // redirect to dashboard if already logged in
      }
    })
    return () => unsubscribe()
  }, [router])

  return <LoginPage />
}
