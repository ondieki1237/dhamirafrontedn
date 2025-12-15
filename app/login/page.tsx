"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Store token and user data in localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: data._id,
          username: data.username,
          role: data.role,
          regions: data.regions,
        }),
      )

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/professional-african-businesswoman-working-with-la.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <img
            src="/logo-imara.png"
            alt="Dhamira Imara Capital"
            className="w-48 h-48 object-contain mb-8 animate-fade-in"
          />
          <h1 className="text-4xl font-bold text-center mb-4 animate-slide-up">Your Trusted Financial Partner</h1>
          <p
            className="text-xl text-center text-white/90 max-w-md animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            Empowering growth through innovative microfinance solutions
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 animate-fade-in">
            <img
              src="/logo-imara.png"
              alt="Dhamira Imara Capital"
              className="w-24 h-24 object-contain mx-auto mb-6 lg:hidden"
            />
            <h2 className="text-3xl font-bold text-foreground text-center mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-center">Sign in to your admin account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          <form className="space-y-6 animate-slide-up" style={{ animationDelay: "100ms" }} onSubmit={handleSubmit}>
            <div className="neumorphic p-6 rounded-2xl">
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="superadmin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-semibold rounded-xl neumorphic neumorphic-hover neumorphic-active transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
