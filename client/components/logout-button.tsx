"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function LogoutButton({ variant = "ghost", size = "sm" }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      // Use window.location.href to navigate to the logout endpoint
      // This avoids CORS issues by letting the server handle the redirect
      window.location.href = "/api/auth/logout"
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging out...
        </>
      ) : (
        "Logout"
      )}
    </Button>
  )
}
