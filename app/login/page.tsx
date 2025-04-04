"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, FileKey, AlertTriangle, Keyboard } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { SelfDestruct } from "@/lib/self-destruct"
import { VirtualKeyboard } from "@/components/virtual-keyboard"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [useKeyFile, setUseKeyFile] = useState(false)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0) // Initialize with 0
  const [maxAttempts, setMaxAttempts] = useState(0) // Initialize with 0
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Move localStorage-dependent code into useEffect
  useEffect(() => {
    setFailedAttempts(SelfDestruct.getFailedAttempts())
    setMaxAttempts(SelfDestruct.getMaxAttempts())
  }, [])

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your master password",
        variant: "destructive",
      })
      return
    }

    if (useKeyFile && !keyFile) {
      toast({
        title: "Error",
        description: "Please select a key file",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // In a real implementation, you would combine the keyfile with the master password
      // For this demo, we'll just check if the vault can be unlocked with the password
      const success = await VaultManager.unlockVault(password)

      if (success) {
        // Record successful login
        SelfDestruct.recordSuccessfulLogin()

        toast({
          title: "Success",
          description: "Logged in successfully",
        })
        router.push("/")
      } else {
        // Record failed login attempt
        const selfDestructTriggered = SelfDestruct.recordFailedAttempt()
        setFailedAttempts(SelfDestruct.getFailedAttempts())

        if (selfDestructTriggered) {
          toast({
            title: "Self-Destruct Activated",
            description: "Too many failed attempts. All data has been wiped.",
            variant: "destructive",
          })

          // Redirect to register page after a delay
          setTimeout(() => {
            router.push("/register")
          }, 2000)
        } else {
          toast({
            title: "Error",
            description: "Invalid master password",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlock vault",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle key file selection
  const handleKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setKeyFile(e.target.files[0])
    }
  }

  // Handle virtual keyboard key press
  const handleVirtualKeyPress = (key: string) => {
    setPassword(password + key)
  }

  // Handle virtual keyboard backspace
  const handleVirtualBackspace = () => {
    setPassword(password.slice(0, -1))
  }

  // Handle virtual keyboard enter
  const handleVirtualEnter = () => {
    handleLogin(new Event("submit") as any)
  }

  // Toggle virtual keyboard
  const toggleVirtualKeyboard = () => {
    setShowVirtualKeyboard(!showVirtualKeyboard)

    // Focus the password input when hiding the keyboard
    if (showVirtualKeyboard && passwordInputRef.current) {
      passwordInputRef.current.focus()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <div className="w-full max-w-md px-4">
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex items-center justify-center h-12 w-12 rounded-full bg-primary mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          >
            <Lock className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <motion.h1
            className="text-3xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            LOCKEYE
          </motion.h1>
          <motion.p
            className="text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Secure Password Manager
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card>
            <form onSubmit={handleLogin}>
              <CardHeader>
                <CardTitle className="text-xl">Login to Your Vault</CardTitle>
                <CardDescription>Enter your master password to access your passwords</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  className="space-y-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </motion.div>
                <motion.div
                  className="space-y-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Master Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      ref={passwordInputRef}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={toggleVirtualKeyboard}
                      title="Use virtual keyboard"
                    >
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>

                {showVirtualKeyboard && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VirtualKeyboard
                      onKeyPress={handleVirtualKeyPress}
                      onBackspace={handleVirtualBackspace}
                      onEnter={handleVirtualEnter}
                      randomize={true}
                      className="mt-4"
                    />
                  </motion.div>
                )}

                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  <Checkbox
                    id="keyfile"
                    checked={useKeyFile}
                    onCheckedChange={(checked) => setUseKeyFile(checked === true)}
                  />
                  <label
                    htmlFor="keyfile"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Use key file (additional security)
                  </label>
                </motion.div>

                {useKeyFile && (
                  <motion.div
                    className="space-y-2"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="keyfile-upload">Key File</Label>
                    <div className="flex items-center gap-2">
                      <Input id="keyfile-upload" type="file" onChange={handleKeyFileChange} className="hidden" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("keyfile-upload")?.click()}
                        className="w-full"
                      >
                        <FileKey className="mr-2 h-4 w-4" />
                        {keyFile ? keyFile.name : "Select Key File"}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {maxAttempts > 0 && failedAttempts > 0 && (
                  <motion.div
                    className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-400 dark:text-amber-300" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Warning: {failedAttempts} failed login {failedAttempts === 1 ? "attempt" : "attempts"}. Your
                          vault will be wiped after {maxAttempts} failed attempts.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Unlocking...
                      </div>
                    ) : (
                      "Unlock Vault"
                    )}
                  </Button>
                </motion.div>
                <motion.div
                  className="text-center text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    Create account
                  </Link>
                </motion.div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>

        <motion.div
          className="mt-8 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p>&copy; {new Date().getFullYear()} LOCKEYE. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  )
}

