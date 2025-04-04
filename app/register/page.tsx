"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { Encryption } from "@/lib/encryption"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [masterPassword, setMasterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [hint, setHint] = useState("")
  const [createKeyFile, setCreateKeyFile] = useState(false)
  const [loading, setLoading] = useState(false)

  // Calculate password strength
  const passwordStrength = Encryption.calculatePasswordStrength(masterPassword)

  // Get strength label and color
  const getStrengthLabel = () => {
    if (passwordStrength < 40) return { label: "Weak", color: "bg-red-500" }
    if (passwordStrength < 70) return { label: "Medium", color: "bg-yellow-500" }
    return { label: "Strong", color: "bg-green-500" }
  }

  const strengthInfo = getStrengthLabel()

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!email || !masterPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (masterPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordStrength < 40) {
      toast({
        title: "Warning",
        description: "Your master password is weak. Consider using a stronger password.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create a new vault
      await VaultManager.createVault(masterPassword, "My Vault")

      // Generate key file if requested
      if (createKeyFile) {
        // In a real implementation, you would generate a key file here
        // For this demo, we'll just show a toast
        toast({
          title: "Key File",
          description: "Key file would be generated and downloaded in a real implementation",
        })
      }

      toast({
        title: "Success",
        description: "Account created successfully",
      })

      // Redirect to dashboard
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary mb-4">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">LOCKEYE</h1>
          <p className="text-muted-foreground mt-1">Secure Password Manager</p>
        </div>

        <Card>
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle className="text-xl">Create Your Account</CardTitle>
              <CardDescription>Set up your LOCKEYE account to start managing your passwords</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="master-password">Master Password</Label>
                <Input
                  id="master-password"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  required
                />
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Password Strength</span>
                    <span
                      className={`text-xs ${
                        passwordStrength < 40
                          ? "text-red-500"
                          : passwordStrength < 70
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      {strengthInfo.label}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className={strengthInfo.color} />
                </div>
                <p className="text-xs text-muted-foreground">
                  This is the only password you&apos;ll need to remember. Make it strong and unique.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Master Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {masterPassword && confirmPassword && masterPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Passwords do not match
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hint">Password Hint (Optional)</Label>
                <Input
                  id="hint"
                  placeholder="A hint to help you remember your master password"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Don&apos;t make this too obvious. It should only make sense to you.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keyfile"
                  checked={createKeyFile}
                  onCheckedChange={(checked) => setCreateKeyFile(checked === true)}
                />
                <label
                  htmlFor="keyfile"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Create key file (additional security)
                </label>
              </div>

              {createKeyFile && (
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        A key file will be generated and downloaded when you create your account. Store this file
                        securely. You will need both your master password and this key file to access your vault.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LOCKEYE. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

