import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { UserProvider } from "@auth0/nextjs-auth0/client"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "GoalKeeper - Achieve Goals with Pet & Money Stakes",
  description: "Track your goals with AI-powered insights and fun stakes",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <UserProvider>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </UserProvider>
    </html>
  )
}



import './globals.css'