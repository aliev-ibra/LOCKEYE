"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lightbulb, Plus, Search, Lock } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VaultManager } from "@/lib/vault"
import { AnimatedLayout } from "@/components/animated-layout"
import { EmptyState } from "@/components/empty-state"
import { ProjectForm } from "@/components/project-form"

export default function SecretProjectsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [showAddProject, setShowAddProject] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
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
      setProjects([])
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  const handleAddProject = () => {
    setEditingProjectId(null)
    setShowAddProject(true)
  }

  const handleSaveProject = () => {
    setShowAddProject(false)
    // Refresh projects list
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // In a real app, you would reload actual data here
      setProjects([])
    }, 500)
  }

  const handleCancelProject = () => {
    setShowAddProject(false)
  }

  return (
    <AnimatedLayout title="Secret Projects" icon={<Lightbulb className="mr-2 h-6 w-6 text-primary" />}>
      <div className="flex items-center justify-between mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Badge variant="outline" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Ultra Secure
          </Badge>
        </motion.div>
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
              placeholder="Search projects..."
              className="w-[200px] sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleAddProject}>
              <Plus className="mr-2 h-4 w-4" /> Add Project
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
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Project card would go here */}
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Lightbulb className="h-12 w-12" />}
          title="No Secret Projects Found"
          description="Store your confidential project details, ideas, and plans with maximum security."
          actionLabel="Add Secret Project"
          onAction={handleAddProject}
        />
      )}

      <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
        <DialogContent className="sm:max-w-[600px]">
          <ProjectForm
            projectId={editingProjectId || undefined}
            masterPassword={masterPassword}
            onSave={handleSaveProject}
            onCancel={handleCancelProject}
          />
        </DialogContent>
      </Dialog>
    </AnimatedLayout>
  )
}

