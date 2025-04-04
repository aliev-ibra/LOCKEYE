"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clipboard, Plus, Search, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { MedicalRecords, type MedicalRecord } from "@/lib/medical-records"
import { AnimatedLayout } from "@/components/animated-layout"
import { EmptyState } from "@/components/empty-state"
import { staggerContainer, listItem } from "@/lib/motion"
import { MedicalRecordForm } from "@/components/medical-record-form"

export default function MedicalRecordsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
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
      loadRecords(password)
    }
  }, [router])

  // Load records
  const loadRecords = async (password: string) => {
    setLoading(true)
    try {
      const allRecords = await MedicalRecords.getAllRecords(password)
      setRecords(allRecords)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load medical records",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter records
  const filteredRecords = records.filter((record) => {
    // Filter by type
    if (selectedType !== "all" && record.type !== selectedType) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        record.title.toLowerCase().includes(query) ||
        record.description.toLowerCase().includes(query) ||
        (record.provider && record.provider.toLowerCase().includes(query))
      )
    }

    return true
  })

  // Handle record creation/update
  const handleRecordSaved = () => {
    setShowAddRecord(false)
    setEditingRecordId(null)
    loadRecords(masterPassword)
  }

  // Handle record deletion
  const handleDeleteRecord = async (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await MedicalRecords.deleteRecord(id, masterPassword)
        toast({
          title: "Success",
          description: "Medical record deleted successfully",
        })
        loadRecords(masterPassword)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete medical record",
          variant: "destructive",
        })
      }
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  // Get record type display name
  const getRecordTypeDisplayName = (type: string) => {
    switch (type) {
      case "condition":
        return "Medical Condition"
      case "medication":
        return "Medication"
      case "allergy":
        return "Allergy"
      case "immunization":
        return "Immunization"
      case "procedure":
        return "Procedure"
      case "test":
        return "Medical Test"
      case "note":
        return "Doctor's Note"
      case "document":
        return "Medical Document"
      default:
        return "Record"
    }
  }

  return (
    <AnimatedLayout title="Medical Records" icon={<Clipboard className="mr-2 h-6 w-6 text-primary" />}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("all")}
          >
            All
          </Button>
          <Button
            variant={selectedType === "condition" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("condition")}
          >
            Conditions
          </Button>
          <Button
            variant={selectedType === "medication" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("medication")}
          >
            Medications
          </Button>
          <Button
            variant={selectedType === "allergy" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("allergy")}
          >
            Allergies
          </Button>
          <Button
            variant={selectedType === "immunization" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("immunization")}
          >
            Immunizations
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search records..."
              className="w-[200px] sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setShowAddRecord(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Record
            </Button>
          </motion.div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-primary"
          />
        </div>
      ) : filteredRecords.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRecords.map((record) => (
            <motion.div key={record.id} variants={listItem}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{record.title}</CardTitle>
                    <Badge variant="outline">{getRecordTypeDisplayName(record.type)}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(record.date)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm line-clamp-3">{record.description}</p>

                  {record.provider && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Provider:</span> {record.provider}
                    </div>
                  )}

                  {record.type === "condition" && record.status && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          record.status === "active"
                            ? "destructive"
                            : record.status === "resolved"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace("_", " ")}
                      </Badge>
                    </div>
                  )}

                  {record.type === "medication" && record.metadata?.dosage && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Dosage:</span> {record.metadata.dosage}
                      {record.metadata.frequency && ` - ${record.metadata.frequency}`}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingRecordId(record.id)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteRecord(record.id)}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={<Clipboard className="h-12 w-12" />}
          title="No Medical Records Found"
          description="Store your medical records securely. Add your first record to get started."
          actionLabel="Add Medical Record"
          onAction={() => setShowAddRecord(true)}
        />
      )}

      {/* Add/Edit Record Dialog */}
      <Dialog
        open={showAddRecord || editingRecordId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddRecord(false)
            setEditingRecordId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          <MedicalRecordForm
            recordId={editingRecordId || undefined}
            masterPassword={masterPassword}
            onSave={handleRecordSaved}
            onCancel={() => {
              setShowAddRecord(false)
              setEditingRecordId(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </AnimatedLayout>
  )
}

