"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileArchive, Plus, Search } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { AnimatedLayout } from "@/components/animated-layout"
import { EmptyState } from "@/components/empty-state"
import { staggerContainer } from "@/lib/motion"
import { LegalDocumentForm } from "@/components/legal-document-form"

export default function LegalDocumentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<any[]>([])
  const [showAddDocument, setShowAddDocument] = useState(false)
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
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
      // In a real implementation, you would load documents here
      // For now, we'll just set loading to false after a delay
      setTimeout(() => {
        setLoading(false)
        setDocuments([])
      }, 1000)
    }
  }, [router])

  // Handle document creation/update
  const handleDocumentSaved = () => {
    setShowAddDocument(false)
    setEditingDocumentId(null)
    toast({
      title: "Success",
      description: "Document saved successfully",
    })
    // In a real implementation, you would reload documents here
  }

  return (
    <AnimatedLayout title="Legal Documents" icon={<FileArchive className="mr-2 h-6 w-6 text-primary" />}>
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
            variant={selectedType === "contract" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("contract")}
          >
            Contracts
          </Button>
          <Button
            variant={selectedType === "agreement" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("agreement")}
          >
            Agreements
          </Button>
          <Button
            variant={selectedType === "will" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("will")}
          >
            Wills
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
              placeholder="Search documents..."
              className="w-[200px] sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setShowAddDocument(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Document
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
      ) : documents.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Document cards would go here */}
        </motion.div>
      ) : (
        <EmptyState
          icon={<FileArchive className="h-12 w-12" />}
          title="No Legal Documents Found"
          description="Store your legal documents securely. Add your first document to get started."
          actionLabel="Add Legal Document"
          onAction={() => setShowAddDocument(true)}
        />
      )}

      {/* Add/Edit Document Dialog */}
      <Dialog
        open={showAddDocument || editingDocumentId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDocument(false)
            setEditingDocumentId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          <LegalDocumentForm
            documentId={editingDocumentId || undefined}
            masterPassword={masterPassword}
            onSave={handleDocumentSaved}
            onCancel={() => {
              setShowAddDocument(false)
              setEditingDocumentId(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </AnimatedLayout>
  )
}

