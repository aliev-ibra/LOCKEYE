"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { MedicalRecords, type MedicalRecord } from "@/lib/medical-records"

interface MedicalRecordFormProps {
  recordId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function MedicalRecordForm({ recordId, masterPassword, onSave, onCancel }: MedicalRecordFormProps) {
  const [type, setType] = useState<
    "condition" | "medication" | "allergy" | "immunization" | "procedure" | "test" | "note" | "document"
  >("condition")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [provider, setProvider] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [dosage, setDosage] = useState("")
  const [frequency, setFrequency] = useState("")
  const [severity, setSeverity] = useState("")
  const [results, setResults] = useState("")
  const [loading, setLoading] = useState(false)

  // Load record data if editing an existing record
  useEffect(() => {
    const loadRecord = async () => {
      if (!recordId) return

      try {
        const record = await MedicalRecords.getRecordById(recordId, masterPassword)
        if (record) {
          setType(record.type)
          setTitle(record.title)
          setDescription(record.description)
          setDate(record.date)
          setProvider(record.provider || "")
          setLocation(record.location || "")
          setStatus(record.status || "")
          setNotes(record.notes || "")

          // Set metadata fields if they exist
          if (record.metadata) {
            setDosage(record.metadata.dosage || "")
            setFrequency(record.metadata.frequency || "")
            setSeverity(record.metadata.severity || "")
            setResults(record.metadata.results || "")
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load medical record",
          variant: "destructive",
        })
      }
    }

    loadRecord()
  }, [recordId, masterPassword])

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

    if (!description) {
      toast({
        title: "Error",
        description: "Please enter a description",
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
      // Prepare metadata based on record type
      const metadata: Record<string, string> = {}

      if (type === "medication") {
        if (dosage) metadata.dosage = dosage
        if (frequency) metadata.frequency = frequency
      } else if (type === "allergy") {
        if (severity) metadata.severity = severity
      } else if (type === "test") {
        if (results) metadata.results = results
      }

      // Prepare record data
      const recordData: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt"> = {
        type,
        title,
        description,
        date,
        provider: provider || undefined,
        location: location || undefined,
        status: status || undefined,
        notes: notes || undefined,
        tags: [],
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      }

      // Save the record
      if (recordId) {
        await MedicalRecords.updateRecord(recordId, recordData, masterPassword)
      } else {
        await MedicalRecords.addRecord(recordData, masterPassword)
      }

      toast({
        title: "Success",
        description: `Medical record ${recordId ? "updated" : "added"} successfully`,
      })

      onSave()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${recordId ? "update" : "add"} medical record`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get fields based on record type
  const renderTypeSpecificFields = () => {
    switch (type) {
      case "medication":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input id="dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g., 10mg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g., Twice daily"
              />
            </div>
          </>
        )
      case "allergy":
        return (
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case "test":
        return (
          <div className="space-y-2">
            <Label htmlFor="results">Test Results</Label>
            <Textarea
              id="results"
              value={results}
              onChange={(e) => setResults(e.target.value)}
              placeholder="Enter test results"
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{recordId ? "Edit" : "Add"} Medical Record</CardTitle>
        <CardDescription>
          {recordId ? "Update your medical record details" : "Add a new medical record to your vault"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="record-type">Record Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger id="record-type">
                <SelectValue placeholder="Select record type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="condition">Medical Condition</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
                <SelectItem value="allergy">Allergy</SelectItem>
                <SelectItem value="immunization">Immunization</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="test">Medical Test</SelectItem>
                <SelectItem value="note">Doctor's Note</SelectItem>
                <SelectItem value="document">Medical Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Annual Physical, Flu Shot, Allergy Test"
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Healthcare Provider</Label>
            <Input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Doctor or facility name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hospital, clinic, etc."
            />
          </div>
        </div>

        {type === "condition" && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="in_treatment">In Treatment</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {renderTypeSpecificFields()}

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
              Save Record
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

