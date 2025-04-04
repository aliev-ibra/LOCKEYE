"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Shield, Lock, Plus, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { IdentityDocuments, type IdentityDocument } from "@/lib/identity-documents"
import { IdentityDocumentForm } from "@/components/identity-document-form"

export default function IdentityDocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<IdentityDocument[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [loading, setLoading] = useState(true)
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
      loadDocuments(password)
    }
  }, [router])

  // Load documents
  const loadDocuments = async (password: string) => {
    setLoading(true)
    try {
      const allDocuments = await IdentityDocuments.getAllDocuments(password)
      setDocuments(allDocuments)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load identity documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter documents
  const filteredDocuments = documents.filter((document) => {
    // Filter by type
    if (selectedType !== "all" && document.type !== selectedType) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        document.title.toLowerCase().includes(query) ||
        document.documentNumber.toLowerCase().includes(query) ||
        document.fullName.toLowerCase().includes(query) ||
        document.issuedBy.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Handle document creation/update
  const handleDocumentSaved = () => {
    setShowAddDocument(false)
    setEditingDocumentId(null)
    loadDocuments(masterPassword)
  }

  // Handle document deletion
  const handleDeleteDocument = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await IdentityDocuments.deleteDocument(id, masterPassword)
        toast({
          title: "Success",
          description: "Document deleted successfully",
        })
        loadDocuments(masterPassword)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete document",
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

  // Check if document is expired
  const isExpired = (expiryDate: string) => {
    return IdentityDocuments.isDocumentExpired(expiryDate)
  }

  // Check if document is expiring soon
  const isExpiringSoon = (expiryDate: string) => {
    return IdentityDocuments.isDocumentExpiringSoon(expiryDate)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">LOCKEYE</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => VaultManager.lock()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight flex items-center">
              <Shield className="mr-2 h-6 w-6 text-primary" />
              Identity Documents
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  className="w-[200px] sm:w-[300px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowAddDocument(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Document
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
              >
                All
              </Button>
              <Button
                variant={selectedType === "passport" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("passport")}
              >
                Passports
              </Button>
              <Button
                variant={selectedType === "id_card" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("id_card")}
              >
                ID Cards
              </Button>
              <Button
                variant={selectedType === "driver_license" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("driver_license")}
              >
                Driver's Licenses
              </Button>
              <Button
                variant={selectedType === "other" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("other")}
              >
                Other
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{document.title}</CardTitle>
                        <CardDescription>{document.fullName}</CardDescription>
                      </div>
                      <Badge>{IdentityDocuments.getDocumentTypeDisplayName(document.type)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Document Number</p>
                      <p className="font-mono">{document.documentNumber}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issued Date</p>
                        <p>{formatDate(document.issuedDate)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                        <div className="flex items-center gap-1">
                          <p>{formatDate(document.expiryDate)}</p>
                          {isExpired(document.expiryDate) && (
                            <Badge variant="destructive" className="text-xs">
                              Expired
                            </Badge>
                          )}
                          {!isExpired(document.expiryDate) && isExpiringSoon(document.expiryDate) && (
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Issued By</p>
                      <p>{document.issuedBy}</p>
                    </div>

                    {document.imageData && (
                      <div className="mt-2">
                        <img
                          src={document.imageData || "/placeholder.svg"}
                          alt={document.title}
                          className="max-h-[100px] rounded-md border object-cover"
                        />
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingDocumentId(document.id)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(document.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Documents Found</CardTitle>
                <CardDescription className="text-center mb-6">
                  {searchQuery || selectedType !== "all"
                    ? "No documents match your search. Try adjusting your search or filters."
                    : "You haven't added any identity documents yet. Add your first document to get started."}
                </CardDescription>
                <Button onClick={() => setShowAddDocument(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Document
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>LOCKEYE Password Manager</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} LOCKEYE. All rights reserved.
          </p>
        </div>
      </footer>

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
          <IdentityDocumentForm
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
    </div>
  )
}

