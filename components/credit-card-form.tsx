"use client"

import { Textarea } from "@/components/ui/textarea"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState, useEffect } from "react"
import { CreditCard, Calendar, Lock, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { CreditCards, type CreditCard as CreditCardType } from "@/lib/credit-cards"

interface CreditCardFormProps {
  cardId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function CreditCardForm({ cardId, masterPassword, onSave, onCancel }: CreditCardFormProps) {
  const [name, setName] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardType, setCardType] = useState("")
  const [issuer, setIssuer] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Load card data if editing an existing card
  useEffect(() => {
    const loadCard = async () => {
      if (!cardId) return

      try {
        const card = await CreditCards.getCardById(cardId, masterPassword)
        if (card) {
          setName(card.name)
          setCardholderName(card.cardholderName)
          setCardNumber(card.number)
          setExpiryMonth(card.expiryMonth)
          setExpiryYear(card.expiryYear)
          setCvv(card.cvv)
          setCardType(card.type || "")
          setIssuer(card.issuer || "")
          setNotes(card.notes || "")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load credit card",
          variant: "destructive",
        })
      }
    }

    loadCard()
  }, [cardId, masterPassword])

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const groups = []

    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.slice(i, i + 4))
    }

    return groups.join(" ")
  }

  // Handle card number change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "")

    if (/^\d*$/.test(value) && value.length <= 16) {
      setCardNumber(formatCardNumber(value))

      // Auto-detect card type
      if (value.length >= 4) {
        setCardType(CreditCards.detectCardType(value))
      } else {
        setCardType("")
      }
    }
  }

  // Handle expiry month change
  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")

    if (/^\d*$/.test(value) && value.length <= 2) {
      const month = Number.parseInt(value, 10)

      if (value === "" || (month >= 1 && month <= 12)) {
        setExpiryMonth(value)
      }
    }
  }

  // Handle expiry year change
  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")

    if (/^\d*$/.test(value) && value.length <= 4) {
      setExpiryYear(value)
    }
  }

  // Handle CVV change
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")

    if (/^\d*$/.test(value) && value.length <= 4) {
      setCvv(value)
    }
  }

  // Handle save
  const handleSave = async () => {
    // Validate inputs
    if (!name) {
      toast({
        title: "Error",
        description: "Please enter a name for this card",
        variant: "destructive",
      })
      return
    }

    if (!cardholderName) {
      toast({
        title: "Error",
        description: "Please enter the cardholder name",
        variant: "destructive",
      })
      return
    }

    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
      toast({
        title: "Error",
        description: "Please enter a valid card number",
        variant: "destructive",
      })
      return
    }

    if (!CreditCards.validateCardNumber(cardNumber)) {
      toast({
        title: "Error",
        description: "Invalid card number",
        variant: "destructive",
      })
      return
    }

    if (!expiryMonth || !expiryYear) {
      toast({
        title: "Error",
        description: "Please enter the expiry date",
        variant: "destructive",
      })
      return
    }

    if (CreditCards.isCardExpired(expiryMonth, expiryYear)) {
      toast({
        title: "Warning",
        description: "This card has expired",
        variant: "destructive",
      })
      return
    }

    if (!cvv) {
      toast({
        title: "Error",
        description: "Please enter the CVV",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Prepare card data
      const cardData: Omit<CreditCardType, "id" | "createdAt" | "updatedAt"> = {
        name,
        cardholderName,
        number: cardNumber.replace(/\s/g, ""),
        expiryMonth,
        expiryYear,
        cvv,
        type: cardType,
        issuer,
        notes,
        tags: [],
      }

      // Save the card
      if (cardId) {
        await CreditCards.updateCard(cardId, cardData, masterPassword)
      } else {
        await CreditCards.addCard(cardData, masterPassword)
      }

      toast({
        title: "Success",
        description: `Credit card ${cardId ? "updated" : "added"} successfully`,
      })

      onSave()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${cardId ? "update" : "add"} credit card`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5 text-primary" />
          {cardId ? "Edit" : "Add"} Credit Card
        </CardTitle>
        <CardDescription>
          {cardId ? "Update your credit card details" : "Add a new credit card to your vault"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-name">Card Name</Label>
          <Input
            id="card-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Personal Visa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardholder-name">Cardholder Name</Label>
          <Input
            id="cardholder-name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Name as it appears on the card"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-number">Card Number</Label>
          <div className="relative">
            <Input
              id="card-number"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              className="pl-10"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
            </div>
            {cardType && (
              <div className="absolute right-3 top-2.5">
                <Badge variant="outline">{cardType}</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Input
                  id="expiry-month"
                  value={expiryMonth}
                  onChange={handleExpiryMonthChange}
                  placeholder="MM"
                  className="pl-8"
                />
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <span>/</span>
              <Input id="expiry-year" value={expiryYear} onChange={handleExpiryYearChange} placeholder="YYYY" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <div className="relative">
              <Input id="cvv" value={cvv} onChange={handleCvvChange} placeholder="123" className="pl-8" />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuer">Issuing Bank (Optional)</Label>
          <Input
            id="issuer"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="e.g., Chase, Bank of America"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information about this card"
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
              Save Card
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

