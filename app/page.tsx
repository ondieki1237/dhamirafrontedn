"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Shield, Users, Award, LogIn, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"

const administrators = [
  {
    name: "Loan Administrator",
    roles: ["initiator_admin", "approver_admin"],
    description: "Manages the complete loan lifecycle - initiates applications, reviews credit assessments, approves loans, and processes disbursements",
    icon: Award,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    name: "Field Officer",
    roles: ["loan_officer"],
    description: "Front-line operations - client onboarding, relationship management, loan tracking, and repayment collection",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(false)
  const [formData, setFormData] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    } else {
      setChecking(false)
    }
  }, [router])

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

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-imara.png"
                alt="Dhamira Imara Capital"
                width={120}
                height={45}
                className="object-contain"
              />
            </div>
            <Button
              onClick={() => setShowLogin(!showLogin)}
              className="gap-2 bg-primary text-white hover:bg-primary/90 touch-target"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Admin Login</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Hero Section */}
        <section className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6">
              Your Trusted
              <span className="text-primary"> Financial Partner</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8">
              Empowering growth through innovative microfinance solutions across Kenya
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowLogin(true)}
                className="gap-2 bg-primary text-white hover:bg-primary/90 neumorphic touch-target"
              >
                Access Dashboard
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 neumorphic touch-target"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Login Section (Conditional) */}
        {showLogin && (
          <section className="mb-12 md:mb-16 animate-slide-up">
            <Card className="max-w-md mx-auto neumorphic p-6 md:p-8 bg-card border-0">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">Welcome Back</h2>
                <p className="text-sm text-muted-foreground text-center">Sign in to your admin account</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter your username"
                    required
                    className="neumorphic-inset border-0 bg-background"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    className="neumorphic-inset border-0 bg-background"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <a href="#" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white hover:bg-primary/90 neumorphic touch-target h-12"
                >
                  {loading ? "Signing in..." : "Sign In to Dashboard"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                  Protected by bank-level security. Your credentials are encrypted.
                </p>
              </div>
            </Card>
          </section>
        )}

        {/* Administrator Roles Section */}
        <section className="mb-12 md:mb-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              Administrator Roles
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Our platform provides specialized access levels for different administrative functions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {administrators.map((admin, index) => (
              <Card
                key={admin.name}
                className="neumorphic p-4 md:p-6 bg-card border-0 hover:shadow-xl transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${admin.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <admin.icon className={`w-6 h-6 md:w-7 md:h-7 ${admin.color}`} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-foreground mb-2">{admin.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3">
                  {admin.description}
                </p>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-1">
                    {admin.roles.map((role) => (
                      <span key={role} className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="neumorphic p-6 bg-card border-0 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Secure Platform</h3>
              <p className="text-sm text-muted-foreground">
                Bank-level security with role-based access control
              </p>
            </Card>

            <Card className="neumorphic p-6 bg-card border-0 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Real-time Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Monitor loan performance and client metrics instantly
              </p>
            </Card>

            <Card className="neumorphic p-6 bg-card border-0 text-center">
              <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Client Management</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive tools for managing client relationships
              </p>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Dhamira Imara Capital. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
