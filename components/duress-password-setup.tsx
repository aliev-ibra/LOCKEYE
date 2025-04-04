"use client"

import { useState } from "react"
import { AlertTriangle, Eye, EyeOff, Lock, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { DuressPassword } from "@/lib/duress-password"

interface DuressPasswordSetupProps {
  masterPassword: string
  onClose: () => void
}

export function DuressPasswordSetup({ masterPassword, onClose }: DuressPasswordSetupProps) {
  const [duressPassword, setDuressPassword] = useState("")
  const [confirmDuressPassword, setConfirmDuressPassword] = useState("")
  const [showDuressPassword, setShowDuressPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Handle setup
  const handleSetup = async () => {
    // Validate inputs
    if (!duressPassword) {
      toast({
        title: "Error",
        description: "Please enter a duress password",
        variant: "destructive",
      })
      return
    }

    if (duressPassword !== confirmDuressPassword) {
      toast({
        title: "Error",
        description: "Duress passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (duressPassword === masterPassword) {
      toast({
        title: "Error",
        description: "Duress password cannot be the same as your master password",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Save duress password settings
      await DuressPassword.saveSettings({
        enabled: true,
        duressPassword,
        realPassword: masterPassword,
      })

      toast({
        title: "Success",
        description: "Duress password has been set up successfully",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up duress password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
          Set Up Duress Password
        </CardTitle>
        <CardDescription>Create a separate password that opens a fake vault</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400 dark:text-amber-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                A duress password allows you to access a fake vault when under duress. If someone forces you to unlock
                your password manager, you can enter this password instead of your real master password.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duress-password">Duress Password</Label>
          <div className="relative">
            <Input
              id="duress-password"
              type={showDuressPassword ? "text" : "password"}
              value={duressPassword}
              onChange={(e) => setDuressPassword(e.target.value)}
              placeholder="Enter a duress password"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowDuressPassword(!showDuressPassword)}
            >
              {showDuressPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-duress-password">Confirm Duress Password</Label>
          <Input
            id="confirm-duress-password"
            type="password"
            value={confirmDuressPassword}
            onChange={(e) => setConfirmDuressPassword(e.target.value)}
            placeholder="Confirm your duress password"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Requirements:</p>
          <ul className="text-sm space-y-1">
            <li className="flex items-center">
              <div
                className={`h-2 w-2 rounded-full mr-2 ${duressPassword !== masterPassword ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              Must be different from your master password
            </li>
            <li className="flex items-center">
              <div
                className={`h-2 w-2 rounded-full mr-2 ${duressPassword && duressPassword === confirmDuressPassword ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              Passwords must match
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSetup} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Setting Up...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Set Up Duress Password
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

