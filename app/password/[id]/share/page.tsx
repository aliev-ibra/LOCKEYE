"use client"

import { useState, useEffect } from "react" // Add useEffect import
import { useRouter, useParams } from "next/navigation"
import { Lock, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { OneTimeLinkGenerator } from "@/components/one-time-link-generator"
import { QRCodeGenerator } from "@/components/qr-code-generator"

export default function SharePasswordPage() {
  const router = useRouter()
  const params = useParams()
  const passwordId = params?.id as string

  const [password, setPassword] = useState<{
    id: string
    title: string
    username: string
    password: string
  } | null>(null)

  const [loading, setLoading] = useState(true)

  // Fix: Use useEffect instead of useState for side effects
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    const loadPassword = async () => {
      try {
        setLoading(true)
        const entries = await VaultManager.getAllEntries()
        const entry = entries.find((e) => e.id === passwordId)

        if (entry) {
          setPassword({
            id: entry.id,
            title: entry.title,
            username: entry.username,
            password: entry.password,
          })
        } else {
          toast({
            title: "Error",
            description: "Password not found",
            variant: "destructive",
          })
          router.push("/")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load password",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadPassword()
  }, [passwordId, router]) // Add dependencies

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
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              Back
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight flex items-center">
              <Share2 className="mr-2 h-6 w-6 text-primary" />
              Share Password
            </h2>
            {password && <p className="text-muted-foreground">Share "{password.title}" securely</p>}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : password ? (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Secure Sharing Options</CardTitle>
                  <CardDescription>Choose how you want to share this password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="one-time-link">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="one-time-link">One-Time Link</TabsTrigger>
                      <TabsTrigger value="qr-code">QR Code</TabsTrigger>
                    </TabsList>
                    <TabsContent value="one-time-link" className="mt-4">
                      <OneTimeLinkGenerator
                        passwordId={password.id}
                        password={password.password}
                        onClose={() => router.back()}
                      />
                    </TabsContent>
                    <TabsContent value="qr-code" className="mt-4">
                      <QRCodeGenerator
                        title={password.title}
                        username={password.username}
                        password={password.password}
                        onClose={() => router.back()}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p>Password not found</p>
            </div>
          )}
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

