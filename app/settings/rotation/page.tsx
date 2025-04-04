"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RotateCw, Lock, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { VaultManager, type PasswordEntry } from "@/lib/vault"
import { PasswordRotation } from "@/lib/password-rotation"

export default function PasswordRotationPage() {
  const router = useRouter()
  const [rotationEnabled, setRotationEnabled] = useState(false)
  const [intervalDays, setIntervalDays] = useState(90)
  const [minStrength, setMinStrength] = useState(70)
  const [passwordsToRotate, setPasswordsToRotate] = useState<PasswordEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [rotating, setRotating] = useState(false)

  // Load settings
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    // Load password rotation settings
    const settings = PasswordRotation.getSettings()
    setRotationEnabled(settings.enabled)
    setIntervalDays(settings.intervalDays)
    setMinStrength(settings.minStrength)

    // Load passwords that need rotation
    loadPasswordsNeedingRotation()
  }, [router])

  // Load passwords that need rotation
  const loadPasswordsNeedingRotation = async () => {
    setLoading(true)
    try {
      const passwords = await PasswordRotation.getPasswordsNeedingRotation()
      setPasswordsToRotate(passwords)
    } catch (error) {
      console.error("Failed to load passwords needing rotation:", error)
    } finally {
      setLoading(false)
    }
  }

  // Save password rotation settings
  const saveSettings = () => {
    PasswordRotation.saveSettings({
      enabled: rotationEnabled,
      intervalDays,
      minStrength,
      excludedIds: [],
    })

    toast({
      title: "Settings saved",
      description: "Password rotation settings have been updated",
    })

    // Reload passwords that need rotation
    loadPasswordsNeedingRotation()
  }

  // Perform automatic password rotation
  const performAutoRotation = async () => {
    setRotating(true)

    try {
      const result = await PasswordRotation.performAutoRotation()

      if (result.rotated.length > 0) {
        toast({
          title: "Success",
          description: `Rotated ${result.rotated.length} passwords successfully`,
        })
      }

      if (result.failed.length > 0) {
        toast({
          title: "Warning",
          description: `Failed to rotate ${result.failed.length} passwords`,
          variant: "destructive",
        })
      }

      // Reload passwords that need rotation
      loadPasswordsNeedingRotation()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform automatic password rotation",
        variant: "destructive",
      })
    } finally {
      setRotating(false)
    }
  }

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
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
            <h2 className="text-3xl font-bold tracking-tight">Password Rotation</h2>
            <p className="text-muted-foreground">Configure automatic password rotation</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RotateCw className="mr-2 h-5 w-5 text-primary" />
                  Automatic Password Rotation
                </CardTitle>
                <CardDescription>Automatically rotate old or weak passwords</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="rotation" className="block">
                      Enable Password Rotation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate new passwords for old or weak entries
                    </p>
                  </div>
                  <Switch id="rotation" checked={rotationEnabled} onCheckedChange={setRotationEnabled} />
                </div>

                {rotationEnabled && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Rotation interval: {intervalDays} days</Label>
                      </div>
                      <Slider
                        min={30}
                        max={365}
                        step={30}
                        value={[intervalDays]}
                        onValueChange={(value) => setIntervalDays(value[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Passwords older than {intervalDays} days will be flagged for rotation
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Minimum strength: {minStrength}%</Label>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={10}
                        value={[minStrength]}
                        onValueChange={(value) => setMinStrength(value[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Passwords with strength below {minStrength}% will be flagged for rotation
                      </p>
                    </div>
                  </>
                )}

                <Button onClick={saveSettings}>Save Rotation Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passwords Needing Rotation</CardTitle>
                <CardDescription>Passwords that are old or weak and should be rotated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : passwordsToRotate.length > 0 ? (
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {passwordsToRotate.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{entry.title}</p>
                            <p className="text-sm text-muted-foreground">{entry.username}</p>
                            <p className="text-xs text-muted-foreground">Last updated: {formatDate(entry.updatedAt)}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/edit/${entry.id}`)}>
                            Update
                          </Button>
                        </li>
                      ))}
                    </ul>

                    <Button onClick={performAutoRotation} disabled={rotating} className="w-full">
                      {rotating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Rotating Passwords...
                        </>
                      ) : (
                        <>
                          <RotateCw className="mr-2 h-4 w-4" />
                          Rotate All Passwords Automatically
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-400 dark:text-green-300" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          All passwords are up to date. No passwords need rotation at this time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password Rotation History</CardTitle>
                <CardDescription>View history of automatic password rotations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {PasswordRotation.getLastRotation() > 0
                    ? `Last automatic rotation performed on ${formatDate(PasswordRotation.getLastRotation())}`
                    : "No automatic rotations have been performed yet"}
                </p>
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

// Remove these unused functions
// Function to get last rotation safely
// const getLastRotation = () => {
//   if (typeof window === 'undefined') {
//     return null; // Return null or a default value when on server
//   }
//   
//   const lastRotation = localStorage.getItem('lastPasswordRotation');
//   return lastRotation ? new Date(JSON.parse(lastRotation)) : null;
// };
// 
// // Use this function instead of directly accessing localStorage
// const lastRotationDate = getLastRotation();

