"use client"

import type React from "react"

import { useState } from "react"
import { Save, Upload, Trash2, File } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// This is a placeholder for the actual implementation
// In a real app, you would have a LegalDocuments class similar to MedicalRecords
interface LegalDocument {
  id: string
  type: string
  title: string
  description: string
  date: string
  parties: string[]
  expiryDate?: string
  status: string
  notes?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  fileData?: string
}

interface LegalDocumentFormProps {
  documentId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function LegalDocumentForm({ documentId, masterPassword, onSave, onCancel }: LegalDocumentFormProps) {
  const [type, setType] = useState("contract")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [parties, setParties] = useState("")
  const [status, setStatus] = useState("active")
  const [notes, setNotes] = useState("")
  const [fileData, setFileData] = useState<string | undefined>()
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setFileName(file.name)

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFileData(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove file
  const removeFile = () => {
    setFileData(undefined)
    setFileName("")
  }

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

    if (!date) {
      toast({
        title: "Error",
        description: "Please enter a date",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // In a real implementation, you would save the document here
      // For now, we'll just show a success message

      setTimeout(() => {
        toast({
          title: "Success",
          description: `Legal document ${documentId ? "updated" : "added"} successfully`,
        })
        onSave()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${documentId ? "update" : "add"} legal document`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{documentId ? "Edit" : "Add"} Legal Document</CardTitle>
        <CardDescription>
          {documentId ? "Update your legal document details" : "Add a new legal document to your vault"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="agreement">Agreement</SelectItem>
                <SelectItem value="will">Will</SelectItem>
                <SelectItem value="power_of_attorney">Power of Attorney</SelectItem>
                <SelectItem value="deed">Deed</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Document Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Rental Agreement, Employment Contract"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a detailed description"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parties">Involved Parties (comma separated)</Label>
          <Input
            id="parties"
            value={parties}
            onChange={(e) => setParties(e.target.value)}
            placeholder="e.g., John Doe, Acme Corp"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date (if applicable)</Label>
            <Input id="expiry-date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Document File (Optional)</Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
            <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} />
          </div>

          {fileData && (
            <div className="mt-4 relative">
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <File className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{fileName}</span>
              </div>
              <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={removeFile}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
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
              Save Document
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

