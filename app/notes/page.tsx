"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Lock, Plus, Search, TagIcon, Filter } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { SecureNotes, type SecureNote, type NoteTag } from "@/lib/secure-notes"
import { SecureNoteEditor } from "@/components/secure-note-editor"
import { SecureNoteCard } from "@/components/secure-note-card"
import { Badge } from "@/components/ui/badge"

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<SecureNote[]>([])
  const [tags, setTags] = useState<NoteTag[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddNote, setShowAddNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)
  const [viewingNote, setViewingNote] = useState<SecureNote | null>(null)
  const [masterPassword, setMasterPassword] = useState("")

  // Check if vault is unlocked, redirect to login if not
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    // Get master password from session
    const password = sessionStorage.getItem("lockeye_session")
    if (password) {
      setMasterPassword(password)
      loadNotes(password)
      loadTags(password)
    }
  }, [router])

  // Load notes
  const loadNotes = async (password: string) => {
    setLoading(true)
    try {
      const allNotes = await SecureNotes.getAllNotes(password)
      setNotes(allNotes)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load tags
  const loadTags = async (password: string) => {
    try {
      const allTags = await SecureNotes.getAllTags(password)
      setTags(allTags)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      })
    }
  }

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    // Filter by type
    if (selectedType !== "all" && note.type !== selectedType) {
      return false
    }

    // Filter by tags
    if (selectedTags.length > 0 && !selectedTags.some((tagId) => note.tags.includes(tagId))) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
    }

    return true
  })

  // Handle note creation/update
  const handleNoteSaved = () => {
    setShowAddNote(false)
    setEditingNoteId(null)
    loadNotes(masterPassword)
  }

  // Handle note deletion
  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await SecureNotes.deleteNote(id, masterPassword)
        toast({
          title: "Success",
          description: "Note deleted successfully",
        })
        loadNotes(masterPassword)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete note",
          variant: "destructive",
        })
      }
    }
  }

  // Handle note viewing
  const handleViewNote = async (id: string) => {
    try {
      const note = await SecureNotes.getNoteById(id, masterPassword)
      if (note) {
        setViewingNote(note)
        setViewingNoteId(id)
      } else {
        toast({
          title: "Note Deleted",
          description: "This note has been deleted or has expired",
        })
        loadNotes(masterPassword)
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to view note",
          variant: "destructive",
        })
      }
    }
  }

  // Toggle tag selection
  const toggleTagSelection = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
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

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight flex items-center">
              <FileText className="mr-2 h-6 w-6 text-primary" />
              Secure Notes
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search notes..."
                  className="w-[200px] sm:w-[300px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowAddNote(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Note
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Note Type</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedType === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("all")}
                      >
                        All
                      </Button>
                      <Button
                        variant={selectedType === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("text")}
                      >
                        Text
                      </Button>
                      <Button
                        variant={selectedType === "markdown" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("markdown")}
                      >
                        Markdown
                      </Button>
                      <Button
                        variant={selectedType === "document" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("document")}
                      >
                        Document
                      </Button>
                      <Button
                        variant={selectedType === "journal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("journal")}
                      >
                        Journal
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center">
                      <TagIcon className="mr-1 h-3 w-3" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <div
                            key={tag.id}
                            className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                              selectedTags.includes(tag.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            style={{
                              backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                            }}
                            onClick={() => toggleTagSelection(tag.id)}
                          >
                            {tag.name}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No tags available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Notes</span>
                    <span className="font-medium">{notes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Text Notes</span>
                    <span className="font-medium">{notes.filter((note) => note.type === "text").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Markdown Notes</span>
                    <span className="font-medium">{notes.filter((note) => note.type === "markdown").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Documents</span>
                    <span className="font-medium">{notes.filter((note) => note.type === "document").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Journal Entries</span>
                    <span className="font-medium">{notes.filter((note) => note.type === "journal").length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNotes.map((note) => (
                    <SecureNoteCard
                      key={note.id}
                      note={note}
                      tags={tags}
                      onView={handleViewNote}
                      onEdit={setEditingNoteId}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">No Notes Found</CardTitle>
                    <CardDescription className="text-center mb-6">
                      {searchQuery || selectedType !== "all" || selectedTags.length > 0
                        ? "No notes match your current filters. Try adjusting your search or filters."
                        : "You haven't created any notes yet. Create your first secure note to get started."}
                    </CardDescription>
                    <Button onClick={() => setShowAddNote(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create Note
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
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

      {/* Add/Edit Note Dialog */}
      <Dialog
        open={showAddNote || editingNoteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddNote(false)
            setEditingNoteId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          <SecureNoteEditor
            noteId={editingNoteId || undefined}
            masterPassword={masterPassword}
            tags={tags}
            onSave={handleNoteSaved}
            onCancel={() => {
              setShowAddNote(false)
              setEditingNoteId(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog
        open={viewingNoteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingNoteId(null)
            setViewingNote(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          {viewingNote && (
            <Card>
              <CardHeader>
                <CardTitle>{viewingNote.title}</CardTitle>
                <CardDescription>Created on {new Date(viewingNote.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {viewingNote.type === "markdown" ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{viewingNote.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{viewingNote.content}</div>
                )}

                {viewingNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {viewingNote.tags.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId)
                      return tag ? (
                        <Badge key={tagId} variant="outline" style={{ backgroundColor: tag.color }}>
                          {tag.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingNoteId(null)
                    setViewingNote(null)
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEditingNoteId(viewingNote.id)
                    setViewingNoteId(null)
                    setViewingNote(null)
                  }}
                >
                  Edit Note
                </Button>
              </CardFooter>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

