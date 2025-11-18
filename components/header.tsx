// components/header.tsx
"use client"

import { Menu, X } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"

export default function Header({
  title = "Dashboard",
  userName,
  onMenuClick,
  user,
  sidebarOpen,
}: {
  title?: string
  userName: string
  onMenuClick: () => void
  user: any
  sidebarOpen: boolean
}) {
  return (
    <header className="border-b-2 border-[#4CBB17]/50 bg-gradient-to-r from-[#0f1f14] via-[#228B22]/30 to-[#4CBB17]/20 px-6 py-4 sticky top-0 z-30 shadow-lg shadow-[#228B22]/30 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
<button
  onClick={onMenuClick}
  className={`p-2 rounded-lg hover:bg-[#228B22]/40 transition hover:shadow-lg hover:shadow-[#228B22]/20 ${
    sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
  }`}
  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
>
  <Menu size={22} className="text-[#4CBB17]" />
</button>

          <h2 className="text-2xl font-bold text-gradient-primary">
            {title}
          </h2>
        </div>

        

        {/* Right - Profile (Clickable) */}
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-90 transition">
          {user?.photoURL ? (
            <Image
              src={user.photoURL || "/placeholder.svg"}
              alt={userName}
              width={40}
              height={40}
              className="rounded-full border-2 border-[#4CBB17] shadow-lg shadow-[#228B22]/40 hover:shadow-xl hover:shadow-[#228B22]/60 transition cursor-pointer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4CBB17] to-[#228B22] flex items-center justify-center text-white font-bold shadow-lg shadow-[#228B22]/50 hover:shadow-xl hover:shadow-[#228B22]/70 transition cursor-pointer">
              {userName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <span className="hidden sm:block font-medium text-[#b8e6b8] text-sm hover:text-[#4CBB17] transition">
            {userName}
          </span>
        </Link>
      </div>
    </header>
  )
}