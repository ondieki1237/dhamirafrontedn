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
  Shield,
  BarChart3,
  FileCheck,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/dashboard" },
  { icon: DollarSign, label: "Loans", route: "/loans" },
  { icon: UserCircle, label: "Clients", route: "/clients" },
  { icon: Users, label: "Groups", route: "/groups" },
  { icon: FileText, label: "Credit Assessments", route: "/credit-assessments" },
  { icon: TrendingUp, label: "Repayments", route: "/repayments" },
  { icon: Shield, label: "Guarantors", route: "/guarantors" },
  { icon: BarChart3, label: "Analytics", route: "/analytics" },
  { icon: FileCheck, label: "Audit Logs", route: "/audit-logs" },
  { icon: Settings, label: "Settings", route: "/settings" },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative flex flex-col",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-center">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Image
              src="/logo-imara.png"
              alt="Dhamira Imara Capital"
              width={160}
              height={60}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => router.push(item.route)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname === item.route && "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg",
            )}
          >
            <item.icon className={cn("flex-shrink-0", collapsed ? "w-6 h-6" : "w-5 h-5")} />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent",
            collapsed && "justify-center",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
            SA
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">Super Admin</p>
              <p className="text-xs text-sidebar-accent-foreground/70 truncate">admin@dhamira.com</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border-2 border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
        )}
      </button>
    </aside>
  )
}
