"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, Lock, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { FcGoogle } from "react-icons/fc"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = theme === "dark"

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName) {
          await updateProfile(result.user, { displayName })
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-white"}`}>

      {/* Left Side - Form */}
      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-6 transition-colors duration-300 ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="w-full max-w-md">
          <h2 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            {isSignUp ? "Create an Account" : "Log in"}
          </h2>
          <p className={`text-sm mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {isSignUp ? "Join us and get started" : "Enter your email and password to log in"}
          </p>

          {error && (
            <div
              className={`border px-4 py-3 rounded-lg mb-6 text-sm transition-colors duration-300 ${
                isDark ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 px-4 font-medium transition mb-6 disabled:opacity-50 border ${
              isDark
                ? "bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                : "bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
            }`}
          >
            <FcGoogle size={20} />
            Log in with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? "border-gray-700" : "border-gray-300"}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-3 ${isDark ? "bg-gray-900 text-gray-500" : "bg-white text-gray-600"}`}>or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  Name*
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                Email*
              </label>
              <div className="relative">
                <Mail size={18} className={`absolute left-3 top-3.5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                Password*
              </label>
              <div className="relative">
                <Lock size={18} className={`absolute left-3 top-3.5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 cursor-pointer rounded"
                  />
                  <label
                    htmlFor="remember"
                    className={`text-sm cursor-pointer ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Keep me logged in
                  </label>
                </div>
                <a href="#" className="text-sm text-purple-600 hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 mt-6"
            >
              {loading ? "Loading..." : isSignUp ? "Sign up" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            {isSignUp ? (
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Already have an account?{" "}
                <button onClick={() => setIsSignUp(false)} className="text-purple-600 hover:underline font-medium">
                  Sign in
                </button>
              </p>
            ) : (
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Not registered yet?{" "}
                <button onClick={() => setIsSignUp(true)} className="text-purple-600 hover:underline font-medium">
                  Create an Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div
        className={`hidden lg:flex w-1/2 items-center justify-center p-8 transition-colors duration-300 ${
          isDark
             
            ? "bg-linear-to-br from-gray-900 to-gray-800 border-l border-gray-800"
            : "bg-[#3D2D4C]"
        }`}
      >
        <div className="text-center">
          <div className="mb-6">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold ${
                isDark ? "bg-purple-900/40 text-purple-300" : "bg-white/20 text-white"
              }`}
            >
              ✨
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-3">Soft GPT</h1>
          <p className="text-lg text-purple-100 mb-8">AI-powered virtual assistant</p>

          {/* 🌗 Figma-Style Dual Theme Buttons */}
          <div
            className={`inline-flex items-center rounded-full border overflow-hidden ${
              isDark ? "border-purple-800" : "border-white/30"
            }`}
          >
            <button
              onClick={() => setTheme("light")}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                !isDark
                  ? "bg-white text-purple-700"
                  : "bg-transparent text-purple-300 hover:bg-purple-800/30"
              }`}
            >
              Light mode
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                isDark
                  ? "bg-purple-700 text-white"
                  : "bg-transparent text-white hover:bg-white/20"
              }`}
            >
              Dark mode
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
