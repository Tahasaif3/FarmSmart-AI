"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800/50
                 bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shadow-sm"
    >
      {theme === "dark" ? (
        <>
          <Sun size={18} className="text-emerald-500" />
          <span className="text-sm font-medium text-emerald-400">Light</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Dark</span>
        </>
      )}
    </button>
  )
}
