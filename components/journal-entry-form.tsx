"use client"

import { useState } from "react"
import { Save, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface JournalEntryFormProps {
  entryId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function JournalEntryForm({ entryId, masterPassword, onSave, onCancel }: JournalEntryFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [mood, setMood] = useState("neutral")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [isPrivate, setIsPrivate] = useState(true)
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)

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
        description: "Please enter content for your journal entry",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // In a real implementation, you would save the journal entry here
      // For now, we'll just show a success message

      setTimeout(() => {
        toast({
          title: "Success",
          description: `Journal entry ${entryId ? "updated" : "added"} successfully`,
        })
        onSave()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${entryId ? "update" : "add"} journal entry`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{entryId ? "Edit" : "New"} Journal Entry</CardTitle>
        <CardDescription>{entryId ? "Update your journal entry" : "Create a new journal entry"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entry-date">Date</Label>
            <Input id="entry-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger id="mood">
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="happy">Happy</SelectItem>
                <SelectItem value="excited">Excited</SelectItem>
                <SelectItem value="grateful">Grateful</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="anxious">Anxious</SelectItem>
                <SelectItem value="sad">Sad</SelectItem>
                <SelectItem value="angry">Angry</SelectItem>
                <SelectItem value="tired">Tired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your journal entry"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts here..."
            className="min-h-[200px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., personal, work, goals"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          <div>
            <Label htmlFor="private" className="block">
              Extra Privacy Protection
            </Label>
            <p className="text-xs text-muted-foreground">Adds additional encryption to this entry</p>
          </div>
          {isPrivate && <Lock className="ml-auto h-4 w-4 text-primary" />}
        </div>
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
              Save Entry
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

