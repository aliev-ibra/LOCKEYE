"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock, AlertTriangle, ShieldAlert, Clock, Fingerprint, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { DuressPassword } from "@/lib/duress-password"
import { DeadMansSwitch } from "@/lib/dead-mans-switch"
import { OneTimeVault } from "@/lib/one-time-vault"
import { DuressPasswordSetup } from "@/components/duress-password-setup"
import { PassphraseStackingSetup } from "@/components/passphrase-stacking-setup"

export default function AdvancedSecurityPage() {
  const router = useRouter()
  const [masterPassword, setMasterPassword] = useState("")
  const [duressEnabled, setDuressEnabled] = useState(false)
  const [deadMansSwitchEnabled, setDeadMansSwitchEnabled] = useState(false)
  const [deadMansSwitchDays, setDeadMansSwitchDays] = useState(90)
  const [oneTimeVaultEnabled, setOneTimeVaultEnabled] = useState(false)
  const [passphraseStackingEnabled, setPassphraseStackingEnabled] = useState(false)
  const [invisibleModeEnabled, setInvisibleModeEnabled] = useState(false)

  const [showDuressSetup, setShowDuressSetup] = useState(false)
  const [showPassphraseStackingSetup, setShowPassphraseStackingSetup] = useState(false)

  // Load settings
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    // Load duress settings
    setDuressEnabled(DuressPassword.isDuressEnabled())

    // Load dead man's switch settings
    const deadMansSwitchSettings = DeadMansSwitch.getSettings()
    setDeadMansSwitchEnabled(deadMansSwitchSettings.enabled)
    setDeadMansSwitchDays(deadMansSwitchSettings.inactiveDays)

    // Load one-time vault settings
    const oneTimeVaultSettings = OneTimeVault.getSettings()
    setOneTimeVaultEnabled(oneTimeVaultSettings.enabled)

    // Load invisible mode settings
    setInvisibleModeEnabled(localStorage.getItem("lockeye_invisible_mode_enabled") === "true")

    // Load passphrase stacking settings (would require master password to decrypt in a real implementation)
    setPassphraseStackingEnabled(localStorage.getItem("lockeye_passphrase_stacking_enabled") === "true")
  }, [router])

  // Save dead man's switch settings
  const saveDeadMansSwitchSettings = () => {
    DeadMansSwitch.saveSettings({
      enabled: deadMansSwitchEnabled,
      inactiveDays: deadMansSwitchDays,
      lastAccessTimestamp: Date.now(),
      warningDays: 7,
      warningShown: false,
    })

    toast({
      title: "Settings saved",
      description: "Dead man's switch settings have been updated",
    })
  }

  // Save one-time vault settings
  const saveOneTimeVaultSettings = () => {
    if (oneTimeVaultEnabled) {
      OneTimeVault.enableOneTimeVault()
    } else {
      OneTimeVault.disableOneTimeVault()
    }

    toast({
      title: "Settings saved",
      description: "One-time vault settings have been updated",
    })
  }

  // Save invisible mode settings
  const saveInvisibleModeSettings = () => {
    localStorage.setItem("lockeye_invisible_mode_enabled", invisibleModeEnabled.toString())

    toast({
      title: "Settings saved",
      description: "Invisible mode settings have been updated",
    })
  }

  // Handle master password verification
  const verifyMasterPassword = async () => {
    if (!masterPassword) {
      toast({
        title: "Error",
        description: "Please enter your master password",
        variant: "destructive",
      })
      return false
    }

    try {
      const success = await VaultManager.unlockVault(masterPassword)

      if (!success) {
        toast({
          title: "Error",
          description: "Invalid master password",
          variant: "destructive",
        })
        return false
      }

      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify master password",
        variant: "destructive",
      })
      return false
    }
  }

  // Handle duress password setup
  const handleDuressSetup = async () => {
    if (await verifyMasterPassword()) {
      setShowDuressSetup(true)
    }
  }

  // Handle passphrase stacking setup
  const handlePassphraseStackingSetup = async () => {
    if (await verifyMasterPassword()) {
      setShowPassphraseStackingSetup(true)
    }
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
            <h2 className="text-3xl font-bold tracking-tight">Ultra-Advanced Security</h2>
            <p className="text-muted-foreground">Configure cutting-edge security features</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
                  Duress Password
                </CardTitle>
                <CardDescription>Create a separate password that opens a fake vault</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="duress-password" className="block">
                      Enable Duress Password
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create a separate password that opens a fake vault when under duress
                    </p>
                  </div>
                  <Switch
                    id="duress-password"
                    checked={duressEnabled}
                    onCheckedChange={setDuressEnabled}
                    disabled={showDuressSetup}
                  />
                </div>

                {duressEnabled && !showDuressSetup && (
                  <div className="space-y-4">
                    <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-amber-400 dark:text-amber-300" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            A duress password allows you to access a fake vault when under duress. If someone forces you
                            to unlock your password manager, you can enter this password instead of your real master
                            password.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="master-password">Enter Master Password to Configure</Label>
                      <Input
                        id="master-password"
                        type="password"
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="Enter your master password"
                      />
                    </div>

                    <Button onClick={handleDuressSetup}>Configure Duress Password</Button>
                  </div>
                )}

                {showDuressSetup && (
                  <DuressPasswordSetup masterPassword={masterPassword} onClose={() => setShowDuressSetup(false)} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-red-500" />
                  Dead Man's Switch
                </CardTitle>
                <CardDescription>Auto-delete your vault if not accessed for a specified period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dead-mans-switch" className="block">
                      Enable Dead Man's Switch
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete your vault if not accessed for a specified period
                    </p>
                  </div>
                  <Switch
                    id="dead-mans-switch"
                    checked={deadMansSwitchEnabled}
                    onCheckedChange={setDeadMansSwitchEnabled}
                  />
                </div>

                {deadMansSwitchEnabled && (
                  <div className="space-y-4">
                    <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-400 dark:text-red-300" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Warning:</strong> If you do not access your vault for the specified period, all your
                            data will be permanently deleted. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Inactive period: {deadMansSwitchDays} days</Label>
                      </div>
                      <Slider
                        min={30}
                        max={365}
                        step={30}
                        value={[deadMansSwitchDays]}
                        onValueChange={(value) => setDeadMansSwitchDays(value[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your vault will be deleted if not accessed for {deadMansSwitchDays} days
                      </p>
                    </div>

                    <Button onClick={saveDeadMansSwitchSettings}>Save Dead Man's Switch Settings</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Fingerprint className="mr-2 h-5 w-5 text-blue-500" />
                  Passphrase Stacking
                </CardTitle>
                <CardDescription>Require multiple passphrases in sequence to unlock</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="passphrase-stacking" className="block">
                      Enable Passphrase Stacking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Require multiple passphrases in sequence to unlock your vault
                    </p>
                  </div>
                  <Switch
                    id="passphrase-stacking"
                    checked={passphraseStackingEnabled}
                    onCheckedChange={setPassphraseStackingEnabled}
                    disabled={showPassphraseStackingSetup}
                  />
                </div>

                {passphraseStackingEnabled && !showPassphraseStackingSetup && (
                  <div className="space-y-4">
                    <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-blue-400 dark:text-blue-300" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Passphrase stacking adds an extra layer of security by requiring multiple passphrases to be
                            entered in sequence. You will need to remember all of these passphrases to access your
                            vault.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="master-password-stacking">Enter Master Password to Configure</Label>
                      <Input
                        id="master-password-stacking"
                        type="password"
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="Enter your master password"
                      />
                    </div>

                    <Button onClick={handlePassphraseStackingSetup}>Configure Passphrase Stacking</Button>
                  </div>
                )}

                {showPassphraseStackingSetup && (
                  <PassphraseStackingSetup
                    masterPassword={masterPassword}
                    onClose={() => setShowPassphraseStackingSetup(false)}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="mr-2 h-5 w-5 text-purple-500" />
                  One-Time Vault
                </CardTitle>
                <CardDescription>A vault that deletes itself after one successful login</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="one-time-vault" className="block">
                      Enable One-Time Vault
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create a vault that deletes itself after one successful login
                    </p>
                  </div>
                  <Switch id="one-time-vault" checked={oneTimeVaultEnabled} onCheckedChange={setOneTimeVaultEnabled} />
                </div>

                {oneTimeVaultEnabled && (
                  <div className="space-y-4">
                    <div className="rounded-md bg-purple-50 p-4 dark:bg-purple-900/20">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-purple-400 dark:text-purple-300" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>Warning:</strong> When one-time vault mode is enabled, your vault will be
                            permanently deleted after you log in once. This is useful for situations where you need to
                            access your passwords once and then have them automatically destroyed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={saveOneTimeVaultSettings}>Save One-Time Vault Settings</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invisible Mode</CardTitle>
                <CardDescription>Hide LOCKEYE from app lists, accessible only via a secret key combo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="invisible-mode" className="block">
                      Enable Invisible Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">Hide LOCKEYE from app lists and recent apps</p>
                  </div>
                  <Switch
                    id="invisible-mode"
                    checked={invisibleModeEnabled}
                    onCheckedChange={setInvisibleModeEnabled}
                  />
                </div>

                {invisibleModeEnabled && (
                  <div className="space-y-4">
                    <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-green-400 dark:text-green-300" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            When invisible mode is enabled, LOCKEYE will be hidden from app lists and recent apps. To
                            access LOCKEYE, use the secret key combination: <strong>Ctrl+Shift+L</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={saveInvisibleModeSettings}>Save Invisible Mode Settings</Button>
                  </div>
                )}
              </CardContent>
            </Card>
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

