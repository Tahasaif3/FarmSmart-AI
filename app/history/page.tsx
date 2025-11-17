"use client"

import { useState, useEffect } from "react"
import { History, MessageCircle, Trash2, Search, Clock } from 'lucide-react'
import { ref, onValue, remove } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { useUser } from "@/app/context/user-context"
import { useRouter } from 'next/navigation'
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
    <div className="flex h-screen bg-gradient-to-br from-[#0f1f14] via-[#228B22] to-[#4CBB17]">
      {/* Sidebar */}
  {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
 <div
        className={`fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          isOpen={sidebarOpen}
          userName={userName}
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <Header
        title="History"
          userName={userName}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={{ name: userName }}
          sidebarOpen={sidebarOpen} // ✅ Pass it here

        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            {/* Page Heading */}
            <div className="mb-10 text-center sm:text-left opacity-0 animate-[slideInUp_0.6s_ease-out_forwards] delay-100">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#e8f5e9] to-white bg-clip-text text-transparent mb-3 font-['IBM_Plex_Mono']">
                Your Chat History
              </h1>
              <p className="text-[#c8e6c9] text-base sm:text-lg">
                Continue your conversations from where you left off
              </p>
            </div>

            {/* Search */}
            <div className="mb-8 opacity-0 animate-[slideInUp_0.6s_ease-out_0.2s_forwards]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#81c784]" />
                <input
                  type="text"
                  placeholder="Search your chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-[#4CBB17] rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-[#a5d6a7] focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition duration-300"
                />
              </div>
            </div>

            {/* Chat List */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                <p className="mt-4 text-[#c8e6c9] text-lg">
                  Loading your chats...
                </p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
                <History className="w-20 h-20 text-white/30 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">
                  {searchQuery ? "No chats found" : "No chat history yet"}
                </h3>
                <p className="text-[#c8e6c9] mb-8 text-lg">
                  {searchQuery
                    ? "Try searching with different keywords"
                    : "Start chatting with Soft GPT to see your conversations here"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => router.push("/chat")}
                    className="bg-white text-[#228B22] hover:bg-[#e8f5e9] px-8 py-3 rounded-lg font-bold transition shadow-lg hover:shadow-xl hover:scale-105 transform duration-300"
                  >
                    Start Your First Chat
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChats.map((chat, index) => (
                  <div
                    key={chat.id}
                    onClick={() => handleContinueChat(chat.id)}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                    className="group opacity-0 animate-[slideInUp_0.5s_ease-out_forwards] bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-xl p-5 sm:p-6 hover:border-white/40 hover:bg-white/15 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-[#4CBB17]/50 hover:scale-102 transform"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#e8f5e9] transition duration-300 font-['IBM_Plex_Mono']">
                          {chat.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-[#c8e6c9]">
                          <span className="flex items-center gap-2 hover:text-white transition">
                            <MessageCircle className="w-4 h-4" />
                            {chat.messageCount || 0}{" "}
                            {chat.messageCount === 1 ? "message" : "messages"}
                          </span>
                          <span className="hidden sm:inline text-white/40">•</span>
                          <span className="flex items-center gap-2 hover:text-white transition">
                            <Clock className="w-4 h-4" />
                            {formatDate(chat.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="ml-2 sm:ml-4 p-2 text-[#c8e6c9] hover:text-white hover:bg-red-500/30 rounded-lg transition opacity-0 group-hover:opacity-100 duration-300 hover:scale-110 transform"
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