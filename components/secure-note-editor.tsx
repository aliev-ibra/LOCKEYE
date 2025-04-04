"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { File, Save, Trash2, Upload } from "lucide-react"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  SecureNotes,
  type SecureNote,
  type NoteType,
  type NoteTag,
  type NoteVisibility,
  type SecurityLevel,
} from "@/lib/secure-notes"

interface SecureNoteEditorProps {
  noteId?: string
  masterPassword: string
  tags: NoteTag[]
  onSave: () => void
  onCancel: () => void
}

export function SecureNoteEditor({ noteId, masterPassword, tags, onSave, onCancel }: SecureNoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [noteType, setNoteType] = useState<NoteType>("text")
  const [visibility, setVisibility] = useState<NoteVisibility>("normal")
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>("standard")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isAutoDestruct, setIsAutoDestruct] = useState(false)
  const [expiryDate, setExpiryDate] = useState("")
  const [maxReads, setMaxReads] = useState(1)
  const [isTimeLocked, setIsTimeLocked] = useState(false)
  const [unlockDate, setUnlockDate] = useState("")
  const [unlockTime, setUnlockTime] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Load note data if editing an existing note
  useEffect(() => {
    const loadNote = async () => {
      if (!noteId) return

      try {
        const note = await SecureNotes.getNoteById(noteId, masterPassword)
        if (note) {
          setTitle(note.title)
          setContent(note.content)
          setNoteType(note.type)
          setVisibility(note.visibility)
          setSecurityLevel(note.securityLevel)
          setSelectedTags(note.tags)

          // Set auto-destruct settings
          if (note.expiresAt || note.maxReads) {
            setIsAutoDestruct(true)
            if (note.expiresAt) {
              setExpiryDate(format(new Date(note.expiresAt), "yyyy-MM-dd"))
            }
            if (note.maxReads) {
              setMaxReads(note.maxReads)
            }
          }

          // Set time-locked settings
          if (note.unlockTime) {
            setIsTimeLocked(true)
            const unlockDateTime = new Date(note.unlockTime)
            setUnlockDate(format(unlockDateTime, "yyyy-MM-dd"))
            setUnlockTime(format(unlockDateTime, "HH:mm"))
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load note",
          variant: "destructive",
        })
      }
    }

    loadNote()
  }, [noteId, masterPassword])

  // Handle save
  const handleSave = async () => {
    // Validate inputs
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      })
      return
    }

    if (!content) {
      toast({
        title: "Error",
        description: "Please enter content",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Prepare note data
      const noteData: Omit<SecureNote, "id" | "createdAt" | "updatedAt" | "accessedAt" | "readCount"> = {
        title,
        content,
        type: noteType,
        visibility,
        securityLevel,
        tags: selectedTags,
      }

      // Add auto-destruct settings
      if (isAutoDestruct) {
        if (expiryDate) {
          noteData.expiresAt = new Date(expiryDate).getTime()
        }
        if (maxReads > 0) {
          noteData.maxReads = maxReads
        }
      }

      // Add time-locked settings
      if (isTimeLocked && unlockDate) {
        const unlockDateTime = new Date(`${unlockDate}T${unlockTime || "00:00"}`)
        noteData.unlockTime = unlockDateTime.getTime()
      }

      // Save the note
      if (noteId) {
        await SecureNotes.updateNote(noteId, noteData, masterPassword)
      } else {
        const newNote = await SecureNotes.addNote(noteData, masterPassword)

        // Upload attachments if any
        if (attachments.length > 0) {
          for (const file of attachments) {
            await SecureNotes.addAttachment(newNote.id, file, masterPassword)
          }
        }
      }

      toast({
        title: "Success",
        description: `Note ${noteId ? "updated" : "created"} successfully`,
      })

      onSave()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${noteId ? "update" : "create"} note`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  // Remove an attachment
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments]
    newAttachments.splice(index, 1)
    setAttachments(newAttachments)
  }

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{noteId ? "Edit" : "Create"} Secure Note</CardTitle>
        <CardDescription>{noteId ? "Update your secure note" : "Create a new encrypted note"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter note title" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note-type">Note Type</Label>
          <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType)}>
            <SelectTrigger id="note-type">
              <SelectValue placeholder="Select note type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Plain Text</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="journal">Journal Entry</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {noteType === "markdown" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                {previewMode ? "Edit" : "Preview"}
              </Button>
            </div>

            {previewMode ? (
              <div className="min-h-[200px] border rounded-md p-4 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter note content using Markdown formatting"
                className="min-h-[200px] font-mono"
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content"
              className="min-h-[200px]"
            />
          </div>
        )}

        <Tabs defaultValue="security">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="security-level">Security Level</Label>
              <Select value={securityLevel} onValueChange={(value) => setSecurityLevel(value as SecurityLevel)}>
                <SelectTrigger id="security-level">
                  <SelectValue placeholder="Select security level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Security</SelectItem>
                  <SelectItem value="biometric">Biometric Protection</SelectItem>
                  <SelectItem value="time-locked">Time-Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(value) => setVisibility(value as NoteVisibility)}>
                <SelectTrigger id="visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="decoy">Decoy (Fake Note)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="auto-destruct" checked={isAutoDestruct} onCheckedChange={setIsAutoDestruct} />
              <Label htmlFor="auto-destruct">Enable Auto-Destruct</Label>
            </div>

            {isAutoDestruct && (
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-reads">Maximum Reads: {maxReads}</Label>
                  <Input
                    id="max-reads"
                    type="range"
                    min="1"
                    max="10"
                    value={maxReads}
                    onChange={(e) => setMaxReads(Number.parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Note will self-destruct after being read {maxReads} {maxReads === 1 ? "time" : "times"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch id="time-locked" checked={isTimeLocked} onCheckedChange={setIsTimeLocked} />
              <Label htmlFor="time-locked">Time-Locked Note</Label>
            </div>

            {isTimeLocked && (
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="unlock-date">Unlock Date</Label>
                  <Input
                    id="unlock-date"
                    type="date"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unlock-time">Unlock Time</Label>
                  <Input
                    id="unlock-time"
                    type="time"
                    value={unlockTime}
                    onChange={(e) => setUnlockTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tags" className="pt-4">
            <div className="space-y-4">
              <Label>Select Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </div>
                ))}

                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags available. Create tags in the settings.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attachments added yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Note
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

