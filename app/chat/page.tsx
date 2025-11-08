"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Trash2, Loader } from "lucide-react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import ChatMessage from "@/components/chat-message"
import { useUser } from "@/app/context/user-context"
import { ref, push, remove, update, onValue, query, orderByChild } from "firebase/database"
import { rtdb } from "@/lib/firebase"

const API_BASE_URL = "https://tahasaif3-softgpt.hf.space"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
}

interface Chat {
  title: string
  createdAt: number
  updatedAt: number
}

export default function ChatPage() {
  const user = useUser()
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string>("")
  const [chatTitle, setChatTitle] = useState<string>("New Chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedPrompts = [
    "Article", "Weather", "Sport", "Press", "Food", "Plants", "Suggest something",
  ]

  const userName = user?.displayName || "User"

  useEffect(() => {
    if (!user?.uid) return
    const urlParams = new URLSearchParams(window.location.search)
    const urlChatId = urlParams.get("chat")
    if (urlChatId) {
      setChatId(urlChatId)
      loadChatHistory(urlChatId)
      loadChatTitle(urlChatId)
    }
  }, [user?.uid])

  const loadChatTitle = (id: string) => {
    if (!user?.uid) return
    const chatRef = ref(rtdb, `chats/${user.uid}/${id}`)
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val() as Chat
      if (data?.title) {
        setChatTitle(data.title)
      }
    })
    return unsubscribe
  }

  const loadChatHistory = (id: string) => {
    if (!user?.uid) return
    const messagesRef = query(ref(rtdb, `chats/${user.uid}/${id}/messages`), orderByChild("timestamp"))
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const msgs = Object.entries(data).map(([key, msg]: any) => ({
          id: key, ...msg,
        }))
        setMessages(msgs)
        scrollToBottom()
      }
    })
    return unsubscribe
  }

  const createNewChat = async (): Promise<string> => {
    if (!user?.uid) return ""
    try {
      const chatsRef = ref(rtdb, `chats/${user.uid}`)
      const newChatRef = push(chatsRef)
      await update(newChatRef, {
        title: "New Chat", createdAt: Date.now(), updatedAt: Date.now(), messages: {},
      })
      setChatId(newChatRef.key || "")
      setChatTitle("New Chat")
      setMessages([])
      return newChatRef.key || ""
    } catch (error) {
      console.error("Error creating chat:", error)
      return ""
    }
  }

  const saveMessageToFirebase = async (
    type: "user" | "assistant",
    content: string,
    chatIdParam?: string
  ) => {
    const id = chatIdParam || chatId
    if (!user?.uid || !id) return
    try {
      const messageRef = ref(rtdb, `chats/${user.uid}/${id}/messages`)
      const newMsgRef = push(messageRef)
      const message: Message = {
        id: newMsgRef.key || "", type, content, timestamp: Date.now(),
      }
      await update(newMsgRef, message)
      await update(ref(rtdb, `chats/${user.uid}/${id}`), { updatedAt: Date.now() })
      return message
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  const callAIEndpoint = async (message: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, user_id: user?.uid || "anonymous" }),
      })
      if (!response.ok) throw new Error("API request failed")
      const data = await response.json()
      return data.response || "Unable to process your request"
    } catch (error) {
      console.error("API Error:", error)
      return "Sorry, I encountered an error. Please try again."
    }
  }

  const handleSendMessage = async () => {
    const trimmedInputValue = inputValue.trim()
    if (!trimmedInputValue || !user?.uid || isSending) return

    setIsSending(true)
    setIsLoading(true)
    let currentChatId = chatId

    if (!currentChatId) {
      currentChatId = await createNewChat()
      if (!currentChatId) {
        setIsSending(false)
        setIsLoading(false)
        return
      }
    }

    setInputValue("")

    try {
      const userMsg = await saveMessageToFirebase("user", trimmedInputValue, currentChatId)
      if (userMsg) setMessages((prev) => [...prev, userMsg])
      scrollToBottom()

      const aiResponse = await callAIEndpoint(trimmedInputValue)
      const assistantMsg = await saveMessageToFirebase("assistant", aiResponse, currentChatId)
      if (assistantMsg) setMessages((prev) => [...prev, assistantMsg])

      scrollToBottom()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
      setIsLoading(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user?.uid || !chatId) return
    try {
      await remove(ref(rtdb, `chats/${user.uid}/${chatId}/messages/${messageId}`))
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const deleteChat = async () => {
    if (!user?.uid || !chatId) return
    try {
      await remove(ref(rtdb, `chats/${user.uid}/${chatId}`))
      setChatId("")
      setChatTitle("New Chat")
      setMessages([])
      window.history.back()
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  useEffect(() => {
    if (messages.length === 1 && chatId && user?.uid) {
      const firstUserMsg = messages.find((m) => m.type === "user")
      if (firstUserMsg) {
        const newTitle = firstUserMsg.content.substring(0, 50)
        setChatTitle(newTitle)
        update(ref(rtdb, `chats/${user.uid}/${chatId}`), { title: newTitle })
      }
    }
  }, [messages, chatId, user?.uid])

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-gray-900 overflow-hidden">
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

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
        <Header
          title="AI Chat"
          userName={userName}
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Chat Title Bar - Only visible when messages exist */}
        {messages.length > 0 && (
          <div className="border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate flex-1">
              {chatTitle}
            </h3>
            <button
              onClick={deleteChat}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex-shrink-0 ml-2"
              title="Delete chat"
            >
              <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        )}

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full px-2 sm:px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 sm:mb-10 font-mono">
                What can I help with?
              </h2>

              <div className="flex items-center gap-2 sm:gap-3 border border-gray-300 dark:border-gray-700 rounded-xl px-3 sm:px-4 md:px-5 py-2 sm:py-3 bg-transparent w-full max-w-[95%] sm:max-w-[700px] md:max-w-[950px]">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Message Soft GPT"
                  disabled={isLoading}
                  className="flex-1 text-sm sm:text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent disabled:opacity-50"
                />
                <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block" />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || isSending}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInputValue(prompt)}
                    disabled={isLoading}
                    className="border border-gray-300 dark:border-gray-700 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-3 sm:px-6 py-4 sm:py-6">
              <div className="space-y-4 sm:space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="group relative">
                    <ChatMessage message={message} />
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 p-1"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span className="text-sm sm:text-base">Soft GPT is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Fixed at Bottom */}
        {messages.length > 0 && (
          <div className="border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 sm:p-4 flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Message Soft GPT"
              disabled={isLoading}
              className="flex-1 text-sm sm:text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent px-2 sm:px-3 disabled:opacity-50"
            />
            <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block" />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition disabled:opacity-50 flex-shrink-0"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
