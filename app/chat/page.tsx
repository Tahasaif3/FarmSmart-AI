"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Trash2, Loader } from "lucide-react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { useUser } from "@/app/context/user-context"
import { ref, push, remove, update, onValue, query, orderByChild } from "firebase/database"
import { rtdb } from "@/lib/firebase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
}

export default function ChatPage() {
  const user = useUser()
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string>("")
  const [chatTitle, setChatTitle] = useState("New Chat") // ✅ New state for title
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedPrompts = [
    "Article", "Weather", "Sport", "Press", "Food", "Plants", "Suggest something",
  ]

  const userName = user?.displayName || "User"

  // Load chat (ID from URL)
  useEffect(() => {
    if (!user?.uid) return
    const urlParams = new URLSearchParams(window.location.search)
    const urlChatId = urlParams.get("chat")
    if (urlChatId) {
      setChatId(urlChatId)
      loadChat(urlChatId)
    }
  }, [user?.uid])

  // ✅ Load both messages AND title
  const loadChat = (id: string) => {
    if (!user?.uid) return

    // Load messages
    const messagesRef = query(ref(rtdb, `chats/${user.uid}/${id}/messages`), orderByChild("timestamp"))
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const msgs = Object.entries(data).map(([key, msg]: any) => ({
          id: key, ...msg,
        }))
        setMessages(msgs)
        scrollToBottom()
      }
    })

    // Load chat title
    const chatRef = ref(rtdb, `chats/${user.uid}/${id}`)
    const unsubscribeChat = onValue(chatRef, (snapshot) => {
      const chatData = snapshot.val()
      setChatTitle(chatData?.title || "New Chat")
    })

    return () => {
      unsubscribeMessages()
      unsubscribeChat()
    }
  }

  const createNewChat = async (): Promise<string> => {
    if (!user?.uid) return ""
    try {
      const chatsRef = ref(rtdb, `chats/${user.uid}`)
      const newChatRef = push(chatsRef)
      const title = "New Chat"
      await update(newChatRef, {
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: {},
      })
      setChatId(newChatRef.key || "")
      setChatTitle(title)
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
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message,
          language: "auto",
          location: "Lahore",
        }),
      })
      if (!response.ok) throw new Error("API request failed")
      const data = await response.json()
      return data.response || data.message || data.result || "I'm not sure how to help with that."
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
    const userMsg = { id: Date.now().toString(), type: "user" as const, content: trimmedInputValue, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    scrollToBottom()

    try {
      await saveMessageToFirebase("user", trimmedInputValue, currentChatId)

      const aiResponse = await callAIEndpoint(trimmedInputValue)
      const assistantMsg = { id: Date.now().toString(), type: "assistant" as const, content: aiResponse, timestamp: Date.now() }
      setMessages((prev) => [...prev, assistantMsg])
      await saveMessageToFirebase("assistant", aiResponse, currentChatId)

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
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const deleteChat = async () => {
    if (!user?.uid || !chatId) return
    try {
      await remove(ref(rtdb, `chats/${user.uid}/${chatId}`))
      setChatId("")
      setMessages([])
      window.history.back()
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  // Auto-update chat title after first user message
  useEffect(() => {
    if (messages.length === 1 && chatId && user?.uid) {
      const firstUserMsg = messages.find((m) => m.type === "user")
      if (firstUserMsg) {
        const newTitle = firstUserMsg.content.length > 30
          ? firstUserMsg.content.substring(0, 30) + "..."
          : firstUserMsg.content
        setChatTitle(newTitle)
        update(ref(rtdb, `chats/${user.uid}/${chatId}`), { title: newTitle })
      }
    }
  }, [messages, chatId, user?.uid])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
        {/* ✅ Updated Header: Show dynamic chat title */}
        <Header
          title={chatTitle}
          userName={userName}
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

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
                  placeholder="Message FarmSmart AI"
                  disabled={isLoading}
                  className="flex-1 text-sm sm:text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent disabled:opacity-50"
                />
                <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block" />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || isSending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition disabled:opacity-50"
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
              {/* ✅ Removed "Chat History" — now only shows delete button */}
              <div className="flex justify-end mb-4 sm:mb-6">
                <button
                  onClick={deleteChat}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete this chat"
                >
                  <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="group relative max-w-[90%] sm:max-w-[80%]">
                    <div className="flex items-start gap-2 mb-1">
                      {message.type === "user" ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5">
                          Y
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-green-800 text-xs font-medium flex-shrink-0 mt-0.5">
                          F
                        </div>
                      )}
                      <span
                        className={`text-xs font-medium ${
                          message.type === "user"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {message.type === "user" ? "You" : "FarmSmart AI"}
                      </span>
                    </div>

                    <div
                      className={`p-3 sm:p-4 rounded-2xl shadow-sm transition ${
                        message.type === "user"
                          ? "ml-auto bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200 rounded-br-none"
                          : "mr-auto bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                    </div>

                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 p-1"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 ml-auto mr-0 max-w-[90%] sm:max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                    <span className="text-sm sm:text-base">FarmSmart AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
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
              placeholder="Message FarmSmart AI"
              disabled={isLoading}
              className="flex-1 text-sm sm:text-base outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent px-2 sm:px-3 disabled:opacity-50"
            />
            <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 hidden sm:block" />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition disabled:opacity-50 flex-shrink-0"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}