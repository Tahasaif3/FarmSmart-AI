

// "use client"

// import { useEffect, useState } from "react"
// import { signOut } from "firebase/auth"
// import { ref, onValue } from "firebase/database"
// import { auth, rtdb } from "@/lib/firebase"
// import { LayoutDashboard, MessageCircle, History, X } from 'lucide-react'
// import { useRouter, usePathname } from 'next/navigation'
// import Image from "next/image"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"

// interface SidebarProps {
//   isOpen: boolean
//   userName: string
//   user: any
//   onMenuClick?: () => void
// }

// const menuItems = [
//   { icon: LayoutDashboard, label: "Dashboard", id: "" },
//   // { icon: MessageCircle, label: "Start new chat", id: "new-chat" },
//   { icon: MessageCircle, label: "AI Chat", id: "chat" },
//   { icon: History, label: "Chat History", id: "history" },
// ]

// export default function Sidebar({ isOpen, userName, user, onMenuClick }: SidebarProps) {
//   const router = useRouter()
//   const pathname = usePathname()
//   const [chats, setChats] = useState<any[]>(([]))

//   useEffect(() => {
//     if (!user?.uid) return
//     const chatsRef = ref(rtdb, `chats/${user.uid}`)
//     const unsubscribe = onValue(chatsRef, (snapshot) => {
//       const data = snapshot.val()
//       if (data) {
//         const chatList = Object.entries(data).map(([id, chat]: any) => ({
//           id,
//           ...chat,
//         }))
//         setChats(chatList.reverse())
//       } else setChats([])
//     })
//     return () => unsubscribe()
//   }, [user?.uid])

//   const handleLogout = async () => {
//     await signOut(auth)
//     router.push("/")
//   }

//   const visibleChats = chats.slice(0, 3)
//   const isActive = (id: string) => pathname === `/${id}`

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div
//           onClick={onMenuClick}
//           className="fixed inset-0 bg-black/50 z-30 md:hidden"
//         ></div>
//       )}

//       <div
//         className={`fixed md:static z-40 h-full flex flex-col bg-gradient-to-br from-[#0f1f14] via-[#228B22]/20 to-[#4CBB17]/10 border-r-2 border-[#4CBB17] backdrop-blur-sm
//         transition-all duration-300 
//         ${isOpen ? "left-0 w-64" : "-left-64 md:left-0 md:w-20"}
//         md:transition-none`}
//       >
//         {/* Header */}
//         <div className="p-6 flex items-center justify-between border-b-2 border-[#4CBB17]/40 animate-slide-in-left">
//           <h2
//             className={`text-2xl font-bold text-gradient-primary transition-all duration-300 ${
//               !isOpen && "opacity-0 w-0 md:opacity-100 md:w-auto"
//             }`}
//           >
//             Soft GPT
//           </h2>

//           <button
//             onClick={onMenuClick}
//             className="md:hidden text-[#4CBB17] hover:text-[#228B22] cursor-pointer transition"
//           >
//             <X size={22} />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 space-y-2 px-3 overflow-y-auto py-4">
//           {menuItems.map((item, idx) => {
//             const Icon = item.icon
//             const active = isActive(item.id)
//             return (
//               <button
//                 key={item.id}
//                 onClick={() => router.push(`/${item.id}`)}
//                 className={`w-full flex items-center gap-3 cursor-pointer px-3 py-3 rounded-xl transition-all animate-slide-in-left ${
//                   active
//                     ? "bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white shadow-lg shadow-[#228B22]/50 animate-glow"
//                     : "text-[#b8e6b8] hover:bg-[#228B22]/30 hover:shadow-lg hover:shadow-[#228B22]/20"
//                 }`}
//                 style={{ animationDelay: `${idx * 100}ms` }}
//               >
//                 <Icon size={18} />
//                 <span
//                   className={`font-medium text-sm truncate ${
//                     !isOpen && "hidden md:inline"
//                   }`}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             )
//           })}
//         </nav>

