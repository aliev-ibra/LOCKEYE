"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QRCodeManager } from "@/lib/qr-code"
import { toast } from "@/components/ui/use-toast"

interface QRCodeGeneratorProps {
  title: string
  username: string
  password: string
  onClose: () => void
}

export function QRCodeGenerator({ title, username, password, onClose }: {
  title: string
  username: string
  password: string
  onClose: () => void
}) {
  const [qrValue, setQrValue] = useState<string>("")
  
  // Generate QR code data safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Any code using location should be here
      setQrValue(`Password for ${title}: ${password}`);
    }
  }, [title, password]);
  const [encryptionKey, setEncryptionKey] = useState("")
  const [qrCodeData, setQRCodeData] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)

  // Generate QR code
  const generateQRCode = async () => {
    if (!encryptionKey) {
      toast({
        title: "Error",
        description: "Please enter an encryption key",
        variant: "destructive",
      })
      return
    }

    try {
      const data = await QRCodeManager.generateQRCodeData(password, title, username, encryptionKey)

      setQRCodeData(data)
      setShowQRCode(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      })
    }
  }

  // Download QR code as PNG
  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement
    if (!canvas) return

    const pngUrl = canvas.toDataURL("image/png")
    const downloadLink = document.createElement("a")
    downloadLink.href = pngUrl
    downloadLink.download = `${title.replace(/\s+/g, "-").toLowerCase()}-qrcode.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
        <CardDescription>Generate an encrypted QR code for your password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showQRCode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="encryption-key">Encryption Key</Label>
              <Input
                id="encryption-key"
                type="password"
                placeholder="Enter a secure encryption key"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This key will be needed to decrypt the QR code. Keep it safe.
              </p>
            </div>

            <div>
              <p className="text-sm mb-2">Password Information:</p>
              <ul className="text-sm space-y-1">
                <li>
                  <strong>Title:</strong> {title}
                </li>
                <li>
                  <strong>Username:</strong> {username}
                </li>
                <li>
                  <strong>Password:</strong> {"•".repeat(password.length)}
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div id="qr-code-canvas" className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={qrCodeData || ""} size={200} level="H" includeMargin={true} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Scan this QR code with the LOCKEYE app to access your password
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!showQRCode ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={generateQRCode}>Generate QR Code</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setShowQRCode(false)}>
              Back
            </Button>
            <Button onClick={downloadQRCode}>Download QR Code</Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

