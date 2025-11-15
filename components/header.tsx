// "use client"

// import { Menu, Moon, Sun } from "lucide-react"
// import { useTheme } from "next-themes"
// import Image from "next/image"

// export default function Header({
//   title = "Dashboard",
//   userName,
//   onMenuClick,
//   user,
// }: {
//   title?: string
//   userName: string
//   onMenuClick: () => void
//   user: any
// }) {
//   const { theme, setTheme } = useTheme()
//   const isDark = theme === "dark"

//   return (
//     <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 sticky top-0 z-30 transition-colors duration-300 shadow-sm">
//       <div className="flex items-center justify-between">
//         {/* Left Section */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={onMenuClick}
//             className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition"
//           >
//             <Menu size={22} className="text-gray-700 dark:text-gray-200" />
//           </button>
//           <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors">
//             {title}
//           </h2>
//         </div>

//         {/* Right Section */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setTheme(isDark ? "light" : "dark")}
//             className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//           >
//             {isDark ? (
//               <Sun size={20} className="text-yellow-400" />
//             ) : (
//               <Moon size={20} className="text-gray-700" />
//             )}
//           </button>

//           <div className="flex items-center gap-2">
//             {user?.photoURL ? (
//               <Image
//                 src={user.photoURL}
//                 alt={userName}
//                 width={32}
//                 height={32}
//                 className="rounded-full border border-gray-300 dark:border-gray-700"
//               />
//             ) : (
//               <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
//                 {userName?.charAt(0).toUpperCase() || "U"}
//               </div>
//             )}
//             <span className="hidden sm:block font-medium text-gray-800 dark:text-gray-200 text-sm">
//               {userName}
//             </span>
//           </div>
//         </div>
//       </div>
//     </header>
//   )
// }

"use client"

import { Menu } from 'lucide-react'
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

  return (
    <header className="border-b-2 border-[#4CBB17]/50 bg-gradient-to-r from-[#0f1f14] via-[#228B22]/30 to-[#4CBB17]/20 px-6 py-4 sticky top-0 z-30 shadow-lg shadow-[#228B22]/30 backdrop-blur-sm glass-morphism">
      <div className="flex items-center justify-between animate-fade-in">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-[#228B22]/40 lg:hidden transition hover:shadow-lg hover:shadow-[#228B22]/20"
          >
            <Menu size={22} className="text-[#4CBB17]" />
          </button>
          <h2 className="text-2xl font-bold text-gradient-primary transition-colors">
            {title}
          </h2>
        </div>

        {/* Right Section - Profile */}
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <Image
              src={user.photoURL || "/placeholder.svg"}
              alt={userName}
              width={40}
              height={40}
              className="rounded-full border-2 border-[#4CBB17] shadow-lg shadow-[#228B22]/40 hover:shadow-xl hover:shadow-[#228B22]/60 transition"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4CBB17] to-[#228B22] flex items-center justify-center text-white font-bold shadow-lg shadow-[#228B22]/50 hover:shadow-xl hover:shadow-[#228B22]/70 transition">
              {userName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <span className="hidden sm:block font-medium text-[#b8e6b8] text-sm hover:text-[#4CBB17] transition">
            {userName}
          </span>
        </div>
      </div>
    </header>
  )
}
