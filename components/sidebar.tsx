"use client"

import { useEffect, useState } from "react"
import { signOut } from "firebase/auth"
import { ref, onValue } from "firebase/database"
import { auth, rtdb } from "@/lib/firebase"
import {
  LayoutDashboard,
  MessageCircle,
  Zap,
  FileText,
  ImageIcon,
  Code,
  Mic,
  Monitor,
  History,
  X,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
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
  { icon: MessageCircle, label: "Start new chat", id: "new-chat" },
  { icon: Zap, label: "AI chat", id: "chat" },
  { icon: FileText, label: "AI text generator", id: "text" },
  { icon: ImageIcon, label: "AI image generator", id: "image" },
  { icon: Code, label: "AI coding", id: "coding" },
  { icon: Mic, label: "AI text to speech", id: "speech" },
  { icon: Monitor, label: "AI computer use", id: "computer" },
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
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        ></div>
      )}

      <div
        className={`fixed md:static z-40 h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 
        ${isOpen ? "left-0 w-64" : "-left-64 md:left-0 md:w-20"}
        md:transition-none`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <h2
            className={`text-2xl font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-300 ${
              !isOpen && "opacity-0 w-0 md:opacity-100 md:w-auto"
            }`}
          >
            Soft GPT
          </h2>

          {/* Close icon for mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden text-gray-700 dark:text-gray-300"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.id)
            return (
              <button
                key={item.id}
                onClick={() => router.push(`/${item.id}`)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon size={18} />
                <span
                  className={`font-medium text-sm truncate ${
                    !isOpen && "hidden md:inline"
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
          className={`px-4 mt-3 border-t border-gray-200 dark:border-gray-700 pt-3 ${
            !isOpen && "hidden md:block"
          }`}
        >
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
            <History size={14} /> History
          </p>
          <div className="space-y-2 text-sm">
            {visibleChats.length > 0 ? (
              visibleChats.map((chat) => (
                <p
                  key={chat.id}
                  onClick={() => router.push(`/chat?chat=${chat.id}`)}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer truncate"
                >
                  {chat.title || "Untitled chat"}
                </p>
              ))
            ) : (
              <p className="text-gray-400 text-xs">No chats yet</p>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <button className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-medium">
                  View all
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-md bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-emerald-600 dark:text-emerald-400">
                    All Chats
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                  {chats.length > 0 ? (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => router.push(`/chat?chat=${chat.id}`)}
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex justify-between"
                      >
                        <span>{chat.title || "Untitled chat"}</span>
                        <span className="text-xs text-gray-400">
                          {chat.createdAt
                            ? new Date(chat.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No chat history found.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-auto p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
          >
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={userName}
                width={32}
                height={32}
                className="rounded-full border border-gray-300 dark:border-gray-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
                {userName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className={`${!isOpen && "hidden md:inline"}`}>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}