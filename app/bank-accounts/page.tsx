"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit2, Trash2, RefreshCw, Filter, Eye, EyeOff, Download, Upload } from "lucide-react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useMasterPassword } from "@/hooks/use-master-password"
import { BankAccountForm } from "@/components/bank-account-form"
import { BankAccounts, type BankAccount, type AccountType } from "@/lib/bank-accounts"

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<BankAccount[]>([])
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType | "all">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAccountNumbers, setShowAccountNumbers] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const { masterPassword, isMasterPasswordSet } = useMasterPassword()

  // Columns definition
  const columns: ColumnDef<BankAccount>[] = [
    {
      accessorKey: "bankName",
      header: "Bank Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-medium">{row.original.bankName}</div>
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Account Name",
      cell: ({ row }) => <div>{row.original.title}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {BankAccounts.getAccountTypeDisplayName(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => (
        <div className="font-mono">
          {showAccountNumbers
            ? row.original.accountNumber
            : BankAccounts.formatAccountNumber(row.original.accountNumber)}
        </div>
      ),
    },
    {
      accessorKey: "accountHolder",
      header: "Account Holder",
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <div className="font-mono">
          {row.original.balance ? (
            <span className="font-medium">
              {row.original.currency} {row.original.balance}
            </span>
          ) : (
            <span className="text-muted-foreground">Not specified</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditAccount(account.id)}
              className="h-8 w-8"
              title="Edit account"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete account">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this bank account? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteAccount(account.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      if (!isMasterPasswordSet) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const loadedAccounts = await BankAccounts.getAllAccounts(masterPassword)
        setAccounts(loadedAccounts)
        setFilteredAccounts(loadedAccounts)
        setError(null)
      } catch (err) {
        console.error("Failed to load accounts:", err)
        setError("Failed to load accounts. Please check your master password.")
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [masterPassword, isMasterPasswordSet])

  // Filter accounts when search query or type filter changes
  useEffect(() => {
    if (accounts.length === 0) return

    const filtered = accounts.filter((account) => {
      // Filter by account type
      if (accountTypeFilter !== "all" && account.type !== accountTypeFilter) {
        return false
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          account.title.toLowerCase().includes(query) ||
          account.bankName.toLowerCase().includes(query) ||
          account.accountNumber.includes(query) ||
          account.accountHolder.toLowerCase().includes(query) ||
          (account.notes && account.notes.toLowerCase().includes(query))
        )
      }

      return true
    })

    setFilteredAccounts(filtered)
  }, [searchQuery, accountTypeFilter, accounts])

  // Handle account edit
  const handleEditAccount = (id: string) => {
    setEditingAccountId(id)
    setShowAddAccount(true)
  }

  // Handle account delete
  const handleDeleteAccount = async (id: string) => {
    try {
      await BankAccounts.deleteAccount(id, masterPassword)
      setAccounts((prev) => prev.filter((account) => account.id !== id))
      toast({
        title: "Account deleted",
        description: "The bank account has been successfully deleted.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the account.",
        variant: "destructive",
      })
    }
  }

  // Handle account saved
  const handleAccountSaved = async () => {
    setShowAddAccount(false)
    setEditingAccountId(null)

    try {
      const refreshedAccounts = await BankAccounts.getAllAccounts(masterPassword)
      setAccounts(refreshedAccounts)
      toast({
        title: "Success",
        description: "Account saved successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh accounts.",
        variant: "destructive",
      })
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsLoading(true)
      const refreshedAccounts = await BankAccounts.getAllAccounts(masterPassword)
      setAccounts(refreshedAccounts)
      toast({
        title: "Refreshed",
        description: "Account list has been refreshed.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh accounts.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize table
  const table = useReactTable({
    data: filteredAccounts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  // If master password is not set
  if (!isMasterPasswordSet) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Master Password Required</h2>
        <p className="text-muted-foreground mb-4">Please set your master password to access bank accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bank Accounts</h1>
        <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <BankAccountForm
              accountId={editingAccountId || undefined}
              masterPassword={masterPassword}
              onSave={handleAccountSaved}
              onCancel={() => {
                setShowAddAccount(false)
                setEditingAccountId(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Manage Your Bank Accounts</CardTitle>
          <CardDescription>
            Securely store and manage your bank account information. All data is encrypted with your master password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={accountTypeFilter}
                  onValueChange={(value) => setAccountTypeFilter(value as AccountType | "all")}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAccountNumbers(!showAccountNumbers)}
                  title={showAccountNumbers ? "Hide account numbers" : "Show account numbers"}
                >
                  {showAccountNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                <p>{error}</p>
              </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: columns.length }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        {accounts.length === 0
                          ? "No accounts found. Add your first bank account."
                          : "No matching accounts found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Stats */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>
                {filteredAccounts.length} of {accounts.length} accounts
                {accountTypeFilter !== "all" && ` (filtered by ${accountTypeFilter})`}
              </div>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="mr-2 h-3 w-3" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <Upload className="mr-2 h-3 w-3" />
                  Import
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

