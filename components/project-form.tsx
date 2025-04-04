"use client"

import type React from "react"

import { useState } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface ProjectFormProps {
  projectId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function ProjectForm({ projectId, masterPassword, onSave, onCancel }: ProjectFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [ultraSecure, setUltraSecure] = useState(true)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  // Add tag
  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag])
      setCurrentTag("")
    }
  }

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // Handle key press for tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentTag) {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Handle save
  const handleSave = async () => {
    // Validate inputs
    if (!name) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // In a real implementation, you would save the project here
      // For now, we'll just show a success message

      setTimeout(() => {
        toast({
          title: "Success",
          description: `Project ${projectId ? "updated" : "added"} successfully`,
        })
        onSave()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${projectId ? "update" : "add"} project`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{projectId ? "Edit" : "Add"} Secret Project</CardTitle>
        <CardDescription>
          {projectId ? "Update project details" : "Add a new secret project to your vault"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter project name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ultra-secure">Ultra Secure Mode</Label>
            <Switch id="ultra-secure" checked={ultraSecure} onCheckedChange={setUltraSecure} />
          </div>
          <p className="text-sm text-muted-foreground">
            Ultra secure mode applies additional encryption and requires master password for each access
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleTagKeyPress}
              placeholder="Add tags and press Enter"
              className="flex-1"
            />
            <Button type="button" onClick={handleAddTag} disabled={!currentTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-2 py-1">
                  {tag}
                  <button type="button" className="ml-2 text-xs" onClick={() => handleRemoveTag(tag)}>
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Project Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your project details, ideas, plans, etc."
            className="min-h-[200px]"
          />
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
              Save Project
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

