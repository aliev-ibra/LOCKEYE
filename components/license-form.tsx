"use client"

import { useState } from "react"
import { Save, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface LicenseFormProps {
  licenseId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function LicenseForm({ licenseId, masterPassword, onSave, onCancel }: LicenseFormProps) {
  const [name, setName] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [licenseType, setLicenseType] = useState("software")
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [website, setWebsite] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Handle save
  const handleSave = async () => {
    // Validate inputs
    if (!name) {
      toast({
        title: "Error",
        description: "Please enter a name for this license",
        variant: "destructive",
      })
      return
    }

    if (!licenseKey) {
      toast({
        title: "Error",
        description: "Please enter a license key",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // In a real implementation, you would save the license here
      // For now, we'll just show a success message

      setTimeout(() => {
        toast({
          title: "Success",
          description: `License ${licenseId ? "updated" : "added"} successfully`,
        })
        onSave()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${licenseId ? "update" : "add"} license`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{licenseId ? "Edit" : "Add"} License or Key</CardTitle>
        <CardDescription>
          {licenseId ? "Update license details" : "Add a new license or key to your vault"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Adobe Creative Cloud, API Key, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="license-type">Type</Label>
          <Select value={licenseType} onValueChange={setLicenseType}>
            <SelectTrigger id="license-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="software">Software License</SelectItem>
              <SelectItem value="api">API Key</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="hardware">Hardware License</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="license-key">License Key / Serial Number</Label>
          <Input
            id="license-key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Enter license key or serial number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiration">Expiration Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal" id="expiration">
                <Calendar className="mr-2 h-4 w-4" />
                {expirationDate ? format(expirationDate, "PPP") : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent mode="single" selected={expirationDate} onSelect={setExpirationDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Enter website URL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information"
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
              Save License
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

