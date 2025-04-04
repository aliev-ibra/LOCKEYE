"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, Edit, Eye, FileText, Lock, MoreHorizontal, Trash2, Mic, Pencil, File } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { SecureNote, NoteTag } from "@/lib/secure-notes"

interface SecureNoteCardProps {
  note: SecureNote
  tags: NoteTag[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function SecureNoteCard({ note, tags, onView, onEdit, onDelete }: SecureNoteCardProps) {
  const [showOptions, setShowOptions] = useState(false)

  // Get tag names for display
  const getTagNames = () => {
    return note.tags.map((tagId) => tags.find((tag) => tag.id === tagId)?.name || "").filter((name) => name !== "")
  }

  // Get security level badge color
  const getSecurityLevelColor = () => {
    switch (note.securityLevel) {
      case "standard":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "high":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "biometric":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "time-locked":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  // Get note type icon
  const getNoteTypeIcon = () => {
    switch (note.type) {
      case "markdown":
        return <FileText className="h-4 w-4" />
      case "voice":
        return <Mic className="h-4 w-4" />
      case "drawing":
        return <Pencil className="h-4 w-4" />
      case "document":
        return <File className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Format date
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "MMM d, yyyy")
  }

  // Check if note is time-locked
  const isTimeLocked = () => {
    return note.unlockTime && note.unlockTime > Date.now()
  }

  // Get time-locked status text
  const getTimeLockText = () => {
    if (!note.unlockTime) return ""

    return `Unlocks on ${format(new Date(note.unlockTime), "MMM d, yyyy h:mm a")}`
  }

  return (
    <Card
      className={`relative overflow-hidden ${note.visibility === "decoy" ? "border-dashed border-amber-500" : ""}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {note.visibility === "decoy" && (
        <div className="absolute top-0 right-0 px-2 py-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-bl-md">
          Decoy
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getNoteTypeIcon()}
            <CardTitle className="text-lg">{note.title}</CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(note.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(note.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(note.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(note.createdAt)}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="line-clamp-3 text-sm">{note.content}</div>

        {getTagNames().length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {getTagNames().map((tagName, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tagName}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge className={`text-xs ${getSecurityLevelColor()}`}>{note.securityLevel}</Badge>

          {note.expiresAt && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires {formatDate(note.expiresAt)}
            </Badge>
          )}

          {note.maxReads && (
            <Badge variant="outline" className="text-xs">
              {note.readCount || 0}/{note.maxReads} reads
            </Badge>
          )}
        </div>

        {isTimeLocked() && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {getTimeLockText()}
          </Badge>
        )}
      </CardFooter>

      {showOptions && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center gap-2">
          <Button size="sm" onClick={() => onView(note.id)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(note.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      )}
    </Card>
  )
}

