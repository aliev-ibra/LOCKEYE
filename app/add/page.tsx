"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy, Lock, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { Encryption } from "@/lib/encryption"

export default function AddPasswordPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [notes, setNotes] = useState("")
  const [passwordLength, setPasswordLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [usePassphrase, setUsePassphrase] = useState(false)
  const [passphraseLength, setPassphraseLength] = useState(4)
  const [loading, setLoading] = useState(false)

  // Calculate password strength
  const passwordStrength = Encryption.calculatePasswordStrength(password)
  const strengthLabel = Encryption.getStrengthLabel(passwordStrength)

  // Generate password
  const generatePassword = () => {
    try {
      if (usePassphrase) {
        const passphrase = Encryption.generatePassphrase(passphraseLength)
        setPassword(passphrase)
      } else {
        const newPassword = Encryption.generatePassword(
          passwordLength,
          includeUppercase,
          includeLowercase,
          includeNumbers,
          includeSymbols,
        )
        setPassword(newPassword)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Please select at least one character type",
        variant: "destructive",
      })
    }
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password)
      toast({
        title: "Password copied",
        description: "Password has been copied to clipboard",
      })

      // Auto-clear clipboard after 30 seconds
      VaultManager.clearClipboardAfterDelay(30)
    }
  }

  // Save password
  const savePassword = async () => {
    if (!title || !password) {
      toast({
        title: "Error",
        description: "Please enter a title and password",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await VaultManager.addEntry({
        title,
        username,
        password,
        url,
        notes,
      })

      toast({
        title: "Success",
        description: "Password saved successfully",
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add New Password</CardTitle>
                <CardDescription>Store a new password in your secure vault</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Website or App Name</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Google, Twitter, etc."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username or Email</Label>
                  <Input
                    id="username"
                    placeholder="your.email@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter or generate a password"
                      className="font-mono"
                    />
                    <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!password}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {password && (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Password Strength</span>
                        <span
                          className={`text-xs ${
                            strengthLabel === "weak"
                              ? "text-red-500"
                              : strengthLabel === "medium"
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {strengthLabel.charAt(0).toUpperCase() + strengthLabel.slice(1)}
                        </span>
                      </div>
                      <Progress
                        value={passwordStrength}
                        className={
                          strengthLabel === "weak"
                            ? "bg-red-500"
                            : strengthLabel === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Add any additional notes here"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={savePassword} disabled={loading}>
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Save Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password Generator</CardTitle>
                <CardDescription>Create a strong, random password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch id="passphrase" checked={usePassphrase} onCheckedChange={setUsePassphrase} />
                  <label
                    htmlFor="passphrase"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Generate a memorable passphrase instead
                  </label>
                </div>

                {usePassphrase ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="passphrase-length">Number of Words: {passphraseLength}</Label>
                    </div>
                    <Slider
                      id="passphrase-length"
                      min={3}
                      max={8}
                      step={1}
                      value={[passphraseLength]}
                      onValueChange={(value) => setPassphraseLength(value[0])}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="length">Password Length: {passwordLength}</Label>
                      </div>
                      <Slider
                        id="length"
                        min={8}
                        max={32}
                        step={1}
                        value={[passwordLength]}
                        onValueChange={(value) => setPasswordLength(value[0])}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="uppercase">Include Uppercase Letters</Label>
                        <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="lowercase">Include Lowercase Letters</Label>
                        <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="numbers">Include Numbers</Label>
                        <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="symbols">Include Symbols</Label>
                        <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4">
                  <Button onClick={generatePassword} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" /> Generate {usePassphrase ? "Passphrase" : "Password"}
                  </Button>
                </div>

                {password && (
                  <div className="mt-4 space-y-2">
                    <Label>Generated {usePassphrase ? "Passphrase" : "Password"}</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-full overflow-x-auto rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono">
                        {password}
                      </div>
                      <Button variant="outline" size="icon" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
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

