"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { BankAccounts, type BankAccount, type AccountType } from "@/lib/bank-accounts"

interface BankAccountFormProps {
  accountId?: string
  masterPassword: string
  onSave: () => void
  onCancel: () => void
}

export function BankAccountForm({ accountId, masterPassword, onSave, onCancel }: BankAccountFormProps) {
  const [type, setType] = useState<AccountType>("checking")
  const [title, setTitle] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [routingNumber, setRoutingNumber] = useState("")
  const [iban, setIban] = useState("")
  const [swift, setSwift] = useState("")
  const [accountHolder, setAccountHolder] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [balance, setBalance] = useState("")
  const [openDate, setOpenDate] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Load account data if editing an existing account
  useEffect(() => {
    const loadAccount = async () => {
      if (!accountId) return

      try {
        const account = await BankAccounts.getAccountById(accountId, masterPassword)
        if (account) {
          setType(account.type)
          setTitle(account.title)
          setBankName(account.bankName)
          setAccountNumber(account.accountNumber)
          setRoutingNumber(account.routingNumber || "")
          setIban(account.iban || "")
          setSwift(account.swift || "")
          setAccountHolder(account.accountHolder)
          setCurrency(account.currency)
          setBalance(account.balance || "")
          setOpenDate(account.openDate || "")
          setNotes(account.notes || "")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load account",
          variant: "destructive",
        })
      }
    }

    loadAccount()
  }, [accountId, masterPassword])

  // Handle save
  const handleSave = async () => {
    // Validate inputs
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      })
      return
    }

    if (!bankName) {
      toast({
        title: "Error",
        description: "Please enter a bank name",
        variant: "destructive",
      })
      return
    }

    if (!accountNumber) {
      toast({
        title: "Error",
        description: "Please enter an account number",
        variant: "destructive",
      })
      return
    }

    if (!accountHolder) {
      toast({
        title: "Error",
        description: "Please enter the account holder name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Prepare account data
      const accountData: Omit<BankAccount, "id" | "createdAt" | "updatedAt"> = {
        type,
        title,
        bankName,
        accountNumber,
        routingNumber: routingNumber || undefined,
        iban: iban || undefined,
        swift: swift || undefined,
        accountHolder,
        currency,
        balance: balance || undefined,
        openDate: openDate || undefined,
        notes: notes || undefined,
        tags: [],
      }

      // Save the account
      if (accountId) {
        await BankAccounts.updateAccount(accountId, accountData, masterPassword)
      } else {
        await BankAccounts.addAccount(accountData, masterPassword)
      }

      toast({
        title: "Success",
        description: `Account ${accountId ? "updated" : "added"} successfully`,
      })

      onSave()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${accountId ? "update" : "add"} account`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{accountId ? "Edit" : "Add"} Bank Account</CardTitle>
        <CardDescription>
          {accountId ? "Update your bank account details" : "Add a new bank account to your vault"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account-type">Account Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as AccountType)}>
              <SelectTrigger id="account-type">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking Account</SelectItem>
                <SelectItem value="savings">Savings Account</SelectItem>
                <SelectItem value="credit">Credit Account</SelectItem>
                <SelectItem value="investment">Investment Account</SelectItem>
                <SelectItem value="retirement">Retirement Account</SelectItem>
                <SelectItem value="business">Business Account</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Account Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Personal Checking, Business Savings"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-name">Bank Name</Label>
          <Input
            id="bank-name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Enter bank name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-holder">Account Holder</Label>
          <Input
            id="account-holder"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="Enter account holder name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account-number">Account Number</Label>
            <Input
              id="account-number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routing-number">Routing Number (Optional)</Label>
            <Input
              id="routing-number"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              placeholder="Enter routing number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN (Optional)</Label>
            <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Enter IBAN" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swift">SWIFT/BIC (Optional)</Label>
            <Input
              id="swift"
              value={swift}
              onChange={(e) => setSwift(e.target.value)}
              placeholder="Enter SWIFT/BIC code"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
                <SelectItem value="AUD">AUD ($)</SelectItem>
                <SelectItem value="CHF">CHF (Fr)</SelectItem>
                <SelectItem value="CNY">CNY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance (Optional)</Label>
            <Input
              id="balance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Enter current balance"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="open-date">Open Date (Optional)</Label>
            <Input id="open-date" type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information about this account"
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
              Save Account
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

