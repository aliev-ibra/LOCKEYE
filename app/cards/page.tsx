"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CreditCard, Lock, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { CreditCards, type CreditCard as CreditCardType } from "@/lib/credit-cards"
import { CreditCardForm } from "@/components/credit-card-form"

export default function CardsPage() {
  const router = useRouter()
  const [cards, setCards] = useState<CreditCardType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
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
      loadCards(password)
    }
  }, [router])

  // Load cards
  const loadCards = async (password: string) => {
    setLoading(true)
    try {
      const allCards = await CreditCards.getAllCards(password)
      setCards(allCards)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load credit cards",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter cards
  const filteredCards = cards.filter((card) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      card.name.toLowerCase().includes(query) ||
      card.cardholderName.toLowerCase().includes(query) ||
      card.number.includes(query) ||
      (card.issuer && card.issuer.toLowerCase().includes(query))
    )
  })

  // Handle card creation/update
  const handleCardSaved = () => {
    setShowAddCard(false)
    setEditingCardId(null)
    loadCards(masterPassword)
  }

  // Handle card deletion
  const handleDeleteCard = async (id: string) => {
    if (confirm("Are you sure you want to delete this card?")) {
      try {
        await CreditCards.deleteCard(id, masterPassword)
        toast({
          title: "Success",
          description: "Card deleted successfully",
        })
        loadCards(masterPassword)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete card",
          variant: "destructive",
        })
      }
    }
  }

  // Get card type icon color
  const getCardTypeColor = (type: string) => {
    switch (type) {
      case "Visa":
        return "text-blue-600"
      case "Mastercard":
        return "text-red-600"
      case "American Express":
        return "text-green-600"
      case "Discover":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
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
              <CreditCard className="mr-2 h-6 w-6 text-primary" />
              Credit Cards
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cards..."
                  className="w-[200px] sm:w-[300px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowAddCard(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Card
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => (
                <Card key={card.id} className="overflow-hidden">
                  <div
                    className="h-12 bg-gradient-to-r from-primary to-primary/70"
                    style={{
                      background:
                        card.type === "Visa"
                          ? "linear-gradient(to right, #1a1f71, #2b3990)"
                          : card.type === "Mastercard"
                            ? "linear-gradient(to right, #eb001b, #f79e1b)"
                            : card.type === "American Express"
                              ? "linear-gradient(to right, #006fcf, #10509e)"
                              : card.type === "Discover"
                                ? "linear-gradient(to right, #ff6600, #d97b16)"
                                : "linear-gradient(to right, #666666, #999999)",
                    }}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <span className={`font-medium ${getCardTypeColor(card.type || "")}`}>{card.type || "Card"}</span>
                    </div>
                    <CardDescription>{card.cardholderName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Card Number</p>
                      <p className="font-mono">{CreditCards.formatCardNumber(card.number)}</p>
                    </div>
                    <div className="flex justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Expires</p>
                        <p>{CreditCards.formatExpiryDate(card.expiryMonth, card.expiryYear)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">CVV</p>
                        <p>•••</p>
                      </div>
                    </div>

                    {card.issuer && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issuer</p>
                        <p>{card.issuer}</p>
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingCardId(card.id)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCard(card.id)}>
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
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No Cards Found</CardTitle>
                <CardDescription className="text-center mb-6">
                  {searchQuery
                    ? "No cards match your search. Try adjusting your search query."
                    : "You haven't added any credit cards yet. Add your first card to get started."}
                </CardDescription>
                <Button onClick={() => setShowAddCard(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Card
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

      {/* Add/Edit Card Dialog */}
      <Dialog
        open={showAddCard || editingCardId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddCard(false)
            setEditingCardId(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <CreditCardForm
            cardId={editingCardId || undefined}
            masterPassword={masterPassword}
            onSave={handleCardSaved}
            onCancel={() => {
              setShowAddCard(false)
              setEditingCardId(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

