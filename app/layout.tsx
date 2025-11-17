import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { UserProvider } from "@/app/context/user-context"
import { ThemeProvider } from "next-themes" // <-- Import ThemeProvider
import "./globals.css"
export const dynamic = "force-dynamic";

const ibmPlexMono = IBM_Plex_Mono({ weight: ["400", "500", "600", "700"], subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FarmSmart AI",
  description: "AI-powered virtual assistant",
  generator: "Taha Saif",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexMono.className} antialiased`}>
<ThemeProvider attribute="class" enableSystem={true} defaultTheme="light">
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
