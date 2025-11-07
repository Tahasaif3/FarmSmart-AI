"use client"

interface ChatMessageProps {
  message: {
    id: string
    type: "user" | "assistant"
    content: string
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md px-4 py-2 rounded-lg ${
          message.type === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  )
}
