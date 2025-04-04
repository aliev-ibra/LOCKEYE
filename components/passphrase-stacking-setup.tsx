"use client"

import { useState } from "react"
import { AlertTriangle, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { PassphraseStacking } from "@/lib/passphrase-stacking"

interface PassphraseStackingSetupProps {
  masterPassword: string
  onClose: () => void
}

export function PassphraseStackingSetup({ masterPassword, onClose }: PassphraseStackingSetupProps) {
  const [passphrases, setPassphrases] = useState<string[]>(["", ""])
  const [loading, setLoading] = useState(false)

  // Add a new passphrase field
  const addPassphrase = () => {
    setPassphrases([...passphrases, ""])
  }

  // Remove a passphrase field
  const removePassphrase = (index: number) => {
    if (passphrases.length <= 2) {
      toast({
        title: "Error",
        description: "At least 2 passphrases are required",
        variant: "destructive",
      })
      return
    }

    const newPassphrases = [...passphrases]
    newPassphrases.splice(index, 1)
    setPassphrases(newPassphrases)
  }

  // Update a passphrase
  const updatePassphrase = (index: number, value: string) => {
    const newPassphrases = [...passphrases]
    newPassphrases[index] = value
    setPassphrases(newPassphrases)
  }

  // Handle setup
  const handleSetup = async () => {
    // Validate inputs
    if (passphrases.some((phrase) => !phrase)) {
      toast({
        title: "Error",
        description: "Please fill in all passphrase fields",
        variant: "destructive",
      })
      return
    }

    // Check for duplicates
    const uniquePhrases = new Set(passphrases)
    if (uniquePhrases.size !== passphrases.length) {
      toast({
        title: "Error",
        description: "Passphrases must be unique",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Enable passphrase stacking
      await PassphraseStacking.enablePassphraseStacking(passphrases, masterPassword)

      toast({
        title: "Success",
        description: "Passphrase stacking has been set up successfully",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up passphrase stacking",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set Up Passphrase Stacking</CardTitle>
        <CardDescription>Require multiple passphrases in sequence to unlock your vault</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-400 dark:text-blue-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Passphrase stacking adds an extra layer of security by requiring multiple passphrases to be entered in
                sequence. You will need to remember all of these passphrases to access your vault.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {passphrases.map((passphrase, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor={`passphrase-${index}`} className="mb-1 block">
                  Passphrase {index + 1}
                </Label>
                <Input
                  id={`passphrase-${index}`}
                  type="password"
                  value={passphrase}
                  onChange={(e) => updatePassphrase(index, e.target.value)}
                  placeholder={`Enter passphrase ${index + 1}`}
                />
              </div>
              {passphrases.length > 2 && (
                <Button variant="ghost" size="icon" className="mt-6" onClick={() => removePassphrase(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addPassphrase} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Passphrase
          </Button>
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
            "Set Up Passphrase Stacking"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

