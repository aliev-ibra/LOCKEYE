"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Upload, Lock, Moon, Sun } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"

export default function SettingsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [autoLockTime, setAutoLockTime] = useState(5)
  const [clearClipboard, setClearClipboard] = useState(true)
  const [clearClipboardTime, setClearClipboardTime] = useState(30)
  const [offlineMode, setOfflineMode] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [hardwareKeyEnabled, setHardwareKeyEnabled] = useState(false)
  const [fakeVaultEnabled, setFakeVaultEnabled] = useState(false)

  // Load settings
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    // Load auto-lock time
    const storedAutoLockTime = VaultManager.getAutoLockTime()
    setAutoLockTime(storedAutoLockTime)

    // Load theme preference
    const storedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "system"
    setTheme(storedTheme)

    // Apply theme
    applyTheme(storedTheme)
  }, [router])

  // Apply theme
  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    applyTheme(newTheme)
  }

  // Handle auto-lock time change
  const handleAutoLockTimeChange = (value: number[]) => {
    const newTime = value[0]
    setAutoLockTime(newTime)
    VaultManager.setAutoLockTime(newTime)
  }

  // Handle backup
  const handleBackup = async () => {
    try {
      const backup = await VaultManager.createBackup()

      // Create a blob and download it
      const blob = new Blob([backup], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lockeye-backup-${new Date().toISOString().split("T")[0]}.lockeyebackup`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Backup created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      })
    }
  }

  // Handle restore
  const handleRestore = () => {
    // Open file picker
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".lockeyebackup"
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        const file = target.files[0]
        const reader = new FileReader()
        reader.onload = async (event) => {
          if (event.target && typeof event.target.result === "string") {
            try {
              // In a real app, you would prompt for the master password here
              const masterPassword = prompt("Enter your master password to restore the backup")
              if (!masterPassword) return

              await VaultManager.restoreBackup(event.target.result, masterPassword)

              toast({
                title: "Success",
                description: "Backup restored successfully",
              })

              // Redirect to dashboard
              router.push("/")
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to restore backup. Invalid backup or incorrect password.",
                variant: "destructive",
              })
            }
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

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
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">Configure your LOCKEYE experience</p>
          </div>

          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize how LOCKEYE looks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => handleThemeChange("light")}
                        >
                          <Sun className="mr-2 h-4 w-4" />
                          Light
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => handleThemeChange("dark")}
                        >
                          <Moon className="mr-2 h-4 w-4" />
                          Dark
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => handleThemeChange("system")}
                        >
                          System
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Lock</CardTitle>
                    <CardDescription>Configure when LOCKEYE should automatically lock</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Auto-lock after inactivity: {autoLockTime} minutes</Label>
                      </div>
                      <Slider
                        min={1}
                        max={60}
                        step={1}
                        value={[autoLockTime]}
                        onValueChange={handleAutoLockTimeChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your vault will automatically lock after this period of inactivity
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Clipboard</CardTitle>
                    <CardDescription>Configure clipboard behavior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clear-clipboard">Auto-clear clipboard</Label>
                      <Switch id="clear-clipboard" checked={clearClipboard} onCheckedChange={setClearClipboard} />
                    </div>

                    {clearClipboard && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Clear after: {clearClipboardTime} seconds</Label>
                        </div>
                        <Slider
                          min={5}
                          max={120}
                          step={5}
                          value={[clearClipboardTime]}
                          onValueChange={(value) => setClearClipboardTime(value[0])}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="2fa" className="block">
                          Enable 2FA
                        </Label>
                        <p className="text-sm text-muted-foreground">Require a verification code when logging in</p>
                      </div>
                      <Switch
                        id="2fa"
                        checked={twoFactorEnabled}
                        onCheckedChange={(checked) => {
                          setTwoFactorEnabled(checked)
                          if (checked) {
                            toast({
                              title: "2FA",
                              description: "In a real app, this would open the 2FA setup flow",
                            })
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hardware Key</CardTitle>
                    <CardDescription>Use a hardware security key for authentication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="hardware-key" className="block">
                          Enable Hardware Key
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Use YubiKey or similar devices for authentication
                        </p>
                      </div>
                      <Switch
                        id="hardware-key"
                        checked={hardwareKeyEnabled}
                        onCheckedChange={(checked) => {
                          setHardwareKeyEnabled(checked)
                          if (checked) {
                            toast({
                              title: "Hardware Key",
                              description: "In a real app, this would open the hardware key setup flow",
                            })
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fake Vault</CardTitle>
                    <CardDescription>Create a decoy vault for plausible deniability</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="fake-vault" className="block">
                          Enable Fake Vault
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Create a decoy vault that opens with an alternative password
                        </p>
                      </div>
                      <Switch
                        id="fake-vault"
                        checked={fakeVaultEnabled}
                        onCheckedChange={(checked) => {
                          setFakeVaultEnabled(checked)
                          if (checked) {
                            toast({
                              title: "Fake Vault",
                              description: "In a real app, this would open the fake vault setup flow",
                            })
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Change Master Password</CardTitle>
                    <CardDescription>Update your master password</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button>Change Master Password</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="backup">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Backup</CardTitle>
                    <CardDescription>Create an encrypted backup of your vault</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      Your backup will be encrypted with your master password. You will need your master password to
                      restore it.
                    </p>
                    <Button onClick={handleBackup}>
                      <Download className="mr-2 h-4 w-4" />
                      Create Backup
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Restore</CardTitle>
                    <CardDescription>Restore your vault from a backup</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      Warning: Restoring a backup will replace your current vault. Make sure to back up your current
                      vault first.
                    </p>
                    <Button variant="outline" onClick={handleRestore}>
                      <Upload className="mr-2 h-4 w-4" />
                      Restore from Backup
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Offline Mode</CardTitle>
                    <CardDescription>Control network access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="offline-mode" className="block">
                          Offline-Only Mode
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Prevent any network communication for absolute privacy
                        </p>
                      </div>
                      <Switch id="offline-mode" checked={offlineMode} onCheckedChange={setOfflineMode} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Export Data</CardTitle>
                    <CardDescription>Export your data in various formats</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline">Export as CSV</Button>
                      <Button variant="outline">Export as JSON</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                    <CardDescription>Destructive actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="destructive">Delete All Data</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
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

