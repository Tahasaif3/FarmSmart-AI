"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { Zap, FileText, ImageIcon, Code, Mic, Monitor, History } from "lucide-react"
import { ref, query, limitToLast, onValue } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { useUser } from "@/app/context/user-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function NewChatPage() {
  const user = useUser()
  const userName = user?.displayName || "User"
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [allChats, setAllChats] = useState<any[]>([])
  const router = useRouter()

  const assistants = [
    { icon: Zap, label: "AI Chat", id: "ai-chat" },
    { icon: FileText, label: "AI Text Generator", id: "text" },
    { icon: ImageIcon, label: "AI Image Generator", id: "image" },
    { icon: Code, label: "AI Coding", id: "coding" },
    { icon: Mic, label: "AI Text to Speech", id: "speech" },
    { icon: Monitor, label: "AI Computer Use", id: "computer" },
  ]

  // ✅ Responsive sidebar behavior (same as ChatPage)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch last 3 chats
  useEffect(() => {
    if (!user?.uid) return
    const historyRef = query(ref(rtdb, `chats/${user.uid}`), limitToLast(3))
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.entries(snapshot.val()).map(([id, chat]: any) => ({
          id,
          title: chat.title || "Untitled chat",
          createdAt: chat.createdAt ? Number(chat.createdAt) : Date.now(),
          ...chat,
        }))
        setHistoryItems(data.reverse())
      } else {
        setHistoryItems([])
      }
    })
    return () => unsubscribe()
  }, [user?.uid])

  // Fetch all chats for dialog
  useEffect(() => {
    if (!user?.uid) return
    const chatsRef = ref(rtdb, `chats/${user.uid}`)
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.entries(snapshot.val()).map(([id, chat]: any) => ({
          id,
          title: chat.title || "Untitled chat",
          createdAt: chat.createdAt ? Number(chat.createdAt) : Date.now(),
          ...chat,
        }))
        setAllChats(data.reverse())
      } else {
        setAllChats([])
      }
    })
    return () => unsubscribe()
  }, [user?.uid])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* ✅ Sidebar (Drawer on mobile, fixed on desktop) */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:static top-0 left-0 h-full z-40 w-64 bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 md:translate-x-0`}
      >
        <Sidebar
          isOpen={sidebarOpen}
          userName={userName}
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>


      {/* ✅ Main content */}
      <div className="flex-1 flex flex-col">
        <Header
          title=""
          userName={userName}
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto flex flex-col items-center justify-start px-6 py-16 scroll-smooth">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-gray-100 mb-14 font-['IBM Plex Mono']">
            Choose your AI Assistant
          </h2>

          {/* Assistant Buttons */}
         {/* Assistant Buttons */}
<div className="w-full max-w-2xl mb-20 flex flex-wrap justify-center gap-4">
  {assistants.map((assistant) => {
    const Icon = assistant.icon
    return (
      <button
        key={assistant.id}
        onClick={() => router.push(`/${assistant.id}`)}
        className="flex items-center justify-center gap-3 px-5 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg 
           bg-white dark:bg-gray-900 transition-all duration-200 ease-in-out
           hover:border-purple-500 hover:shadow-md active:scale-95 group 
           active:bg-purple-50 dark:active:bg-gray-800 
           w-full sm:w-auto h-14">

        <Icon
          className="w-6 h-6 mb-2 text-gray-700 dark:text-gray-300 
                     group-hover:text-purple-600 dark:group-hover:text-purple-400 transition"
        />
        <span
          className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center
                     group-hover:text-purple-600 dark:group-hover:text-purple-400 transition"
        >
          {assistant.label}
        </span>
      </button>
    )
  })}
</div>

          <div className="w-full max-w-3xl border-t border-gray-200 dark:border-gray-800 mb-10"></div>

          {/* History Section */}
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <History size={18} /> History
              </h3>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition flex items-center gap-1">
                    View all <span>›</span>
                  </button>
                </DialogTrigger>

                <DialogContent className="max-w-md bg-white dark:bg-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-purple-700 dark:text-purple-400">
                      All Chats
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                    {allChats.length > 0 ? (
                      allChats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => router.push(`/chat/${chat.id}`)}
                          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex justify-between"
                        >
                          <span>{chat.title}</span>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/chat/${item.id}`)}
                    className="p-4 border-l-4 border-l-purple-600 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition cursor-pointer group bg-white dark:bg-gray-900"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition font-['IBM Plex Mono'] line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-300 transition">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "Unknown time"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center col-span-3">
                  No chat history yet.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
