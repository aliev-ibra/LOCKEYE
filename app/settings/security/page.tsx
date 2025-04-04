"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Shield, AlertTriangle, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { SelfDestruct } from "@/lib/self-destruct"

export default function SecuritySettingsPage() {
  const router = useRouter()
  const [selfDestructEnabled, setSelfDestructEnabled] = useState(false)
  const [maxAttempts, setMaxAttempts] = useState(5)
  const [vaultShardingEnabled, setVaultShardingEnabled] = useState(false)
  const [numShards, setNumShards] = useState(3)
  const [geofencingEnabled, setGeofencingEnabled] = useState(false)
  const [antiKeyloggerEnabled, setAntiKeyloggerEnabled] = useState(false)
  const [torEnabled, setTorEnabled] = useState(false)

  // Load settings
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    // Load self-destruct settings
    const currentMaxAttempts = SelfDestruct.getMaxAttempts()
    setMaxAttempts(currentMaxAttempts)
    setSelfDestructEnabled(currentMaxAttempts > 0)

    // Load other settings from localStorage
    const shardingEnabled = localStorage.getItem("lockeye_sharding_enabled") === "true"
    setVaultShardingEnabled(shardingEnabled)

    const shards = localStorage.getItem("lockeye_num_shards")
    if (shards) {
      setNumShards(Number.parseInt(shards, 10))
    }

    setGeofencingEnabled(localStorage.getItem("lockeye_geofencing_enabled") === "true")
    setAntiKeyloggerEnabled(localStorage.getItem("lockeye_anti_keylogger_enabled") === "true")
    setTorEnabled(localStorage.getItem("lockeye_tor_enabled") === "true")
  }, [router])

  // Save self-destruct settings
  const saveSelfDestructSettings = () => {
    if (selfDestructEnabled) {
      SelfDestruct.setMaxAttempts(maxAttempts)
    } else {
      SelfDestruct.setMaxAttempts(0) // Disable self-destruct
    }

    toast({
      title: "Settings saved",
      description: "Self-destruct settings have been updated",
    })
  }

  // Save vault sharding settings
  const saveVaultShardingSettings = () => {
    localStorage.setItem("lockeye_sharding_enabled", vaultShardingEnabled.toString())
    localStorage.setItem("lockeye_num_shards", numShards.toString())

    toast({
      title: "Settings saved",
      description: "Vault sharding settings have been updated",
    })
  }

  // Save other security settings
  const saveOtherSettings = () => {
    localStorage.setItem("lockeye_geofencing_enabled", geofencingEnabled.toString())
    localStorage.setItem("lockeye_anti_keylogger_enabled", antiKeyloggerEnabled.toString())
    localStorage.setItem("lockeye_tor_enabled", torEnabled.toString())

    toast({
      title: "Settings saved",
      description: "Security settings have been updated",
    })
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
              <Link href="/settings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Advanced Security Settings</h2>
            <p className="text-muted-foreground">Configure advanced security features</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-red-500" />
                  Self-Destruct Mode
                </CardTitle>
                <CardDescription>Automatically wipe your vault after multiple failed login attempts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="self-destruct" className="block">
                      Enable Self-Destruct
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Wipe all data after consecutive failed login attempts
                    </p>
                  </div>
                  <Switch id="self-destruct" checked={selfDestructEnabled} onCheckedChange={setSelfDestructEnabled} />
                </div>

                {selfDestructEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Maximum failed attempts: {maxAttempts}</Label>
                    </div>
                    <Slider
                      min={3}
                      max={10}
                      step={1}
                      value={[maxAttempts]}
                      onValueChange={(value) => setMaxAttempts(value[0])}
                    />

                    <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-400 dark:text-red-300" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Warning:</strong> After {maxAttempts} failed login attempts, all data in your vault
                            will be permanently deleted. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={saveSelfDestructSettings}>Save Self-Destruct Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vault Sharding</CardTitle>
                <CardDescription>Split your vault into multiple encrypted pieces for enhanced security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="vault-sharding" className="block">
                      Enable Vault Sharding
                    </Label>
                    <p className="text-sm text-muted-foreground">Split your vault into multiple encrypted shards</p>
                  </div>
                  <Switch
                    id="vault-sharding"
                    checked={vaultShardingEnabled}
                    onCheckedChange={setVaultShardingEnabled}
                  />
                </div>

                {vaultShardingEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Number of shards: {numShards}</Label>
                    </div>
                    <Slider
                      min={2}
                      max={5}
                      step={1}
                      value={[numShards]}
                      onValueChange={(value) => setNumShards(value[0])}
                    />

                    <p className="text-sm text-muted-foreground">
                      Your vault will be split into {numShards} encrypted shards. All shards are required to reconstruct
                      your vault.
                    </p>
                  </div>
                )}

                <Button onClick={saveVaultShardingSettings}>Save Vault Sharding Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anti-Keylogger Protection</CardTitle>
                <CardDescription>Protect against keyloggers with an on-screen keyboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="anti-keylogger" className="block">
                      Enable Anti-Keylogger Protection
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Use an on-screen keyboard with random key placement for sensitive inputs
                    </p>
                  </div>
                  <Switch
                    id="anti-keylogger"
                    checked={antiKeyloggerEnabled}
                    onCheckedChange={setAntiKeyloggerEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geofencing</CardTitle>
                <CardDescription>Restrict vault access to specific locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="geofencing" className="block">
                      Enable Geofencing
                    </Label>
                    <p className="text-sm text-muted-foreground">Only allow vault access when in trusted locations</p>
                  </div>
                  <Switch
                    id="geofencing"
                    checked={geofencingEnabled}
                    onCheckedChange={(checked) => {
                      setGeofencingEnabled(checked)
                      if (checked) {
                        toast({
                          title: "Geofencing",
                          description: "In a real app, this would prompt for location permissions",
                        })
                      }
                    }}
                  />
                </div>

                {geofencingEnabled && <Button variant="outline">Configure Trusted Locations</Button>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tor Integration</CardTitle>
                <CardDescription>Route sync operations through the Tor network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tor" className="block">
                      Enable Tor Integration
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Route all sync operations through the Tor network for enhanced privacy
                    </p>
                  </div>
                  <Switch id="tor" checked={torEnabled} onCheckedChange={setTorEnabled} />
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveOtherSettings}>Save All Security Settings</Button>
          </div>
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

