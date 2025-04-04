"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Lock,
  Plus,
  Search,
  Settings,
  FileText,
  CreditCard,
  Shield,
  FileArchive,
  Clipboard,
  Book,
  Briefcase,
  Users,
  Key,
  Lightbulb,
} from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordCard } from "@/components/password-card"
import { VaultManager, type PasswordEntry } from "@/lib/vault"
import { Encryption } from "@/lib/encryption"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { staggerContainer, cardHover, fadeIn } from "@/lib/motion"

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [passwords, setPasswords] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Check if vault is unlocked, redirect to login if not
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    loadPasswords()
  }, [router])

  // Load passwords from the vault
  const loadPasswords = async () => {
    try {
      setLoading(true)
      const entries = await VaultManager.getAllEntries()
      setPasswords(entries)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load passwords",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    try {
      const results = await VaultManager.searchEntries(query)
      setPasswords(results)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search passwords",
        variant: "destructive",
      })
    }
  }

  // Handle logout
  const handleLogout = () => {
    VaultManager.lock()
    router.push("/login")
  }

  // Handle edit password
  const handleEditPassword = (id: string) => {
    router.push(`/edit/${id}`)
  }

  // Handle delete password
  const handleDeletePassword = async (id: string) => {
    if (confirm("Are you sure you want to delete this password?")) {
      try {
        await VaultManager.deleteEntry(id)
        toast({
          title: "Success",
          description: "Password deleted successfully",
        })
        loadPasswords()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete password",
          variant: "destructive",
        })
      }
    }
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
    } else {
      const months = Math.floor(diffDays / 30)
      return `${months} ${months === 1 ? "month" : "months"} ago`
    }
  }

  // Feature cards for the dashboard
  const featureCards = [
    {
      title: "Passwords",
      icon: <Lock className="h-8 w-8 text-blue-500 mb-2" />,
      href: "/add",
      action: "Add",
      color: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Secure Notes",
      icon: <FileText className="h-8 w-8 text-green-500 mb-2" />,
      href: "/notes",
      color: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Credit Cards",
      icon: <CreditCard className="h-8 w-8 text-purple-500 mb-2" />,
      href: "/cards",
      color: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: "ID & Passports",
      icon: <Shield className="h-8 w-8 text-red-500 mb-2" />,
      href: "/identity",
      color: "bg-red-500/10",
      iconColor: "text-red-500",
    },
    {
      title: "Bank Accounts",
      icon: <Briefcase className="h-8 w-8 text-amber-500 mb-2" />,
      href: "/bank-accounts",
      color: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      title: "Medical Records",
      icon: <Clipboard className="h-8 w-8 text-emerald-500 mb-2" />,
      href: "/medical",
      color: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      title: "Legal Documents",
      icon: <FileArchive className="h-8 w-8 text-indigo-500 mb-2" />,
      href: "/documents",
      color: "bg-indigo-500/10",
      iconColor: "text-indigo-500",
    },
    {
      title: "Private Journal",
      icon: <Book className="h-8 w-8 text-pink-500 mb-2" />,
      href: "/journal",
      color: "bg-pink-500/10",
      iconColor: "text-pink-500",
    },
    {
      title: "Contacts",
      icon: <Users className="h-8 w-8 text-cyan-500 mb-2" />,
      href: "/contacts",
      color: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
    },
    {
      title: "Licenses & Keys",
      icon: <Key className="h-8 w-8 text-orange-500 mb-2" />,
      href: "/licenses",
      color: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      title: "Secret Projects",
      icon: <Lightbulb className="h-8 w-8 text-teal-500 mb-2" />,
      href: "/projects",
      color: "bg-teal-500/10",
      iconColor: "text-teal-500",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <motion.header
        className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Lock className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h1
              className="text-xl font-bold tracking-tight"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              LOCKEYE
            </motion.h1>
          </div>
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>
      <main className="flex-1">
        <div className="container py-6">
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight">Your Vault</h2>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search vault..."
                  className="w-[200px] sm:w-[300px] pl-8"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button onClick={() => router.push("/add")}>
                  <Plus className="mr-2 h-4 w-4" /> Add Password
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Feature Cards Grid */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {featureCards.map((feature, index) => (
              <motion.div key={index} variants={cardHover} initial="rest" whileHover="hover" custom={index}>
                <Link href={feature.href}>
                  <Card className={`hover:shadow-md transition-all ${feature.color} border-none`}>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className={feature.iconColor}>{feature.icon}</div>
                      <span className="font-medium">{feature.title}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.h3 className="text-xl font-bold mb-4" variants={fadeIn} initial="hidden" animate="visible">
            Recent Passwords
          </motion.h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="rounded-full h-12 w-12 border-b-2 border-primary"
              />
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {passwords.slice(0, 6).map((entry, index) => (
                <motion.div key={entry.id} variants={cardHover} initial="rest" whileHover="hover" custom={index}>
                  <PasswordCard
                    id={entry.id}
                    title={entry.title}
                    username={entry.username}
                    password={entry.password}
                    url={entry.url}
                    lastUpdated={formatDate(entry.updatedAt)}
                    strength={Encryption.getStrengthLabel(Encryption.calculatePasswordStrength(entry.password))}
                    onEdit={handleEditPassword}
                    onDelete={handleDeletePassword}
                  />
                </motion.div>
              ))}

              {passwords.length < 6 && (
                <motion.div variants={cardHover} initial="rest" whileHover="hover">
                  <Card className="border-dashed border-2 flex items-center justify-center h-[180px]">
                    <Button
                      variant="ghost"
                      className="flex flex-col h-full w-full gap-2 items-center justify-center"
                      onClick={() => router.push("/add")}
                    >
                      <Plus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">Add New Password</span>
                    </Button>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <motion.footer
        className="border-t py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>LOCKEYE Password Manager</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} LOCKEYE. All rights reserved.
          </p>
        </div>
      </motion.footer>
    </div>
  )
}

