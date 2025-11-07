import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/app/context/user-context"
import "./globals.css"

const ibmPlexMono = IBM_Plex_Mono({ weight: ["400", "500", "600", "700"], subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Soft GPT",
  description: "AI-powered virtual assistant",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexMono.className} antialiased`}>
        <UserProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        </UserProvider>
        <Analytics />
      </body>
    </html>
  )
}
