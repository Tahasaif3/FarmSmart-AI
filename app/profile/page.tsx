// app/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateProfile as firebaseUpdateProfile } from "firebase/auth"
import { ref, update, get } from "firebase/database"
import { auth, rtdb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Edit3, LogOut, Calendar, User } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const user = auth.currentUser
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [photoURL, setPhotoURL] = useState("")
  const [dob, setDob] = useState("") // YYYY-MM-DD
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Load profile from Firebase
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadProfile = async () => {
      try {
        // Load from Realtime DB first (includes DOB)
        const statsRef = ref(rtdb, `userStats/${user.uid}`)
        const snapshot = await get(statsRef)
        const data = snapshot.val() || {}

        setName(data.displayName || user.displayName || "")
        setEmail(user.email || "")
        setPhotoURL(data.photoURL || user.photoURL || "")
        setDob(data.dob || "")
      } catch (err) {
        console.error("Failed to load profile", err)
        setName(user.displayName || "")
        setEmail(user.email || "")
        setPhotoURL(user.photoURL || "")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name) return

    setSaving(true)
    setMessage(null)

    try {
      // Update Firebase Auth
      await firebaseUpdateProfile(user, {
        displayName: name,
        photoURL: photoURL || null,
      })

      // Update Realtime DB (name, avatar, DOB)
      await update(ref(rtdb, `userStats/${user.uid}`), {
        displayName: name,
        photoURL: photoURL || null,
        dob: dob || null,
        updatedAt: Date.now(),
      })

      setMessage({ type: "success", text: "✅ Profile updated successfully!" })
    } catch (error: any) {
      console.error("Profile update error:", error)
      setMessage({ type: "error", text: "❌ Failed to update profile. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1f14] via-[#1b3a1b]/10 to-[#4CBB17]/5">
        <div className="text-[#b8e6b8]">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f14] via-[#1b3a1b]/10 to-[#4CBB17]/5 p-4 sm:p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
{/* Back Button - FULL LEFT */}
<div className="w-full">
  <button
    onClick={() => router.back()}
    className="p-2 rounded-full bg-[#228B22]/20 border border-[#4CBB17]/40 text-[#4CBB17] hover:bg-[#4CBB17]/20 transition mb-6"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
</div>



        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-[#4CBB17]">Your Profile</h1>
          <div className="bg-[#228B22]/20 text-emerald-400 p-2 rounded-lg">
            <User className="w-5 h-5" />
          </div>
        </div>

        <Card className="bg-[#1a3a1a]/80 border border-[#4CBB17]/40 backdrop-blur-lg overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative">
                  {photoURL ? (
                    <Image
                      src={photoURL}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="rounded-full border-2 border-[#4CBB17] shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4CBB17] to-[#228B22] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <Label className="text-[#b8e6b8] text-sm flex items-center gap-2 mb-2">
                    <Edit3 className="w-4 h-4 text-[#4CBB17]" />
                    Profile Picture URL
                  </Label>
                  <Input
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-[#0f1f14] border-[#4CBB17]/30 text-[#b8e6b8] placeholder-[#b8e6b8]/50 w-full"
                  />
                  <p className="text-xs text-[#b8e6b8]/60 mt-1">
                    Paste a public image URL (PNG, JPG)
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label className="text-[#b8e6b8] text-sm flex items-center gap-2 mb-2">
                  <Edit3 className="w-4 h-4 text-[#4CBB17]" />
                  Full Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-[#0f1f14] border-[#4CBB17]/30 text-[#b8e6b8] placeholder-[#b8e6b8]/50"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <Label className="text-[#b8e6b8] text-sm mb-2">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={email}
                    disabled
                    className="bg-[#0f1f14]/50 border-[#4CBB17]/30 text-[#b8e6b8]/70 flex-1"
                  />
                  <span className="px-2 py-1 bg-[#228B22]/20 text-emerald-300 text-xs rounded">
                    {user.providerData[0]?.providerId === "google.com" ? "Google" : "Email"}
                  </span>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <Label className="text-[#b8e6b8] text-sm flex items-center gap-2 mb-2">
<Calendar className="w-4 h-4 text-[#4CBB17]" />
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="bg-[#0f1f14] border-[#4CBB17]/30 text-[#d5d5d5] w-full"
                  max={new Date().toISOString().split("T")[0]} // Prevent future dates
                />
                <p className="text-xs text-[#b8e6b8]/60 mt-1">
                  Used for personalized farming insights (optional)
                </p>
              </div>

              {/* Status Message */}
              {message && (
                <div
                  className={`p-3 rounded-lg text-sm font-medium ${
                    message.type === "success"
                      ? "bg-emerald-900/30 text-emerald-200 border border-emerald-700"
                      : "bg-red-900/30 text-red-200 border border-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#228B22] to-[#4CBB17] hover:from-[#4CBB17] hover:to-[#228B22] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition"
                >
                  {saving ? "Saving..." : "Update Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-2 border-[#4CBB17]/40 text-[#b8e6b8] hover:bg-[#228B22]/20 px-6 py-3 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}