//         {/* History */}
//         <div
//           className={`px-4 mt-3 border-t-2 border-[#4CBB17]/40 pt-3 ${
//             !isOpen && "hidden md:block"
//           }`}
//         >
//           <p className="text-xs font-semibold text-[#4CBB17] uppercase mb-3 flex items-center gap-2 animate-slide-in-left">
//             <History size={14} /> Recent Chats
//           </p>
//           <div className="space-y-2 text-sm">
//             {visibleChats.length > 0 ? (
//               visibleChats.map((chat, idx) => (
//                 <p
//                   key={chat.id}
//                   onClick={() => router.push(`/chat?chat=${chat.id}`)}
//                   className="hover:text-[#4CBB17] cursor-pointer truncate text-[#b8e6b8] hover:bg-[#228B22]/20 px-2 py-1 rounded-lg transition animate-slide-in-left"
//                   style={{ animationDelay: `${idx * 50}ms` }}
//                 >
//                   {chat.title || "Untitled chat"}
//                 </p>
//               ))
//             ) : (
//               <p className="text-[#228B22]/60 text-xs">No chats yet</p>
//             )}

//             <Dialog>
//               <DialogTrigger asChild>
//                 <button className="text-[#4CBB17] hover:underline  cursor-pointer text-xs font-medium mt-2 hover:text-[#228B22]">
//                   View all
//                 </button>
//               </DialogTrigger>

//               <DialogContent className="bg-gradient-to-br from-[#1a3a1a] to-[#0f1f14] border-[#4CBB17] glass-morphism">
//                 <DialogHeader>
//                   <DialogTitle className="text-gradient-primary">
//                     All Chats
//                   </DialogTitle>
//                 </DialogHeader>
//                 <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
//                   {chats.length > 0 ? (
//                     chats.map((chat) => (
//                       <div
//                         key={chat.id}
//                         onClick={() => router.push(`/chat?chat=${chat.id}`)}
//                         className="p-2 rounded-lg hover:bg-[#228B22]/30 cursor-pointer text-sm flex justify-between transition text-[#b8e6b8] hover:text-[#4CBB17]"
//                       >
//                         <span>{chat.title || "Untitled chat"}</span>
//                         <span className="text-xs text-[#228B22]/60">
//                           {chat.createdAt
//                             ? new Date(chat.createdAt).toLocaleDateString()
//                             : ""}
//                         </span>
//                       </div>
//                     ))
//                   ) : (
//                     <p className="text-[#228B22]/60 text-sm text-center py-4">
//                       No chat history found.
//                     </p>
//                   )}
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>
//         </div>

//         {/* Logout */}
//         <div className="mt-auto p-4 border-t-2 border-[#4CBB17]/40 animate-slide-in-left">
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center gap-3 px-3 py-3 cursor-pointer rounded-xl bg-gradient-to-r from-[#228B22]/30 to-[#4CBB17]/20 hover:from-[#228B22]/50 hover:to-[#4CBB17]/40 transition text-sm font-medium text-[#b8e6b8] hover:text-[#4CBB17] hover:shadow-lg hover:shadow-[#228B22]/20"
//           >
//             {user?.photoURL ? (
//               <Image
//                 src={user.photoURL || "/placeholder.svg"}
//                 alt={userName}
//                 width={32}
//                 height={32}
//                 className="rounded-full border-2 border-[#4CBB17] shadow-lg shadow-[#228B22]/30"
//               />
//             ) : (
//               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CBB17] to-[#228B22] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#228B22]/50">
//                 {userName?.charAt(0).toUpperCase() || "U"}
//               </div>
//             )}
//             <span className={`${!isOpen && "hidden md:inline"}`}>Logout</span>
//           </button>
//         </div>
//       </div>
//     </>
//   )
// }

"use client"

import { useEffect, useState } from "react"
import { signOut } from "firebase/auth"
import { ref, onValue } from "firebase/database"
import { auth, rtdb } from "@/lib/firebase"
import { LayoutDashboard, MessageCircle, History, X } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SidebarProps {
  isOpen: boolean
  userName: string
  user: any
  onMenuClick?: () => void
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "" },
  // { icon: MessageCircle, label: "Start new chat", id: "new-chat" },
  { icon: MessageCircle, label: "AI Chat", id: "chat" },
  { icon: History, label: "Chat History", id: "history" },
]

