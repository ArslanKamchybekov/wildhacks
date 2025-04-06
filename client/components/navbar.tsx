"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser } from "@auth0/nextjs-auth0/client"
import { LogoutButton } from "@/components/logout-button"

export function Navbar() {
  const { user, isLoading } = useUser()

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
          {!user ? (
            <>
              <Link href="/api/auth/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
              <LogoutButton />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
