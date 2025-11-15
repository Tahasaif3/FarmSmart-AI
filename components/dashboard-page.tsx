"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function DashboardPage({ user }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [tipDialogOpen, setTipDialogOpen] = useState(false)
  const [currentTip, setCurrentTip] = useState(0) // 0 = first tip, 1 = second tip
  const userName = user?.displayName || "User"

  const usageOverTimeData = [
    { day: "Mon", value: 25 },
    { day: "Tue", value: 50 },
    { day: "Wed", value: 30 },
    { day: "Thu", value: 55 },
    { day: "Fri", value: 45 },
    { day: "Sat", value: 50 },
    { day: "Sun", value: 90 },
  ]

  const mostUsedAIData = [
    { name: "AI Coding", value: 35, fill: "#059669" },
    { name: "AI Chat", value: 25, fill: "#047857" },
    { name: "AI Text Generator", value: 20, fill: "#10B981" },
    { name: "AI Image Generator", value: 20, fill: "#A7F3D0" },
  ]

  const donutData = [
    { name: "Used Queries", value: 750, fill: "#059669" },
    { name: "Remaining Queries", value: 250, fill: "#ECFDF5" },
  ]

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

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
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
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          userName={userName}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={{ name: userName }}
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                Good morning, {userName}
              </h1>
            </div>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition w-full sm:w-auto"
            >
              Upgrade now
            </button>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-5 relative transition-colors duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-lg" />
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 pl-3">
                Total Queries Today
              </h3>
              <div className="flex items-center justify-center mt-3">
                <span className="text-5xl sm:text-6xl font-bold text-emerald-600 dark:text-emerald-400">
                  75
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3 px-2 sm:px-3">
                Represents the total number of queries executed today.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-5 relative transition-colors duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-lg" />
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 pl-3">
                Average Response Time
              </h3>
              <div className="flex items-center justify-center">
                <span className="text-5xl sm:text-6xl font-bold text-emerald-600 dark:text-emerald-400">3</span>
                <span className="ml-2 mt-3 text-sm text-gray-500 dark:text-gray-400">sec</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3 px-2 sm:px-3">
                Represents the average AI response time recorded today.
              </p>
            </div>

            {/* Card 3 - Pie Chart */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-5 relative transition-colors duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-lg" />
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 pl-3">
                Most Used AI Tool
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 pl-3 mb-4 sm:mb-0">
                  {mostUsedAIData.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      ></span>
                      {item.name}
                    </li>
                  ))}
                </ul>
                <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mostUsedAIData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        dataKey="value"
                      >
                        {mostUsedAIData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Donut Chart */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-5 relative transition-colors duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-lg" />
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 pl-3">
                Query Usage
              </h3>
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span> Used Queries
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></span> Remaining
                  </div>
                </div>
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-5 relative transition-colors duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-lg" />
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 pl-3">
                Usage Over Time
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={usageOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#4B5563" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#4B5563",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#059669"
                    dot={{ fill: "#059669", r: 4 }}
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ✅ Updated Tips Section with Dialog Triggers */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-5 relative transition-colors duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-l-lg" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 pl-3">
              Tips & Updates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
              <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Quick guide for new features.
                </p>
                <button
                  onClick={() => {
                    setCurrentTip(0)
                    setTipDialogOpen(true)
                  }}
                  className="bg-emerald-600 text-white text-xs sm:text-sm px-3 py-1 rounded-md hover:bg-emerald-700 transition"
                >
                  Read more
                </button>
              </div>
              <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Pro Tips for optimizing GPT tools.
                </p>
                <button
                  onClick={() => {
                    setCurrentTip(1)
                    setTipDialogOpen(true)
                  }}
                  className="bg-emerald-600 text-white text-xs sm:text-sm px-3 py-1 rounded-md hover:bg-emerald-700 transition"
                >
                  Read more
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ✅ Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 dark:text-emerald-400">
              Unlock Premium Features
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Go Pro and get unlimited access to all AI tools.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Unlimited AI queries per day</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Priority response time</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Advanced AI models (GPT-4, Claude, etc.)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>Export chat history & analytics</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setUpgradeOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Add your upgrade logic (e.g., redirect to Stripe)
                alert("Redirecting to checkout...")
                setUpgradeOpen(false)
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition"
            >
              Upgrade Plan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Tips Dialog */}
      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 dark:text-emerald-400">
              {currentTip === 0
                ? "New Features Guide"
                : "Pro Tips for AI Tools"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {currentTip === 0
                ? "Get the most out of our latest updates."
                : "Boost your productivity with these expert tips."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-sm text-gray-700 dark:text-gray-300 space-y-3">
            {currentTip === 0 ? (
              <>
                <p>Our newest features include:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Real-time AI code suggestions</li>
                  <li>Image-to-text analysis</li>
                  <li>One-click export to PDF</li>
                  <li>Dark mode sync across devices</li>
                </ul>
                <p>Explore them under each AI tool section!</p>
              </>
            ) : (
              <>
                <p>Optimize your AI experience with these tips:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Be specific in your prompts for better results</li>
                  <li>Use “/” commands for quick actions (e.g., /image, /code)</li>
                  <li>Save frequently used prompts in your history</li>
                  <li>Enable “Smart Context” for longer conversations</li>
                </ul>
                <p>Happy prompting! 🌱</p>
              </>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setTipDialogOpen(false)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
