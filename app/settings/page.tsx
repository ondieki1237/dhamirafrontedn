"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and application settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="neumorphic p-6 bg-card border-0">
            <h2 className="text-xl font-bold text-foreground mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue="Super Admin"
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="admin@dhamira.com"
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <Button className="w-full bg-primary text-white neumorphic neumorphic-hover border-0">
                Update Profile
              </Button>
            </div>
          </Card>

          <Card className="neumorphic p-6 bg-card border-0">
            <h2 className="text-xl font-bold text-foreground mb-4">Security</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <Button className="w-full bg-secondary text-white neumorphic neumorphic-hover border-0">
                Change Password
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
