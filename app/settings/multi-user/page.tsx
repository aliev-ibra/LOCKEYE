"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock, UserPlus, Users, Mail, Trash2, Edit, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { VaultManager } from "@/lib/vault"
import { MultiUserVault, type VaultUser } from "@/lib/multi-user-vault"

export default function MultiUserVaultPage() {
  const router = useRouter()
  const [users, setUsers] = useState<VaultUser[]>([])
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "viewer" as "owner" | "admin" | "member" | "viewer",
  })
  const [editingUser, setEditingUser] = useState<VaultUser | null>(null)

  // Load users
  useEffect(() => {
    if (!VaultManager.isUnlocked()) {
      router.push("/login")
      return
    }

    // Load users
    const vaultUsers = MultiUserVault.getUsers()
    setUsers(vaultUsers)
  }, [router])

  // Add a new user
  const addUser = () => {
    // Validate inputs
    if (!newUser.name) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      })
      return
    }

    if (!newUser.email) {
      toast({
        title: "Error",
        description: "Please enter an email",
        variant: "destructive",
      })
      return
    }

    try {
      // Add the user
      const user = MultiUserVault.addUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      })

      // Update the users list
      setUsers([...users, user])

      // Reset the form
      setNewUser({
        name: "",
        email: "",
        role: "viewer",
      })

      toast({
        title: "Success",
        description: "User added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive",
      })
    }
  }

  // Update a user
  const updateUser = () => {
    if (!editingUser) return

    // Validate inputs
    if (!editingUser.name) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      })
      return
    }

    if (!editingUser.email) {
      toast({
        title: "Error",
        description: "Please enter an email",
        variant: "destructive",
      })
      return
    }

    try {
      // Update the user
      const updatedUser = MultiUserVault.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      })

      // Update the users list
      setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)))

      // Reset editing state
      setEditingUser(null)

      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    }
  }

  // Delete a user
  const deleteUser = (id: string) => {
    if (
      !confirm("Are you sure you want to delete this user? This will also delete all shared passwords for this user.")
    ) {
      return
    }

    try {
      // Delete the user
      MultiUserVault.deleteUser(id)

      // Update the users list
      setUsers(users.filter((user) => user.id !== id))

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "member":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "viewer":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
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
              <Link href="/settings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              Multi-User Vault
            </h2>
            <p className="text-muted-foreground">Share and manage passwords securely with a team or family</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-primary" />
                  {editingUser ? "Edit User" : "Add New User"}
                </CardTitle>
                <CardDescription>
                  {editingUser ? "Edit an existing user" : "Add a new user to your vault"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Name</Label>
                  <Input
                    id="user-name"
                    value={editingUser ? editingUser.name : newUser.name}
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, name: e.target.value })
                        : setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder="Enter user's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={editingUser ? editingUser.email : newUser.email}
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, email: e.target.value })
                        : setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="Enter user's email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Select
                    value={editingUser ? editingUser.role : newUser.role}
                    onValueChange={(value) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, role: value as any })
                        : setNewUser({ ...newUser, role: value as any })
                    }
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner (Full Access)</SelectItem>
                      <SelectItem value="admin">Admin (Manage Users)</SelectItem>
                      <SelectItem value="member">Member (Add/Edit Passwords)</SelectItem>
                      <SelectItem value="viewer">Viewer (View Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  {editingUser ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditingUser(null)}>
                        Cancel
                      </Button>
                      <Button onClick={updateUser}>Update User</Button>
                    </div>
                  ) : (
                    <Button onClick={addUser}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vault Users</CardTitle>
                <CardDescription>Manage users who have access to your vault</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No users added yet. Add users using the form on the left.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-lg font-semibold text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                          >
                            {user.role}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Shared Password Permissions
                </CardTitle>
                <CardDescription>Control what users can do with shared passwords</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium">Role</th>
                        <th className="py-2 text-center font-medium">View Passwords</th>
                        <th className="py-2 text-center font-medium">Add Passwords</th>
                        <th className="py-2 text-center font-medium">Edit Passwords</th>
                        <th className="py-2 text-center font-medium">Delete Passwords</th>
                        <th className="py-2 text-center font-medium">Share Passwords</th>
                        <th className="py-2 text-center font-medium">Manage Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Owner</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Admin</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Member</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-red-500">✗</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Viewer</td>
                        <td className="py-2 text-center text-green-500">✓</td>
                        <td className="py-2 text-center text-red-500">✗</td>
                        <td className="py-2 text-center text-red-500">✗</td>
                        <td className="py-2 text-center text-red-500">✗</td>
                        <td className="py-2 text-center text-red-500">✗</td>
                        <td className="py-2 text-center text-red-500">✗</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
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
    </div>
  )
}

