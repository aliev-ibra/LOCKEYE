"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save, Upload, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { IdentityDocuments, type IdentityDocument, type DocumentType } from "@/lib/identity-documents"

interface IdentityDocumentFormProps {
  documentId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function IdentityDocumentForm({ documentId, masterPassword, onSave, onCancel }: IdentityDocumentFormProps) {
  const [type, setType] = useState<DocumentType>("passport")
  const [title, setTitle] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [issuedBy, setIssuedBy] = useState("")
  const [issuedDate, setIssuedDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [fullName, setFullName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [nationality, setNationality] = useState("")
  const [placeOfBirth, setPlaceOfBirth] = useState("")
  const [notes, setNotes] = useState("")
  const [imageData, setImageData] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  // Load document data if editing an existing document
  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) return

      try {
        const document = await IdentityDocuments.getDocumentById(documentId, masterPassword)
        if (document) {
          setType(document.type)
          setTitle(document.title)
          setDocumentNumber(document.documentNumber)
          setIssuedBy(document.issuedBy)
          setIssuedDate(document.issuedDate)
          setExpiryDate(document.expiryDate)
          setFullName(document.fullName)
          setDateOfBirth(document.dateOfBirth || "")
          setNationality(document.nationality || "")
          setPlaceOfBirth(document.placeOfBirth || "")
          setNotes(document.notes || "")
          setImageData(document.imageData)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load document",
          variant: "destructive",
        })
      }
    }

    loadDocument()
  }, [documentId, masterPassword])

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageData(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove image
  const removeImage = () => {
    setImageData(undefined)
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

    if (!documentNumber) {
      toast({
        title: "Error",
        description: "Please enter a document number",
        variant: "destructive",
      })
      return
    }

    if (!fullName) {
      toast({
        title: "Error",
        description: "Please enter the full name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Prepare document data
      const documentData: Omit<IdentityDocument, "id" | "createdAt" | "updatedAt"> = {
        type,
        title,
        documentNumber,
        issuedBy,
        issuedDate,
        expiryDate,
        fullName,
        dateOfBirth: dateOfBirth || undefined,
        nationality: nationality || undefined,
        placeOfBirth: placeOfBirth || undefined,
        notes: notes || undefined,
        imageData,
        tags: [],
      }

      // Save the document
      if (documentId) {
        await IdentityDocuments.updateDocument(documentId, documentData, masterPassword)
      } else {
        await IdentityDocuments.addDocument(documentData, masterPassword)
      }

      toast({
        title: "Success",
        description: `Document ${documentId ? "updated" : "added"} successfully`,
      })

      onSave()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${documentId ? "update" : "add"} document`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{documentId ? "Edit" : "Add"} Identity Document</CardTitle>
        <CardDescription>
          {documentId ? "Update your identity document details" : "Add a new identity document to your vault"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as DocumentType)}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="id_card">ID Card</SelectItem>
                <SelectItem value="driver_license">Driver's License</SelectItem>
                <SelectItem value="birth_certificate">Birth Certificate</SelectItem>
                <SelectItem value="social_security">Social Security</SelectItem>
                <SelectItem value="residence_permit">Residence Permit</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., US Passport, National ID"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full-name">Full Name (as on document)</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter full name as it appears on the document"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="document-number">Document Number</Label>
            <Input
              id="document-number"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Enter document number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="Enter nationality"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-of-birth">Date of Birth</Label>
            <Input
              id="date-of-birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-of-birth">Place of Birth</Label>
            <Input
              id="place-of-birth"
              value={placeOfBirth}
              onChange={(e) => setPlaceOfBirth(e.target.value)}
              placeholder="Enter place of birth"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issued-by">Issued By</Label>
          <Input
            id="issued-by"
            value={issuedBy}
            onChange={(e) => setIssuedBy(e.target.value)}
            placeholder="Enter issuing authority"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issued-date">Issue Date</Label>
            <Input id="issued-date" type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date</Label>
            <Input id="expiry-date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information about this document"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Document Image (Optional)</Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => document.getElementById("image-upload")?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
            <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {imageData && (
            <div className="mt-4 relative">
              <img src={imageData || "/placeholder.svg"} alt="Document" className="max-h-[200px] rounded-md border" />
              <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={removeImage}>
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

