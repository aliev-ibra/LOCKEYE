"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Book, Plus, Search, Calendar } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { AnimatedLayout } from "@/components/animated-layout"
import { EmptyState } from "@/components/empty-state"
import { JournalEntryForm } from "@/components/journal-entry-form"

export default function JournalPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<any[]>([])
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
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
      // In a real implementation, you would load journal entries here
      // For now, we'll just set loading to false after a delay
      setTimeout(() => {
        setLoading(false)
        setEntries([])
      }, 1000)
    }
  }, [router])

  // Handle entry creation/update
  const handleEntrySaved = () => {
    setShowAddEntry(false)
    setEditingEntryId(null)
    toast({
      title: "Success",
      description: "Journal entry saved successfully",
    })
    // In a real implementation, you would reload entries here
  }

  return (
    <AnimatedLayout title="Private Journal" icon={<Book className="mr-2 h-6 w-6 text-primary" />}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-muted rounded-md p-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </motion.div>
          <span className="text-muted-foreground">{new Date().toLocaleDateString()}</span>
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
              placeholder="Search journal..."
              className="w-[200px] sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setShowAddEntry(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Entry
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
      ) : (
        <EmptyState
          icon={<Book className="h-12 w-12" />}
          title="Your Journal is Empty"
          description="Keep a private, encrypted journal of your thoughts and experiences."
          actionLabel="Create First Entry"
          onAction={() => setShowAddEntry(true)}
        />
      )}

      {/* Add/Edit Entry Dialog */}
      <Dialog
        open={showAddEntry || editingEntryId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddEntry(false)
            setEditingEntryId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          <JournalEntryForm
            entryId={editingEntryId || undefined}
            masterPassword={masterPassword}
            onSave={handleEntrySaved}
            onCancel={() => {
              setShowAddEntry(false)
              setEditingEntryId(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </AnimatedLayout>
  )
}

