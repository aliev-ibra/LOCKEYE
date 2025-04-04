"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Plus, Search } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VaultManager } from "@/lib/vault"
import { AnimatedLayout } from "@/components/animated-layout"
import { EmptyState } from "@/components/empty-state"
import { ContactForm } from "@/components/contact-form"

export default function ContactsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<any[]>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
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
    }

    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
      // In a real app, you would load actual data here
      setContacts([])
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  const handleAddContact = () => {
    setEditingContactId(null)
    setShowAddContact(true)
  }

  const handleSaveContact = () => {
    setShowAddContact(false)
    // Refresh contacts list
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // In a real app, you would reload actual data here
      setContacts([])
    }, 500)
  }

  const handleCancelContact = () => {
    setShowAddContact(false)
  }

  return (
    <AnimatedLayout title="Secure Contacts" icon={<Users className="mr-2 h-6 w-6 text-primary" />}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1" />
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
              placeholder="Search contacts..."
              className="w-[200px] sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddContact}>
              <Plus className="mr-2 h-4 w-4" /> Add Contact
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
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Contact card would go here */}
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No Contacts Found"
          description="Store your contacts securely. Add your first contact to get started."
          actionLabel="Add Contact"
          onAction={handleAddContact}
        />
      )}

      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="sm:max-w-[600px]">
          <ContactForm
            contactId={editingContactId || undefined}
            masterPassword={masterPassword}
            onSave={handleSaveContact}
            onCancel={handleCancelContact}
          />
        </DialogContent>
      </Dialog>
    </AnimatedLayout>
  )
}

