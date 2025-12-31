"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Lock, Bell, Shield } from "lucide-react"
import { apiPutJson, getCurrentUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<{ _id: string; username: string; role: string } | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" })
      return
    }

    try {
      await apiPutJson("/api/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      })
      toast({ title: "Success", description: "Password updated successfully" })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update password",
        variant: "destructive"
      })
    }
  }

  const roleColors = {
    super_admin: "bg-purple-100 text-purple-700 border-purple-200",
    initiator_admin: "bg-blue-100 text-blue-700 border-blue-200",
    approver_admin: "bg-green-100 text-green-700 border-green-200",
    loan_officer: "bg-orange-100 text-orange-700 border-orange-200",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your account and application preferences</p>
        </div>

        {/* User Profile Card */}
        <Card className="neumorphic p-4 sm:p-6 bg-card border-0">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.username || "User"}</h2>
              <Badge variant="outline" className={roleColors[user?.role as keyof typeof roleColors] || "bg-gray-100 text-gray-700"}>
                {user?.role?.replace(/_/g, " ").toUpperCase() || "USER"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">User ID</p>
              <p className="font-mono">{user?._id || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Username</p>
              <p className="font-semibold">{user?.username || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Role</p>
              <p className="font-semibold capitalize">{user?.role?.replace(/_/g, " ") || "—"}</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {/* Security Settings */}
          <Card className="neumorphic p-4 sm:p-6 bg-card border-0">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Change Password</h2>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-primary text-white neumorphic neumorphic-hover border-0 text-sm">
                Update Password
              </Button>
            </form>
          </Card>

          {/* Notifications */}
          <Card className="neumorphic p-4 sm:p-6 bg-card border-0">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Loan Approvals</p>
                  <p className="text-xs text-muted-foreground">Get notified when loans are approved</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">New Applications</p>
                  <p className="text-xs text-muted-foreground">Alerts for new loan applications</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Repayments</p>
                  <p className="text-xs text-muted-foreground">Notifications for repayments</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">Receive email notifications</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded" />
              </div>
            </div>
          </Card>
        </div>

        {/* System Information */}
        <Card className="neumorphic p-4 sm:p-6 bg-card border-0">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">System Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Version</p>
              <p className="font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Environment</p>
              <p className="font-semibold">Production</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Last Login</p>
              <p className="font-semibold">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
