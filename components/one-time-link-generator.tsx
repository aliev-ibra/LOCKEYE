"use client"

import { useState, useEffect } from "react"
import { Clock, Copy, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { OneTimeAccess } from "@/lib/one-time-access"
import { toast } from "@/components/ui/use-toast"

interface OneTimeLinkGeneratorProps {
  passwordId: string
  password: string
  onClose: () => void
}

export function OneTimeLinkGenerator({ passwordId, password, onClose }: {
  passwordId: string
  password: string
  onClose: () => void
}) {
  const [shareId, setShareId] = useState<string>("")
  const [shareUrl, setShareUrl] = useState<string>("")
  const [expirationMinutes, setExpirationMinutes] = useState(60) // Default: 1 hour
  const [maxAccesses, setMaxAccesses] = useState(1) // Default: 1 access
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  // Generate a share URL safely
  useEffect(() => {
    if (shareId && typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/shared/${shareId}`);
    }
  }, [shareId]);

  // Generate one-time link
  const generateLink = async () => {
    try {
      const link = await OneTimeAccess.createLink(passwordId, password, expirationMinutes, maxAccesses)

      // In a real app, this would be a full URL
      const fullLink = `https://lockeye.app/share/${link}`
      setGeneratedLink(fullLink)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate one-time link",
        variant: "destructive",
      })
    }
  }

  // Copy link to clipboard
  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      toast({
        title: "Link copied",
        description: "One-time link has been copied to clipboard",
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>One-Time Access Link</CardTitle>
        <CardDescription>Create a temporary, self-destructing link to share this password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedLink ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Expires after: {expirationMinutes} minutes</Label>
              </div>
              <Slider
                min={5}
                max={1440} // 24 hours
                step={5}
                value={[expirationMinutes]}
                onValueChange={(value) => setExpirationMinutes(value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span>1 hour</span>
                <span>24 hours</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Maximum accesses: {maxAccesses}</Label>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[maxAccesses]}
                onValueChange={(value) => setMaxAccesses(value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 time</span>
                <span>5 times</span>
                <span>10 times</span>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-400 dark:text-blue-300" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This link will automatically expire after {expirationMinutes} minutes or after being accessed{" "}
                    {maxAccesses} {maxAccesses === 1 ? "time" : "times"}.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Label htmlFor="generated-link">Your one-time access link:</Label>
            <div className="flex gap-2">
              <Input id="generated-link" value={generatedLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Link className="h-5 w-5 text-amber-400 dark:text-amber-300" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This link will expire in {expirationMinutes} minutes or after {maxAccesses}{" "}
                    {maxAccesses === 1 ? "access" : "accesses"}. Anyone with this link can view the password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!generatedLink ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={generateLink}>Generate Link</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={copyToClipboard}>Copy Link</Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

