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
    <div className="fixed top-6 right-6 z-50">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === "dark" ? (
          <>
            <Sun size={18} className="text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Light</span>
          </>
        ) : (
          <>
            <Moon size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Dark</span>
          </>
        )}
      </button>
    </div>
  )
}
