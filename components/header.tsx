"use client"

import { Menu, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"

export default function Header({
  title = "Dashboard",
  userName,
  onMenuClick,
  user,
}: {
  title?: string
  userName: string
  onMenuClick: () => void
  user: any
}) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 sticky top-0 z-30 transition-colors duration-300 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition"
          >
            <Menu size={22} className="text-gray-700 dark:text-gray-200" />
          </button>
          <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400 transition-colors">{title}</h2>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-700" />}
          </button>

          <div className="flex items-center gap-2">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={userName}
                width={32}
                height={32}
                className="rounded-full border border-gray-300 dark:border-gray-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                {userName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="hidden sm:block font-medium text-gray-800 dark:text-gray-200 text-sm">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
