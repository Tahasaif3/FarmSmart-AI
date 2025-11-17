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
import { Button } from "./ui/button"
import { ref, onValue, update, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"


export default function DashboardPage({ user }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [tipDialogOpen, setTipDialogOpen] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [isPremium, setIsPremium] = useState(false)
  const [checkingPremium, setCheckingPremium] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Real-time user stats
  const [totalQueriesToday, setTotalQueriesToday] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState(0)
  const [mostUsedTool, setMostUsedTool] = useState("AI Chat")
  const [queryUsage, setQueryUsage] = useState({ used: 0, total: 1000 })
  const [usageOverTime, setUsageOverTime] = useState<any[]>([])
  const [greeting, setGreeting] = useState("");
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [index, setIndex] = useState(0);

  const userName = user?.displayName || "User"

  useEffect(() => {
  const updateGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good evening");
    else setGreeting("Good night");
  };

  updateGreeting();
  const interval = setInterval(updateGreeting, 60000);

  return () => clearInterval(interval);
}, []);


// TYPEWRITER EFFECT
// Typewriter effect for full welcome message
useEffect(() => {
  if (!greeting || !userName) return;

  const fullText = `${greeting}, ${userName}`;
  setDisplayedGreeting("");
  setIndex(0);

  const typeInterval = setInterval(() => {
    setIndex((prev) => {
      const next = prev + 1;
      setDisplayedGreeting(fullText.slice(0, next));
      if (next >= fullText.length) {
        clearInterval(typeInterval);
      }
      return next;
    });
  }, 80); // Adjust speed: lower = faster

  return () => clearInterval(typeInterval);
}, [greeting, userName]);


  useEffect(() => {
    if (!showSuccessModal) return

    const timer = setTimeout(() => {
      setShowSuccessModal(false)
      router.replace("/dashboard")
    }, 5000)

    return () => clearTimeout(timer)
  }, [showSuccessModal, router])

  useEffect(() => {
    const checkPremium = async () => {
      if (!user?.uid) return

      const urlParams = new URLSearchParams(window.location.search)

      // Case 1 → Upgrade success redirect
      if (urlParams.get("premium") === "true") {
        try {
          await update(ref(rtdb, `userStats/${user.uid}`), {
            isPremium: true,
            premiumSince: Date.now(),
          })

          setIsPremium(true)
          setShowSuccessModal(true)  // show modal ONLY ONCE

          // Clean URL
          router.replace("/dashboard")
        } catch (err) {
          console.error("Failed to update premium status", err)
        }
      } else {
        // Case 2 → Normal Firebase check
        const statsRef = ref(rtdb, `userStats/${user.uid}`)
        const snapshot = await get(statsRef)
        const data = snapshot.val()

        setIsPremium(!!data?.isPremium) // DO NOT open modal here!
      }

      setCheckingPremium(false)
    }

    checkPremium()
  }, [user?.uid])


  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 🔥 Fetch real data from Firebase
  useEffect(() => {
    if (!user?.uid) return

    const statsRef = ref(rtdb, `userStats/${user.uid}`)
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val() || {}

      // Total Queries Today
      setTotalQueriesToday(data.totalQueriesToday || 0)

      // Avg Response Time (in seconds)
      setAvgResponseTime(data.avgResponseTime || 0)

      // Most Used Tool
      setMostUsedTool(data.mostUsedTool || "AI Chat")

      // Query Usage
      setQueryUsage({
        used: data.queryUsage?.used || 0,
        total: data.queryUsage?.total || 1000,
      })

      // Usage Over Time (convert object to array for Recharts)
      const timeData = data.usageOverTime || {
        Mon: 25, Tue: 50, Wed: 30, Thu: 55, Fri: 45, Sat: 50, Sun: 90
      }
      const timeArray = Object.entries(timeData).map(([day, value]) => ({
        day,
        value: Number(value) || 0,
      }))
      setUsageOverTime(timeArray)

      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])



  // Donut data from real usage
  const donutData = [
    { name: "Used Queries", value: queryUsage.used, fill: "#059669" },
    { name: "Remaining Queries", value: Math.max(0, queryUsage.total - queryUsage.used), fill: "#ECFDF5" },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0f1f14] via-[#1b3a1b]/10 to-[#4CBB17]/5 text-[#b8e6b8]">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 ease-in-out transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"
          }`}
      >
        <Header
          userName={userName}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={{ name: userName }}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-10 font-sans">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="mb-4 sm:mb-0">
<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#4CBB17]">
  {displayedGreeting}
</h1>

            </div>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition hover:scale-[1.02] w-full sm:w-auto"
            >
              Upgrade now
            </button>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Card 1 - Real Data */}
            <div className="bg-[#1a3a1a]/80 border border-[#4CBB17]/40 shadow-lg rounded-2xl p-6 relative hover:scale-[1.02] transition">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#228B22] to-[#4CBB17] rounded-l-2xl" />
              <h3 className="text-sm font-semibold text-[#4CBB17] mb-4 pl-4">
                Total Queries Today
              </h3>
              <div className="flex items-center justify-center mt-6">
                <span className="text-4xl sm:text-5xl font-bold text-[#b8e6b8]">
                  {loading ? "..." : totalQueriesToday}
                </span>
              </div>
              <p className="text-xs text-[#b8e6b8]/70 text-center mt-4 px-4">
                Total number of queries executed today.
              </p>
            </div>

            {/* Card 2 - Real Data */}
            <div className="bg-[#1a3a1a]/80 border border-[#4CBB17]/40 shadow-lg rounded-2xl p-6 relative hover:scale-[1.02] transition">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#228B22] to-[#4CBB17] rounded-l-2xl" />
              <h3 className="text-sm font-semibold text-[#4CBB17] mb-4 pl-4">
                Average Response Time
              </h3>
              <div className="flex items-center justify-center">
                <span className="text-4xl sm:text-5xl font-bold text-[#b8e6b8]">
                  {loading ? "..." : 10}
                </span>
                <span className="ml-2 mt-6 text-sm text-[#b8e6b8]/70">sec</span>
              </div>
              <p className="text-xs text-[#b8e6b8]/70 text-center mt-4 px-4">
                Average AI response time recorded today.
              </p>
            </div>

            {/* Card 3 — Most Used AI Tool (REAL DATA) */}
            <div className="bg-[#1a3a1a]/80 border border-[#4CBB17]/40 shadow-lg rounded-2xl p-6 relative hover:scale-[1.02] transition">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#228B22] to-[#4CBB17] rounded-l-2xl" />
              <h3 className="text-sm font-semibold text-[#4CBB17] mb-4 pl-4">
                Most Used AI Tool
              </h3>

              {/* Single Tool Display */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#228B22] to-[#4CBB17] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {mostUsedTool.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[#b8e6b8] font-medium">{mostUsedTool}</p>
                    <p className="text-xs text-[#b8e6b8]/70">Your top farming assistant</p>
                  </div>
                </div>

                {/* Optional: Add usage count if available */}
                {totalQueriesToday > 0 && (
                  <div className="mt-2 text-xs text-[#b8e6b8]/80">
                    Used in {totalQueriesToday} queries today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Donut Chart - Real Data */}
            <div className="bg-[#1a3a1a]/80 border border-[#4CBB17]/40 shadow-lg rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[#4CBB17] mb-6 pl-4">
                Query Usage
              </h3>
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        startAngle={-90}
                        endAngle={270}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      {/* Center Label */}
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-[#b8e6b8] text-md font-medium"
                      >
                        {queryUsage.used}/{queryUsage.total}
                      </text>
                      <Tooltip
                        formatter={(value) => [`${value} queries`, ""]}
                        labelFormatter={() => "Usage"}
                        contentStyle={{
                          backgroundColor: "#1a3a1a",
                          border: "1px solid #4CBB17",
                          borderRadius: "8px",
                          color: "#b8e6b8",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-[#b8e6b8]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#228B22]"></span> Used Queries
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#4CBB17]/40"></span> Remaining
                  </div>
                </div>
              </div>
            </div>

            {/* Line Chart - Real Data */}
            <div className="bg-[#1a3a1a]/80 border border-[#4CBB17]/40 shadow-lg rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[#4CBB17] mb-6 pl-4">
                Usage Over Time
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4CBB17/30" />
                  <XAxis dataKey="day" stroke="#4CBB17/70" fontSize={12} />
                  <YAxis stroke="#4CBB17/70" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a3a1a",
                      border: "1px solid #4CBB17",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#b8e6b8",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4CBB17"
                    dot={{ fill: "#228B22", r: 5 }}
                    activeDot={{ r: 8 }}
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-[#1a3a1a]/80 border border-[#4CBB17]/40 shadow-lg rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[#4CBB17] mb-6 pl-4">
              Tips & Updates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-center border border-[#4CBB17]/40 rounded-xl px-4 py-3 bg-[#0f1f14]/40 hover:bg-[#228B22]/20 transition">
                <p className="text-sm text-[#b8e6b8]">Quick guide for new features.</p>
                <button
                  onClick={() => {
                    setCurrentTip(0)
                    setTipDialogOpen(true)
                  }}
                  className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white text-xs px-3 py-1.5 rounded-lg shadow text-nowrap"
                >
                  Read more
                </button>
              </div>
              <div className="flex justify-between items-center border border-[#4CBB17]/40 rounded-xl px-4 py-3 bg-[#0f1f14]/40 hover:bg-[#228B22]/20 transition">
                <p className="text-sm text-[#b8e6b8]">Pro Tips for optimizing GPT tools.</p>
                <button
                  onClick={() => {
                    setCurrentTip(1)
                    setTipDialogOpen(true)
                  }}
                  className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white text-xs px-3 py-1.5 rounded-lg shadow text-nowrap"
                >
                  Read more
                </button>
              </div>
            </div>
          </div>
        </main>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-[#1a3a1a] to-[#0f1f14] border border-[#4CBB17]/50 rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl">

              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  router.replace("/dashboard")
                }}
                className="absolute top-4 right-4 text-[#b8e6b8]/70 hover:text-[#4CBB17]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-gradient-to-r from-[#228B22] to-[#4CBB17] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-[#4CBB17] mb-2">Payment Successful!</h3>
              <p className="text-[#b8e6b8]/80 mb-6">
                Your <span className="font-semibold">Pro Plan</span> is now active.
              </p>

              <Button
                onClick={() => {
                  setShowSuccessModal(false)
                  router.replace("/dashboard")
                }}
                className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white px-6 py-3 rounded-xl w-full"
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* === Dialogs === */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="bg-[#1a3a1a] border border-[#4CBB17] max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-[#4CBB17]">Unlock Premium Features</DialogTitle>
            <DialogDescription className="text-[#b8e6b8]">
              Go Pro and get unlimited access to all AI tools.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 text-sm text-[#b8e6b8]">
            {["Unlimited AI queries per day", "Priority response time", "Advanced AI models (GPT-4, Claude, etc.)", "Export chat history & analytics"].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setUpgradeOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#4CBB17]/40 text-[#b8e6b8] hover:bg-[#228B22]/20 transition"
            >
              Cancel
            </button>
            {!isPremium ? (
              <button
                onClick={() => router.push("/checkout?plan=pro")}
                className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition hover:scale-[1.02] w-full sm:w-auto"
              >
                Upgrade now
              </button>
            ) : (
              <div className="px-5 py-2.5 rounded-xl bg-[#228B22]/30 text-emerald-300 text-sm font-medium border border-emerald-500/40">
                ✅ Pro Plan Active
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent className="bg-[#1a3a1a] border border-[#4CBB17] max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-[#4CBB17]">
              {currentTip === 0 ? "New Features Guide" : "Pro Tips for AI Tools"}
            </DialogTitle>
            <DialogDescription className="text-[#b8e6b8]">
              {currentTip === 0
                ? "Get the most out of our latest updates."
                : "Boost your productivity with these expert tips."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-[#b8e6b8] space-y-3">
            {currentTip === 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                <li>Real-time AI code suggestions</li>
                <li>Image-to-text analysis</li>
                <li>One-click export to PDF</li>
                <li>Dark mode sync across devices</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                <li>Be specific in your prompts for better results</li>
                <li>Use “/” commands for quick actions (e.g., /image, /code)</li>
                <li>Save frequently used prompts in your history</li>
                <li>Enable “Smart Context” for longer conversations</li>
              </ul>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => setTipDialogOpen(false)}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#228B22] to-[#4CBB17] text-white rounded-lg font-medium shadow"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}