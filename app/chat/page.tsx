"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Trash2, Loader } from 'lucide-react'
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
  const [chatTitle, setChatTitle] = useState("New Chat")
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
      loadChat(urlChatId)
    }
  }, [user?.uid])

  const loadChat = (id: string) => {
    if (!user?.uid) return

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
<div className="flex flex-col md:flex-row h-screen bg-gradient-primary overflow-hidden">
  {/* Sidebar */}
  <div
    className={`${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    } fixed md:static top-0 left-0 h-full z-40 w-64 transition-transform duration-300 md:translate-x-0`}
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
    <Header
      title={chatTitle}
      userName={userName}
      user={user}
      onMenuClick={() => setSidebarOpen(!sidebarOpen)}
    />

    {/* Chat Messages */}
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0f1f14] via-[#228B22]/10 to-[#4CBB17]/5 p-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center h-full px-2 sm:px-4 py-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#b8e6b8] mb-8 sm:mb-10 font-mono animate-float">
            What can I help with?
          </h2>

          <div className="flex items-center gap-2 sm:gap-3 border-2 border-[#4CBB17] rounded-2xl px-3 sm:px-4 md:px-5 py-2 sm:py-3 bg-[#1a3a1a]/80 w-full max-w-[95%] sm:max-w-[700px] md:max-w-[950px] shadow-lg shadow-[#228B22]/40 hover:shadow-xl transition-all backdrop-blur-md">
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
              placeholder="Message Soft GPT AI..."
              disabled={isLoading}
              className="flex-1 text-sm sm:text-base outline-none text-[#b8e6b8] placeholder-[#b8e6b8]/70 bg-transparent disabled:opacity-50"
            />
            <Paperclip className="w-5 h-5 text-[#4CBB17] cursor-pointer hover:text-[#228B22] hidden sm:block transition animate-glow" />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || isSending}
              className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] hover:from-[#4CBB17] hover:to-[#228B22] text-white p-2 cursor-pointer rounded-lg transition shadow-lg shadow-[#228B22]/50 hover:shadow-xl hover:shadow-[#4CBB17]/60 disabled:opacity-50 transform hover:scale-105"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>

          {/* Suggested Prompts */}
          <div className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-2 sm:gap-3">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={prompt}
                onClick={() => setInputValue(prompt)}
                disabled={isLoading}
                className="border-2 border-[#4CBB17] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm text-[#b8e6b8] hover:bg-[#228B22]/40 hover:text-white transition disabled:opacity-50 animate-slide-in-up shadow-md hover:shadow-lg hover:shadow-[#228B22]/40 transform hover:scale-105"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
          {/* Delete Chat Button */}
          <div className="flex justify-end mb-4 sm:mb-6">
            <button
              onClick={deleteChat}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition transform hover:scale-110 animate-fade-in"
              title="Delete this chat"
            >
              <Trash2 className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
          </div>

          {/* Messages */}
          {messages.map((message, idx) => (
            <div
              key={message.id}
              className={`group relative max-w-[90%] sm:max-w-[80%] ${
                message.type === "user" ? "ml-auto" : "mr-auto"
              } animate-slide-in-up`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start gap-2 mb-2">
                {message.type === "user" ? (
                  <div className="ml-auto mr-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#4CBB17] to-[#228B22] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-[#228B22]/60">
                    U
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#228B22] to-[#4CBB17] border-2 border-[#4CBB17] flex items-center justify-center text-[#0f1f14] text-xs font-bold flex-shrink-0 shadow-lg shadow-[#228B22]/50">
                    AI
                  </div>
                )}
                <span
                  className={`text-xs font-semibold ${
                    message.type === "user" ? "text-[#b8e6b8] ml-auto" : "text-[#b8e6b8]"
                  }`}
                >
                  {message.type === "user" ? "You" : "Soft GPT"}
                </span>
              </div>

              <div
                className={`p-4 sm:p-5 rounded-2xl shadow-lg transition transform hover:scale-102 ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-[#228B22] to-[#4CBB17] text-[#0f1f14] rounded-br-none shadow-[#228B22]/50 hover:shadow-[#4CBB17]/60 hover:shadow-xl"
                    : "bg-[#1a3a1a]/80 text-[#b8e6b8] rounded-bl-none border border-[#4CBB17]/50 shadow-[#228B22]/30 hover:shadow-[#228B22]/50 hover:shadow-xl backdrop-blur-sm glass-morphism"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed font-medium">
                  {message.content}
                </p>
              </div>

              <button
                onClick={() => deleteMessage(message.id)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transform hover:scale-110"
                title="Delete message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-[#b8e6b8] max-w-[90%] sm:max-w-[80%] animate-fade-in">
              <div className="flex space-x-2">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
              <span className="text-sm sm:text-base font-medium">Soft GPT is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input bar for ongoing chat */}
      {messages.length > 0 && (
        <div className="border-t-2 border-[#4CBB17]/50 bg-gradient-to-r from-[#0f1f14] via-[#228B22]/20 to-[#4CBB17]/10 p-2 sm:p-4 flex items-center gap-2 sm:gap-3 flex-shrink-0 shadow-lg shadow-[#228B22]/40 backdrop-blur-sm glass-morphism animate-slide-in-up">
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
            placeholder="Message Soft GPT AI..."
            disabled={isLoading}
            className="flex-1 text-sm sm:text-base outline-none text-[#b8e6b8] placeholder-[#b8e6b8]/70 bg-transparent px-2 sm:px-3 disabled:opacity-50"
          />
          <Paperclip className="w-5 h-5 text-[#4CBB17] cursor-pointer hover:text-[#228B22] hidden sm:block transition animate-glow" />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] hover:from-[#4CBB17] hover:to-[#228B22] text-white p-2 rounded-lg transition flex-shrink-0 shadow-lg shadow-[#228B22]/50 hover:shadow-xl hover:shadow-[#4CBB17]/60 disabled:opacity-50 transform hover:scale-105"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  </div>
</div>

  )
}
