"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const pathname = usePathname()
  
  const isLoggedIn = pathname.startsWith("/dashboard") || 
                     pathname.startsWith("/goals") || 
                     pathname.startsWith("/pet") ||
                     pathname.startsWith("/friends") ||
                     pathname.startsWith("/leaderboard") ||
                     pathname.startsWith("/settings")

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            <span className="font-semibold">GoalKeeper</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!isLoggedIn ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
