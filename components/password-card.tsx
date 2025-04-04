"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Copy, Edit, EyeOff, Eye, Trash2, ExternalLink, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { VaultManager } from "@/lib/vault"

interface PasswordCardProps {
  id: string
  title: string
  username: string
  password: string
  url: string
  lastUpdated: string
  strength: "weak" | "medium" | "strong"
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function PasswordCard({
  id,
  title,
  username,
  password,
  url,
  lastUpdated,
  strength,
  onEdit,
  onDelete,
}: PasswordCardProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [maskedPassword, setMaskedPassword] = useState("••••••••••••")

  // Update masked password when the actual password changes
  useEffect(() => {
    setMaskedPassword("•".repeat(Math.min(password.length, 16)))
  }, [password])

  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
    toast({
      title: "Password copied",
      description: "Password has been copied to clipboard",
    })

    // Auto-clear clipboard after 30 seconds
    VaultManager.clearClipboardAfterDelay(30)
  }

  const handleEdit = () => {
    onEdit(id)
  }

  const handleDelete = () => {
    onDelete(id)
  }

  const handleShare = () => {
    router.push(`/password/${id}/share`)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              strength === "weak"
                ? "border-red-500 text-red-500"
                : strength === "medium"
                  ? "border-yellow-500 text-yellow-500"
                  : "border-green-500 text-green-500",
            )}
          >
            {strength}
          </Badge>
        </div>
        <CardDescription>{username}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full">
            <Input type="text" value={showPassword ? password : maskedPassword} readOnly className="pr-10 font-mono" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>Last updated: {lastUpdated}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy password">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleEdit} title="Edit password">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare} title="Share password">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive"
            onClick={handleDelete}
            title="Delete password"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="icon" asChild title="Visit website">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { type?: string }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

