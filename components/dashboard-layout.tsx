"use client"

import type React from "react"

import { useState } from "react"
import React, { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentLoans } from "@/components/recent-loans"
import { ClientsOverview } from "@/components/clients-overview"
import { QuickActions } from "@/components/quick-actions"

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden mobile-container">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Suspense fallback={<div />}>
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />
        </Suspense>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            {children || (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">{"Welcome back! Here's your overview"}</p>
                  </div>
                </div>

                <DashboardStats />

                <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <RecentLoans />
                  </div>
                  <div>
                    <QuickActions />
                  </div>
                </div>

                <ClientsOverview />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
