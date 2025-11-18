"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Trash2, Loader, X, FileText, Image as ImageIcon } from 'lucide-react';
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useUser } from "@/app/context/user-context";
import { ref, push, remove, update, onValue, query, orderByChild, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getDayName = () => {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
};

const detectCategory = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("crop") || lower.includes("harvest") || lower.includes("yield")) return "Crop Management";
  if (lower.includes("weather") || lower.includes("rain") || lower.includes("forecast")) return "Weather Forecast";
  if (lower.includes("soil") || lower.includes("nutrient") || lower.includes("ph")) return "Soil Health";
  if (lower.includes("pest") || lower.includes("disease") || lower.includes("insect")) return "Pest Control";
  if (lower.includes("water") || lower.includes("irrigation") || lower.includes("drip")) return "Irrigation Tips";
  if (lower.includes("sustain") || lower.includes("eco") || lower.includes("organic")) return "Sustainable Farming";
  return "Other";
};

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: string;
}

export default function ChatPage() {
  const user = useUser();
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string>("");
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // 🔥 NEW: Session ID state
  const [sessionId, setSessionId] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedPrompts = [
    "Crop Management",
    "Weather Forecast",
    "Soil Health",
    "Pest Control",
    "Irrigation Tips",
    "Sustainable Farming",
    "Suggest Something",
  ];

  const userName = user?.displayName || "User";

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlChatId = urlParams.get("chat");
    if (urlChatId) {
      setChatId(urlChatId);
      loadChat(urlChatId);
    }
  }, [user?.uid]);

  // 🔥 UPDATED: Load chat with session restoration
  const loadChat = (id: string) => {
    if (!user?.uid) return;

    const messagesRef = query(ref(rtdb, `chats/${user.uid}/${id}/messages`), orderByChild("timestamp"));
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.entries(data).map(([key, msg]: any) => ({
          id: key, ...msg,
        }));
        setMessages(msgs);
        scrollToBottom();
      }
    });

    const chatRef = ref(rtdb, `chats/${user.uid}/${id}`);
    const unsubscribeChat = onValue(chatRef, (snapshot) => {
      const chatData = snapshot.val();
      setChatTitle(chatData?.title || "New Chat");
      
      // 🔥 NEW: Restore session_id from Firebase
      if (chatData?.session_id) {
        setSessionId(chatData.session_id);
        console.log("♻️ Restored session:", chatData.session_id);
      } else {
        // Clear session for old chats without session_id
        setSessionId("");
        console.log("🆕 No session found - will create new");
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeChat();
    };
  };

  // 🔥 UPDATED: Create new chat and clear session
  const createNewChat = async (): Promise<string> => {
    if (!user?.uid) return "";
    try {
      const chatsRef = ref(rtdb, `chats/${user.uid}`);
      const newChatRef = push(chatsRef);
      const title = "New Chat";
      await update(newChatRef, {
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: {},
        session_id: "", // Initialize empty session
      });
      setChatId(newChatRef.key || "");
      setChatTitle(title);
      setMessages([]);
      
      // 🔥 NEW: Clear session for new chat
      setSessionId("");
      console.log("🆕 New chat created - session cleared");
      
      return newChatRef.key || "";
    } catch (error) {
      console.error("Error creating chat:", error);
      return "";
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_preset");
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    
    if (!response.ok) throw new Error("Cloudinary upload failed");
    
    const data = await response.json();
    return data.secure_url;
  };

  const saveFileToFirebase = async (fileUrl: string, fileName: string, fileType: string) => {
    if (!user?.uid) return;
    
    try {
      const filesRef = ref(rtdb, `files/${user.uid}`);
      const newFileRef = push(filesRef);
      
      await update(newFileRef, {
        url: fileUrl,
        name: fileName,
        type: fileType,
        uploadedAt: Date.now(),
        chatId: chatId || "",
      });
      
      return newFileRef.key;
    } catch (error) {
      console.error("Error saving file to Firebase:", error);
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      toast.error('Please upload only PDF, DOC, or DOCX files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    toast.success('File selected successfully!');

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({
        file,
        preview: e.target?.result as string,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveMessageToFirebase = async (
    type: "user" | "assistant",
    content: string,
    chatIdParam?: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ) => {
    const id = chatIdParam || chatId;
    if (!user?.uid || !id) return;
    try {
      const messageRef = ref(rtdb, `chats/${user.uid}/${id}/messages`);
      const newMsgRef = push(messageRef);
      const message: Message = {
        id: newMsgRef.key || "",
        type,
        content,
        timestamp: Date.now(),
        ...(fileUrl && { fileUrl, fileName, fileType }),
      };
      await update(newMsgRef, message);
      await update(ref(rtdb, `chats/${user.uid}/${id}`), { updatedAt: Date.now() });
      return message;
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // 🔥 NEW: Save session to Firebase
  const saveSessionToFirebase = async (newSessionId: string) => {
    if (!user?.uid || !chatId) return;
    try {
      await update(ref(rtdb, `chats/${user.uid}/${chatId}`), {
        session_id: newSessionId,
        sessionUpdatedAt: Date.now()
      });
      console.log("💾 Session saved to Firebase:", newSessionId);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  // 🔥 UPDATED: Call AI endpoint with session management
  const callAIEndpoint = async (message: string, fileUrl?: string) => {
    try {
      if (fileUrl && uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile.file);
        formData.append("question", message);
        formData.append("language", "auto");
        
        // 🔥 NEW: Include session_id if available
        if (sessionId) {
          formData.append("session_id", sessionId);
          console.log("📤 Sending session_id with file:", sessionId);
        }

        const response = await fetch(`${API_BASE_URL}/upload_and_query`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("File query API failed");
        const data = await response.json();
        
        // 🔥 NEW: Store session_id from response
        if (data.session_id) {
          if (!sessionId) {
            setSessionId(data.session_id);
            await saveSessionToFirebase(data.session_id);
            console.log("✅ Session started (file):", data.session_id);
          } else {
            console.log("♻️ Session continued (file):", data.session_id);
          }
        }
        
        return data.answer || "I couldn't analyze the document. Please try again.";
      }

      // 🔥 UPDATED: Regular query with session_id
      console.log("📤 Sending query with session_id:", sessionId || "none");
      
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message,
          language: "auto",
          location: "Lahore",
          session_id: sessionId || undefined, // 🔥 Send session_id if available
        }),
      });
      
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      
      // 🔥 NEW: Store session_id from first response
      if (data.session_id) {
        if (!sessionId) {
          setSessionId(data.session_id);
          await saveSessionToFirebase(data.session_id);
          console.log("✅ Session started:", data.session_id);
        } else if (data.session_id !== sessionId) {
          console.warn("⚠️ Session ID changed:", sessionId, "→", data.session_id);
          setSessionId(data.session_id);
          await saveSessionToFirebase(data.session_id);
        } else {
          console.log("♻️ Session continued:", data.session_id);
        }
      }
      
      return data.response || data.message || data.result || "I'm not sure how to help with that.";
    } catch (error) {
      console.error("API Error:", error);
      return "Sorry, I encountered an error. Please try again.";
    }
  };

  const updateStats = async (userId: string, userMessage: string) => {
    if (!userId) return;

    const statsRef = ref(rtdb, `userStats/${userId}`);
    const snapshot = await get(statsRef);
    const current = snapshot.val() || {};

    const newTotal = (current.totalQueriesToday || 0) + 1;
    const category = detectCategory(userMessage);
    const toolCounts = current.toolUsage || {};
    toolCounts[category] = (toolCounts[category] || 0) + 1;

    let mostUsedTool = "AI Chat";
    let maxCount = 0;
    for (const [tool, count] of Object.entries(toolCounts)) {
      if ((count as number) > maxCount) {
        maxCount = count as number;
        mostUsedTool = tool;
      }
    }

    const today = getDayName();
    const timeUsage = current.usageOverTime || {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
    };
    timeUsage[today] = (timeUsage[today] || 0) + 1;

    const usedQueries = newTotal;
    const totalQueries = 1000;

    await update(statsRef, {
      totalQueriesToday: newTotal,
      mostUsedTool,
      toolUsage: toolCounts,
      usageOverTime: timeUsage,
      queryUsage: { used: usedQueries, total: totalQueries },
      updatedAt: Date.now(),
    });
  };

  const handleSendMessage = async () => {
    const trimmedInputValue = inputValue.trim();
    if ((!trimmedInputValue && !uploadedFile) || !user?.uid || isSending) return;

    setIsSending(true);
    setIsLoading(true);
    setIsUploading(true);
    let currentChatId = chatId;

    if (!currentChatId) {
      currentChatId = await createNewChat();
      if (!currentChatId) {
        setIsSending(false);
        setIsLoading(false);
        setIsUploading(false);
        return;
      }
    }

    try {
      let fileUrl = "";
      let fileName = "";
      let fileType = "";

      if (uploadedFile) {
        fileUrl = await uploadToCloudinary(uploadedFile.file);
        fileName = uploadedFile.file.name;
        fileType = uploadedFile.file.type;
        await saveFileToFirebase(fileUrl, fileName, fileType);
      }

      const messageContent = trimmedInputValue || `Uploaded ${fileName}`;
      
      setInputValue("");
      const userMsg = {
        id: Date.now().toString(),
        type: "user" as const,
        content: messageContent,
        timestamp: Date.now(),
        ...(fileUrl && { fileUrl, fileName, fileType }),
      };
      setMessages((prev) => [...prev, userMsg]);
      scrollToBottom();

      await saveMessageToFirebase("user", messageContent, currentChatId, fileUrl, fileName, fileType);
      await updateStats(user.uid, messageContent);

      setIsUploading(false);

      const aiResponse = await callAIEndpoint(messageContent, fileUrl);
      const assistantMsg = {
        id: Date.now().toString(),
        type: "assistant" as const,
        content: aiResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessageToFirebase("assistant", aiResponse, currentChatId);

      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user?.uid || !chatId) return;
    try {
      await remove(ref(rtdb, `chats/${user.uid}/${chatId}/messages/${messageId}`));
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // 🔥 UPDATED: Clear session when deleting chat
  const deleteChat = async () => {
    if (!user?.uid || !chatId) return;
    try {
      await remove(ref(rtdb, `chats/${user.uid}/${chatId}`));
      setChatId("");
      setMessages([]);
      setSessionId(""); // 🔥 Clear session
      console.log("🗑️ Chat deleted - session cleared");
      window.history.back();
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  useEffect(() => {
    if (messages.length === 1 && chatId && user?.uid) {
      const firstUserMsg = messages.find((m) => m.type === "user");
      if (firstUserMsg) {
        const newTitle = firstUserMsg.content.length > 30
          ? firstUserMsg.content.substring(0, 30) + "..."
          : firstUserMsg.content;
        setChatTitle(newTitle);
        update(ref(rtdb, `chats/${user.uid}/${chatId}`), { title: newTitle });
      }
    }
  }, [messages, chatId, user?.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderFilePreview = (msg: Message) => {
    if (!msg.fileUrl) return null;

    const isImage = msg.fileType?.startsWith('image/');
    const isPDF = msg.fileType === 'application/pdf';

    return (
      <div className="mt-2 mb-2">
        {isImage && (
          <img
            src={msg.fileUrl}
            alt={msg.fileName}
            className="max-w-xs rounded-lg border-2 border-[#4CBB17]/30 cursor-pointer hover:opacity-80 transition"
            onClick={() => window.open(msg.fileUrl, '_blank')}
          />
        )}
        {isPDF && (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-[#228B22]/20 rounded-lg border border-[#4CBB17]/30 hover:bg-[#228B22]/30 transition"
          >
            <FileText className="w-5 h-5 text-[#4CBB17]" />
            <span className="text-sm">{msg.fileName}</span>
          </a>
        )}
        {!isImage && !isPDF && (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#4CBB17] hover:underline"
          >
            📎 {msg.fileName}
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0f1f14] via-[#1b3a1b]/10 to-[#4CBB17]/5 text-[#b8e6b8]">
<ToastContainer
  position="top-center"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop={false}
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="dark"
  style={{ width: '100%' }} // optional: ensures full-width centering on mobile
  toastStyle={{
    background: 'linear-gradient(to right, #228B22, #4CBB17)',
    color: '#0f1f14',
    fontWeight: 'bold',
    borderRadius: '1rem',
    boxShadow: '0 4px 20px rgba(34, 139, 34, 0.5)',
    backdropFilter: 'blur(4px)',
    border: '1px solid #4CBB17',
  }}
/>      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mobile Overlay */}
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
          title="Chat"
          userName={userName}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={{ name: userName }}
          sidebarOpen={sidebarOpen}
        />

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full px-2 sm:px-4 py-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#b8e6b8] mb-6 sm:mb-8 font-mono animate-float">
                What can I help with?
              </h2>

              {uploadedFile && (
                <div className="mb-4">
                  <div className="flex items-center gap-3 bg-[#1a3a1a]/80 border-2 border-[#4CBB17] rounded-lg p-3">
                    {uploadedFile.type.startsWith('image/') ? (
                      <ImageIcon className="w-6 h-6 text-[#4CBB17]" />
                    ) : (
                      <FileText className="w-6 h-6 text-[#4CBB17]" />
                    )}
                    <span className="text-sm text-[#b8e6b8]">{uploadedFile.file.name}</span>
                    <button
                      onClick={removeFile}
                      className="ml-2 p-1 hover:bg-red-500/20 rounded-full transition"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 sm:gap-3 border-2 border-[#4CBB17] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 bg-[#1a3a1a]/80 w-full max-w-[95%] sm:max-w-[700px] md:max-w-[950px] shadow-lg shadow-[#228B22]/40 hover:shadow-xl transition-all backdrop-blur-md">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message FarmSmart AI..."
                  disabled={isLoading}
                  className="flex-1 text-sm sm:text-base outline-none text-[#b8e6b8] placeholder-[#b8e6b8]/70 bg-transparent disabled:opacity-50"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="hover:bg-[#228B22]/20 p-2 rounded-lg transition"
                >
                  <Paperclip className="w-5 h-5 text-[#4CBB17] cursor-pointer hover:text-[#228B22] transition animate-glow" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || isSending}
                  className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] hover:from-[#4CBB17] hover:to-[#228B22] text-white p-2 rounded-lg transition shadow-lg shadow-[#228B22]/50 hover:shadow-xl hover:shadow-[#4CBB17]/60 disabled:opacity-50 transform hover:scale-105"
                >
                  {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
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
            <div className="px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-4">
              <div className="flex justify-end mb-3 sm:mb-4">
                <button
                  onClick={deleteChat}
                  className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/20 rounded-lg transition transform hover:scale-110 animate-fade-in"
                  title="Delete this chat"
                >
                  <Trash2 className="w-5 sm:w-6 h-5 sm:h-6" />
                </button>
              </div>

              {messages.map((message, idx) => (
                <div
                  key={message.id}
                  className={`group flex flex-col ${message.type === "user" ? "items-end" : "items-start"}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CBB17] to-[#228B22] flex items-center justify-center text-white text-xs mb-1 font-bold shadow-lg shadow-[#228B22]/60">
                        You
                      </div>
                    ) : (
                      <div className="w-8 h-8 mb-2 rounded-full bg-gradient-to-br from-[#228B22] to-[#4CBB17] border-2 border-[#4CBB17] flex items-center justify-center text-[#0f1f14] text-xs font-bold shadow-lg shadow-[#228B22]/50">
                        AI
                      </div>
                    )}
                  </div>

                  <div className="relative inline-block">
                    <div
                      className={`p-3 sm:p-4 rounded-2xl shadow-lg transition transform hover:scale-102 ${
                        message.type === "user"
                          ? "bg-gradient-to-br from-[#228B22] to-[#4CBB17] text-[#0f1f14] rounded-br-none shadow-[#228B22]/50 hover:shadow-[#4CBB17]/60 hover:shadow-xl"
                          : "bg-[#1a3a1a]/80 text-[#b8e6b8] rounded-bl-none border border-[#4CBB17]/50 shadow-[#228B22]/30 hover:shadow-[#228B22]/50 hover:shadow-xl backdrop-blur-sm"
                      }`}
                    >
                      {renderFilePreview(message)}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-[#b8e6b8] max-w-[90%] sm:max-w-[80%] animate-fade-in">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                  <span className="text-sm font-medium">
                    {isUploading ? "Uploading file..." : "Soft GPT is thinking..."}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div className="border-t-2 border-[#4CBB17]/50 bg-gradient-to-r from-[#0f1f14] via-[#228B22]/20 to-[#4CBB17]/10 p-2 sm:p-3 flex-shrink-0 shadow-lg shadow-[#228B22]/40 backdrop-blur-sm">
            {uploadedFile && (
              <div className="mb-2 flex items-center gap-2 bg-[#1a3a1a]/60 border border-[#4CBB17]/30 rounded-lg p-2">
                {uploadedFile.type.startsWith('image/') ? (
                  <ImageIcon className="w-5 h-5 text-[#4CBB17]" />
                ) : (
                  <FileText className="w-5 h-5 text-[#4CBB17]" />
                )}
                <span className="text-xs text-[#b8e6b8] flex-1 truncate">{uploadedFile.file.name}</span>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-red-500/20 rounded-full transition"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={uploadedFile ? "Ask about this file..." : "Message FarmSmart AI..."}
                disabled={isLoading}
                className="flex-1 text-sm outline-none text-[#b8e6b8] placeholder-[#b8e6b8]/70 bg-transparent px-2 sm:px-3 disabled:opacity-50"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="hover:bg-[#228B22]/20 p-2 rounded-lg transition"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5 text-[#4CBB17] hover:text-[#228B22] transition" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputValue.trim() && !uploadedFile)}
                className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] hover:from-[#4CBB17] hover:to-[#228B22] text-white p-2 rounded-lg transition flex-shrink-0 shadow-lg shadow-[#228B22]/50 hover:shadow-xl hover:shadow-[#4CBB17]/60 disabled:opacity-50 transform hover:scale-105"
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}