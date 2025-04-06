import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/navbar"
import { UserProvider } from "@auth0/nextjs-auth0/client"
import "./globals.css"


const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Waddl",
  description: "Your Honor.Your Wallet.Your Duck.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <UserProvider>
        <body className={`${inter.className} flex min-h-screen flex-col`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
            <Toaster />
          </ThemeProvider>
        </body> 
      </UserProvider>
    </html>
  )
}

