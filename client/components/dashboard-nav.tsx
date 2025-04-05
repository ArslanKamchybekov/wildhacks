"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Home, Settings, Target, Trophy, Users, Egg } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Goals",
    href: "/goals",
    icon: Target,
  },
  {
    title: "Pet",
    href: "/pet",
    icon: Egg,
  },
  {
    title: "Friends",
    href: "/friends",
    icon: Users,
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <ScrollArea className="h-full py-6">
      <div className="flex flex-col gap-4 px-2">
        <div className="flex h-10 items-center gap-2 px-4 font-semibold">
          <Target className="h-6 w-6" />
          <span>GoalKeeper</span>
        </div>
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </ScrollArea>
  )
}

