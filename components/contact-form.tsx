"use client"

import { useState } from "react"
import { Save, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface ContactFormProps {
  contactId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function ContactForm({ contactId, masterPassword, onSave, onCancel }: ContactFormProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [company, setCompany] = useState("")
  const [emails, setEmails] = useState([{ type: "personal", email: "", isPrimary: true }])
  const [phones, setPhones] = useState([{ type: "mobile", number: "", isPrimary: true }])
  const [addresses, setAddresses] = useState([
    { type: "home", street: "", city: "", state: "", postalCode: "", country: "", isPrimary: true },
  ])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Add email
  const addEmail = () => {
    setEmails([...emails, { type: "personal", email: "", isPrimary: false }])
  }

  // Update email
  const updateEmail = (index: number, field: string, value: string | boolean) => {
    const newEmails = [...emails]
    newEmails[index] = { ...newEmails[index], [field]: value }

    // If setting this email as primary, set others to not primary
    if (field === "isPrimary" && value === true) {
      newEmails.forEach((email, i) => {
        if (i !== index) {
          email.isPrimary = false
        }
      })
    }

    setEmails(newEmails)
  }

  // Remove email
  const removeEmail = (index: number) => {
    const newEmails = [...emails]
    newEmails.splice(index, 1)
    setEmails(newEmails)
  }

  // Add phone
  const addPhone = () => {
    setPhones([...phones, { type: "mobile", number: "", isPrimary: false }])
  }

  // Update phone
  const updatePhone = (index: number, field: string, value: string | boolean) => {
    const newPhones = [...phones]
    newPhones[index] = { ...newPhones[index], [field]: value }

    // If setting this phone as primary, set others to not primary
    if (field === "isPrimary" && value === true) {
      newPhones.forEach((phone, i) => {
        if (i !== index) {
          phone.isPrimary = false
        }
      })
    }

    setPhones(newPhones)
  }

  // Remove phone
  const removePhone = (index: number) => {
    const newPhones = [...phones]
    newPhones.splice(index, 1)
    setPhones(newPhones)
  }

  // Handle save
  const handleSave = async () => {
    // Validate inputs
    if (!firstName && !lastName) {
      toast({
        title: "Error",
        description: "Please enter a first or last name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // In a real implementation, you would save the contact here
      // For now, we'll just show a success message

      setTimeout(() => {
        toast({
          title: "Success",
          description: `Contact ${contactId ? "updated" : "added"} successfully`,
        })
        onSave()
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${contactId ? "update" : "add"} contact`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{contactId ? "Edit" : "Add"} Contact</CardTitle>
        <CardDescription>
          {contactId ? "Update contact details" : "Add a new contact to your secure address book"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company (Optional)</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company name"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Email Addresses</Label>
            <Button type="button" variant="outline" size="sm" onClick={addEmail}>
              <Plus className="h-4 w-4 mr-1" /> Add Email
            </Button>
          </div>

          {emails.map((email, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="w-1/4">
                <Label htmlFor={`email-type-${index}`} className="text-xs">
                  Type
                </Label>
                <Select value={email.type} onValueChange={(value) => updateEmail(index, "type", value)}>
                  <SelectTrigger id={`email-type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor={`email-${index}`} className="text-xs">
                  Email Address
                </Label>
                <Input
                  id={`email-${index}`}
                  value={email.email}
                  onChange={(e) => updateEmail(index, "email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEmail(index)}
                disabled={emails.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Phone Numbers</Label>
            <Button type="button" variant="outline" size="sm" onClick={addPhone}>
              <Plus className="h-4 w-4 mr-1" /> Add Phone
            </Button>
          </div>

          {phones.map((phone, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="w-1/4">
                <Label htmlFor={`phone-type-${index}`} className="text-xs">
                  Type
                </Label>
                <Select value={phone.type} onValueChange={(value) => updatePhone(index, "type", value)}>
                  <SelectTrigger id={`phone-type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor={`phone-${index}`} className="text-xs">
                  Phone Number
                </Label>
                <Input
                  id={`phone-${index}`}
                  value={phone.number}
                  onChange={(e) => updatePhone(index, "number", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePhone(index)}
                disabled={phones.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
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
              Save Contact
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

