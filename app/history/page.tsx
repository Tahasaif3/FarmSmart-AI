"use client"

import { useState, useEffect } from "react"
import { History, MessageCircle, Trash2, Search, Clock } from "lucide-react"
import { ref, onValue, remove } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { useUser } from "@/app/context/user-context"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount?: number
  messages?: any
}

export default function ChatHistoryPage() {
  const user = useUser()
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const userName = user?.displayName || "User"

  // Responsive sidebar
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

  // Load chats
  useEffect(() => {
    if (!user?.uid) return
    const chatsRef = ref(rtdb, `chats/${user.uid}`)
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const chatList: Chat[] = Object.entries(data).map(([id, chat]: any) => {
          const messageCount = chat.messages ? Object.keys(chat.messages).length : 0
          return {
            id,
            title: chat.title || "Untitled chat",
            createdAt: chat.createdAt || Date.now(),
            updatedAt: chat.updatedAt || Date.now(),
            messageCount,
          }
        })
        chatList.sort((a, b) => b.updatedAt - a.updatedAt)
        setChats(chatList)
        setFilteredChats(chatList)
      } else {
        setChats([])
        setFilteredChats([])
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [user?.uid])

  // Filter chats
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
    } else {
      setFilteredChats(
        chats.filter((chat) =>
          chat.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
  }, [searchQuery, chats])

  // Delete chat
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.uid) return
    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await remove(ref(rtdb, `chats/${user.uid}/${chatId}`))
      } catch (error) {
        console.error("Error deleting chat:", error)
      }
    }
  }

  const handleContinueChat = (chatId: string) => router.push(`/chat?chat=${chatId}`)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
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

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        <Header
          title="Chat History"
          userName={userName}
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            {/* Page Heading */}
            <div className="mb-10 text-center sm:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3 font-['IBM_Plex_Mono']">
                Your Chat History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                Continue your conversations from where you left off
              </p>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search your chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Chat List */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
                  Loading your chats...
                </p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-16">
                <History className="w-20 h-20 text-gray-300 dark:text-gray-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {searchQuery ? "No chats found" : "No chat history yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                  {searchQuery
                    ? "Try searching with different keywords"
                    : "Start chatting with Soft GPT to see your conversations here"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => router.push("/chat")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-md hover:shadow-lg"
                  >
                    Start Your First Chat
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleContinueChat(chat.id)}
                    className="group bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition font-['IBM_Plex_Mono']">
                          {chat.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            {chat.messageCount || 0}{" "}
                            {chat.messageCount === 1 ? "message" : "messages"}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(chat.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="ml-2 sm:ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                        title="Delete this chat"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}