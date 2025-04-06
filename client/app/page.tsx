"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target, Trophy, Users } from "lucide-react"
import { createUser } from "@/app/actions/user"
import { useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"

export default function Home() {
  const { user } = useUser()
  useEffect(() => {
    if (user) {
      createUser({
        name: user.name!,
        email: user.email!,
        tickData: []
      })
    }
  }, [user])
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="py-24 md:py-32">
          <div className="container mx-auto">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">Achieve Your Goals with Fun Stakes</h1>
              <p className="max-w-[42rem] text-muted-foreground sm:text-xl">
                Set goals, choose your stakes - grow a virtual pet or put money on the line. Let AI help you break down
                your goals and stay on track.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline">
                    Try Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Goals</h3>
                <p className="text-muted-foreground">
                  Enter your goal in natural language and our AI breaks it down into achievable milestones.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Fun Stakes</h3>
                <p className="text-muted-foreground">
                  Choose between growing a virtual pet or putting money on the line. Real consequences for real results.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Social Accountability</h3>
                <p className="text-muted-foreground">
                  Invite friends, compare progress, and climb the leaderboard to stay motivated.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GoalKeeper. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

