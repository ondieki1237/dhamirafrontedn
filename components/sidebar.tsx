"use client"

import {
  LayoutDashboard,
  Users,
  UserCircle,
  DollarSign,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  FileCheck,
  Terminal,
  History,
  ClipboardList,
  X,
  Shield,
  UserPlus,
  MapPin,
  Activity,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-media-query"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: Activity, label: "Performance", route: "/loan-officer/dashboard", roles: ["loan_officer"] },
  { icon: DollarSign, label: "Loans", route: "/loans" },
  { icon: UserCircle, label: "Clients", route: "/clients" },
  { icon: Users, label: "Groups", route: "/groups" },
  { icon: DollarSign, label: "Savings", route: "/savings" },
  { icon: FileCheck, label: "Disbursements", route: "/loans/disburse", roles: ["admin", "approver_admin", "initiator_admin"] },
  { icon: UserCircle, label: "Loan Officers", route: "/loan-officers", roles: ["admin", "initiator_admin", "approver_admin", "super_admin"] },
  { icon: FileText, label: "Credit Assessments", route: "/credit-assessments", roles: ["admin", "initiator_admin", "approver_admin"] },
  { icon: TrendingUp, label: "Repayments", route: "/repayments" },
  { icon: History, label: "Loan History", route: "/loan-history", roles: ["admin", "initiator_admin", "approver_admin"] },
  { icon: ClipboardList, label: "Track My Loans", route: "/track-my-loans", roles: ["loan_officer"] },
  { icon: BarChart3, label: "Analytics", route: "/analytics", roles: ["initiator_admin", "approver_admin", "super_admin"] },
  { icon: FileCheck, label: "Audit Logs", route: "/audit-logs", roles: ["initiator_admin", "approver_admin", "super_admin"] },
  { icon: Terminal, label: "System Logs", route: "/system-logs", roles: ["super_admin"] },
  { icon: Shield, label: "Manage Admins", route: "/admin/create-admin", roles: ["super_admin"] },
  { icon: UserPlus, label: "Create Officer", route: "/admin/create-loan-officer", roles: ["super_admin"] },
  { icon: MapPin, label: "Branches", route: "/branches", roles: ["super_admin"] },
  { icon: Settings, label: "Settings", route: "/settings", roles: ["super_admin", "initiator_admin", "approver_admin"] },
]

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const userData = getCurrentUser()
    setUser(userData)
  }, [])

  useEffect(() => {
    // Close mobile menu when route changes
    if (isMobile && mobileOpen && onMobileClose) {
      onMobileClose()
    }
  }, [pathname])

  const initials = user?.username
    ? user.username.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
    : "U"

  const handleNavigation = (route: string) => {
    router.push(route)
    // Close mobile menu after navigation
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative flex flex-col",
          // Desktop styles
          "md:relative",
          collapsed ? "md:w-20" : "md:w-72",
          // Mobile styles - slide-in drawer from left
          "fixed inset-y-0 left-0 z-50 w-72",
          "md:translate-x-0",
          isMobile && !mobileOpen && "-translate-x-full",
          isMobile && mobileOpen && "translate-x-0",
        )}
      >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        {/* Close button for mobile */}
        {isMobile && mobileOpen && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3 flex-1 justify-center">
            <Image
              src="/logo-imara.png"
              alt="Dhamira Imara Capital"
              width={160}
              height={60}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems
          .filter(item => !item.roles || (user?.role && item.roles.includes(user.role)))
          .map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.route)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "touch-target", // Mobile touch target
                pathname === item.route && "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg",
              )}
            >
              <item.icon className={cn("flex-shrink-0", (collapsed && !isMobile) ? "w-6 h-6" : "w-5 h-5")} />
              {(!collapsed || isMobile) && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div
          className={cn(
            (collapsed && !isMobile) && "justify-center",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold flex-shrink-0">
            {initials}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {user?.username || "Loading..."}
              </p>
              <p className="text-xs text-sidebar-accent-foreground/70 truncate uppercase">
                {user?.role?.replace("_", " ") || "Member"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button - Desktop Only */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border-2 border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
          )}
        </button>
      )}
    </aside>
    </>
  )
}