export default function Sidebar({ isOpen, userName, user, onMenuClick }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [chats, setChats] = useState<any[]>(([]))

  useEffect(() => {
    if (!user?.uid) return
    const chatsRef = ref(rtdb, `chats/${user.uid}`)
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const chatList = Object.entries(data).map(([id, chat]: any) => ({
          id,
          ...chat,
        }))
        setChats(chatList.reverse())
      } else setChats([])
    })
    return () => unsubscribe()
  }, [user?.uid])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  const visibleChats = chats.slice(0, 3)
  const isActive = (id: string) => pathname === `/${id}`

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onMenuClick}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        ></div>
      )}

      <div
        className={`fixed md:static z-40 h-full flex flex-col bg-gradient-to-br from-[#0f1f14] via-[#228B22]/20 to-[#4CBB17]/10 border-r-2 border-[#4CBB17] backdrop-blur-sm
        transition-all duration-300 
        ${isOpen ? "left-0 w-64" : "-left-64 md:left-0 md:w-64"}
        md:transition-none`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b-2 border-[#4CBB17]/40 animate-slide-in-left">
          <h2
            className={`text-2xl font-bold text-gradient-primary transition-all duration-300 ${
              !isOpen && "opacity-0 w-0 md:opacity-100 md:w-auto"
            }`}
          >
            Soft GPT
          </h2>

          <button
            onClick={onMenuClick}
            className="md:hidden text-[#4CBB17] hover:text-[#228B22] cursor-pointer transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 overflow-y-auto py-4">
          {menuItems.map((item, idx) => {
            const Icon = item.icon
            const active = isActive(item.id)
            return (
              <button
                key={item.id}
                onClick={() => router.push(`/${item.id}`)}
                className={`w-full flex items-center gap-3 cursor-pointer px-3 py-3 rounded-xl transition-all animate-slide-in-left ${
                  active
                    ? "bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white shadow-lg shadow-[#228B22]/50 animate-glow"
                    : "text-[#b8e6b8] hover:bg-[#228B22]/30 hover:shadow-lg hover:shadow-[#228B22]/20"
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <Icon size={18} />
                <span
                  className={`font-medium text-sm truncate ${
                    !isOpen ? "hidden md:inline" : "block"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* History */}
        <div
          className={`px-4 mt-3 border-t-2 border-[#4CBB17]/40 pt-3 ${
            !isOpen ? "hidden md:block" : "block"
          }`}
        >
          <p className="text-xs font-semibold text-[#4CBB17] uppercase mb-3 flex items-center gap-2 animate-slide-in-left">
            <History size={14} /> Recent Chats
          </p>
          <div className="space-y-2 text-sm">
            {visibleChats.length > 0 ? (
              visibleChats.map((chat, idx) => (
                <p
                  key={chat.id}
                  onClick={() => router.push(`/chat?chat=${chat.id}`)}
                  className="hover:text-[#4CBB17] cursor-pointer truncate text-[#b8e6b8] hover:bg-[#228B22]/20 px-2 py-1 rounded-lg transition animate-slide-in-left"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {chat.title || "Untitled chat"}
                </p>
              ))
            ) : (
              <p className="text-[#228B22]/60 text-xs">No chats yet</p>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <button className="text-[#4CBB17] hover:underline  cursor-pointer text-xs font-medium mt-2 hover:text-[#228B22]">
                  View all
                </button>
              </DialogTrigger>

              <DialogContent className="bg-gradient-to-br from-[#1a3a1a] to-[#0f1f14] border-[#4CBB17] glass-morphism">
                <DialogHeader>
                  <DialogTitle className="text-gradient-primary">
                    All Chats
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                  {chats.length > 0 ? (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => router.push(`/chat?chat=${chat.id}`)}
                        className="p-2 rounded-lg hover:bg-[#228B22]/30 cursor-pointer text-sm flex justify-between transition text-[#b8e6b8] hover:text-[#4CBB17]"
                      >
                        <span>{chat.title || "Untitled chat"}</span>
                        <span className="text-xs text-[#228B22]/60">
                          {chat.createdAt
                            ? new Date(chat.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#228B22]/60 text-sm text-center py-4">
                      No chat history found.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-auto p-4 border-t-2 border-[#4CBB17]/40 animate-slide-in-left">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-[#228B22]/30 to-[#4CBB17]/20 hover:from-[#228B22]/50 hover:to-[#4CBB17]/40 transition text-sm font-medium text-[#b8e6b8] hover:text-[#4CBB17] hover:shadow-lg hover:shadow-[#228B22]/20"
          >
            {user?.photoURL ? (
              <Image
                src={user.photoURL || "/placeholder.svg"}
                alt={userName}
                width={32}
                height={32}
                className="rounded-full border-2 border-[#4CBB17] shadow-lg shadow-[#228B22]/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CBB17] to-[#228B22] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#228B22]/50">
                {userName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className={`${!isOpen ? "hidden md:inline" : "block"}`}>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}