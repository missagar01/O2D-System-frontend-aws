"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AUTH_BASE_URL, axiosConfig } from "@/config/api"
import { useAuth } from "./auth-context"

type PermissionFlags = {
  read: boolean
  write: boolean
  update: boolean
  delete: boolean
}

type PermissionUser = {
  id: number
  username: string
  access?: string
  supervisor_name?: string
  item_name?: string
  quality_controller?: string
  role?: string
  loading_incharge?: string
  created_at?: string
  updated_at?: string
  permissions?: Partial<PermissionFlags>
}

const DEFAULT_PERMISSIONS: PermissionFlags = {
  read: true,
  write: false,
  update: false,
  delete: false,
}

const normalizePermissions = (value?: Partial<PermissionFlags>, access?: string): PermissionFlags => {
  const normalizedAccess = access?.trim().toLowerCase()
  const accessIsAll = normalizedAccess === "all"

  return {
    read: value?.read ?? true,
    write: value?.write ?? accessIsAll ?? false,
    update: value?.update ?? accessIsAll ?? false,
    delete: value?.delete ?? accessIsAll ?? false,
  }
}

export function PermissionsView() {
  const { token } = useAuth()
  const [users, setUsers] = useState<PermissionUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [baseline, setBaseline] = useState<Record<number, PermissionFlags>>({})
  const [modalState, setModalState] = useState<{
    open: boolean
    message: string
    type: "success" | "error"
  }>({ open: false, message: "", type: "success" })

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${AUTH_BASE_URL}/auth/users`, {
        ...axiosConfig,
        headers: {
          ...(axiosConfig as any).headers,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
      const payload = res.data

      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : []

      if (!rows.length) {
        throw new Error(payload?.error || "No users returned from server")
      }

      const filtered = (rows as PermissionUser[]).filter(
        (user) => user.username?.toLowerCase() !== "admin"
      )

      const mapped = filtered.map((user) => {
        const normalized = normalizePermissions(user.permissions, user.access)
        return {
          ...user,
          permissions: normalized,
        }
      })

      setUsers(mapped)
      setBaseline(
        mapped.reduce((acc, user) => {
          acc[user.id] = user.permissions as PermissionFlags
          return acc
        }, {} as Record<number, PermissionFlags>)
      )
    } catch (err: any) {
      setError(err?.message || "Unable to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [token])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const query = search.toLowerCase()
    return users.filter(
      (user) =>
        user.username?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.access?.toLowerCase().includes(query)
    )
  }, [search, users])

  const handlePermissionChange = (userId: number, key: keyof PermissionFlags, nextValue: boolean) => {
    const target = users.find((user) => user.id === userId)
    if (!target) return

    const nextPermissions = {
      ...normalizePermissions(target.permissions, target.access),
      [key]: nextValue,
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, permissions: nextPermissions } : user
      )
    )

  }

  const handleSubmit = async () => {
    if (!token) {
      setError("You need to be logged in to submit permissions.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const dirtyUsers = users.filter((user) => {
        const current = normalizePermissions(user.permissions, user.access)
        const original = baseline[user.id]
        return JSON.stringify(current) !== JSON.stringify(original)
      })

      if (!dirtyUsers.length) {
        setModalState({
          open: true,
          message: "No permission changes to save.",
          type: "success",
        })
        return
      }

      const headers = {
        "Content-Type": "application/json",
        ...(axiosConfig as any).headers,
        Authorization: `Bearer ${token}`,
      }

      const payload = {
        users: dirtyUsers.map((user) => ({
          id: user.id,
          permissions: normalizePermissions(user.permissions, user.access),
        })),
      }

      await axios.post(`${AUTH_BASE_URL}/auth/users/permissions`, payload, {
        ...axiosConfig,
        headers,
      })
      setModalState({
        open: true,
        message: "Permissions saved successfully.",
        type: "success",
      })
      setBaseline((prev) => {
        const next = { ...prev }
        dirtyUsers.forEach((user) => {
          next[user.id] = normalizePermissions(user.permissions, user.access)
        })
        return next
      })
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit permissions"
      setError(message)
      setModalState({
        open: true,
        message,
        type: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
          <p className="text-muted-foreground">
            Manage who can read, write, update, and delete.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or role"
            className="w-full sm:w-64"
          />
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Permission Levels
          </CardTitle>
          <CardDescription>
            Toggle CRUD permissions per user. Admin users are hidden from this list.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Read</Badge>
            <span className="text-sm text-muted-foreground">View data</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Write</Badge>
            <span className="text-sm text-muted-foreground">Create new entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Update</Badge>
            <span className="text-sm text-muted-foreground">Modify existing data</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Delete</Badge>
            <span className="text-sm text-muted-foreground">Remove records</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>User Access</CardTitle>
          <CardDescription>Click switches to set permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Quality Controller</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>Write</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const permissions = normalizePermissions(user.permissions, user.access)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Badge variant="outline">{user.access || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{user.role || "-"}</TableCell>
                        <TableCell className="max-w-[140px] truncate">
                          {user.item_name || "-"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">
                          {user.supervisor_name || "-"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {user.quality_controller || "-"}
                        </TableCell>
                        {(["read", "write", "update", "delete"] as (keyof PermissionFlags)[]).map(
                          (key) => (
                            <TableCell key={key}>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-primary"
                                  checked={permissions[key]}
                                  onChange={(event) =>
                                    handlePermissionChange(user.id, key, event.target.checked)
                                  }
                                  disabled={submitting}
                                />
                              </div>
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardContent className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </CardContent>
      </Card>

      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {modalState.type === "success" ? "Success" : "Error"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalState((prev) => ({ ...prev, open: false }))}
              >
                Close
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{modalState.message}</p>
            <div className="flex justify-end">
              <Button onClick={() => setModalState((prev) => ({ ...prev, open: false }))}>
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
