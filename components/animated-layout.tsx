"use client"

import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { VaultManager } from "@/lib/vault"
import { pageTransition } from "@/lib/motion"

interface AnimatedLayoutProps {
  children: ReactNode
  title: string
  icon: ReactNode
  backLink?: string
}

export function AnimatedLayout({ children, title, icon, backLink = "/" }: AnimatedLayoutProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">LOCKEYE</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => VaultManager.lock()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="transition-all hover:translate-x-[-2px]">
              <Link href={backLink}>
                <motion.div initial={{ x: 0 }} whileHover={{ x: -4 }} className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back to Dashboard
                </motion.div>
              </Link>
            </Button>
          </div>

          <motion.div
            className="flex items-center justify-between mb-8"
            initial="hidden"
            animate="visible"
            variants={pageTransition}
          >
            <h2 className="text-3xl font-bold tracking-tight flex items-center">
              {icon}
              <span className="ml-2">{title}</span>
            </h2>
          </motion.div>

          <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition}>
            {children}
          </motion.div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>LOCKEYE Password Manager</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} LOCKEYE. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

