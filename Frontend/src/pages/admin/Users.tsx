"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Search, Pencil, Trash2, Mail, Loader2 } from "lucide-react"
import AdminSidebar from "@/components/admin-sidebar"
import { adminAPI } from "@/lib/api"

interface User {
  id: string
  name: string
  email: string
  role: "STUDENT" | "PRINCIPAL" | "PLACEMENT" | "HOD"
  collegeId: string | null
  college: string
  status: "active" | "inactive"
}

interface College {
  _id: string
  name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"createdAt" | "role" | "name" | "email">("createdAt")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<User, "id"> & { password?: string }>({
    name: "",
    email: "",
    role: "STUDENT",
    collegeId: "",
    college: "",
    status: "active",
    password: ""
  })

  useEffect(() => {
    fetchColleges()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [filterRole, sortBy, order, searchTerm])

  const fetchColleges = async () => {
    try {
      const res = await adminAPI.getColleges()
      if (res.data) {
        setColleges(res.data)
      }
    } catch (error) {
      console.error("Failed to fetch colleges", error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterRole && filterRole !== "all") params.role = filterRole.toLowerCase()
      if (searchTerm) params.search = searchTerm
      params.sortBy = sortBy
      params.order = order
      const res = await adminAPI.getUsers(params)
      if (res.data && res.data.users) {
        setUsers(res.data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUserId(null)
    setFormData({
      name: "",
      email: "",
      role: "STUDENT",
      collegeId: "",
      college: "",
      status: "active",
      password: ""
    })
    setIsModalOpen(true)
  }

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setEditingUserId(userId)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role.toUpperCase() as any,
      collegeId: user.collegeId || "",
      college: user.college,
      status: user.status,
      password: ""
    })
    setIsModalOpen(true)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      adminAPI.deleteUser(userId)
        .then(() => fetchUsers())
        .catch((error) => {
          console.error("Failed to delete user", error)
          alert("Failed to delete user. Check console for details.")
        })
    }
  }

  const handleSaveUser = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Name and email are required.")
      return
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role.toUpperCase() === "PLACEMENT" ? "placement_officer" : formData.role.toLowerCase(),
        collegeId: formData.collegeId,
        status: formData.status,
      }

      if (editingUserId) {
        await adminAPI.updateUser(editingUserId, payload)
        await fetchUsers()
      } else {
        const res = await adminAPI.createUser(payload)
        if (res?.data?.warning) {
          alert(`Success with warning: ${res.data.warning}`)
        } else {
          alert("User created successfully.")
        }
        await fetchUsers()
      }
      setIsModalOpen(false)
      setEditingUserId(null)
    } catch (error: any) {
      console.error("Failed to save user", error)
      alert(error?.response?.data?.message || "Failed to save user. Check console for details.")
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "STUDENT":
        return "bg-blue-500/20 text-blue-400"
      case "PRINCIPAL":
        return "bg-purple-500/20 text-purple-400"
      case "PLACEMENT":
      case "PLACEMENT_OFFICER":
        return "bg-green-500/20 text-green-400"
      case "HOD":
        return "bg-orange-500/20 text-orange-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #1e2a78 0%, #2d3a8c 25%, #1a1d3e 60%, #0f1238 100%)",
      }}
    >
      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 ml-64">
          <header className="bg-gradient-to-r from-[#4c54d2] to-[#5b63d3] px-8 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Users className="w-7 h-7" />
                <h1 className="text-2xl font-bold">User Management</h1>
              </div>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition flex items-center gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </header>

          <div className="px-8 py-6">
            {/* Filters */}
            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all" className="bg-[#1a1d3e]">All Roles</option>
                <option value="STUDENT" className="bg-[#1a1d3e]">Student</option>
                <option value="PRINCIPAL" className="bg-[#1a1d3e]">Principal</option>
                <option value="PLACEMENT_OFFICER" className="bg-[#1a1d3e]">Placement Officer</option>
                <option value="HOD" className="bg-[#1a1d3e]">HOD</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-white/10">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Email</th>
                    <th
                      className="px-6 py-4 text-left text-white font-semibold cursor-pointer"
                      onClick={() => {
                        if (sortBy === "role") {
                          setOrder(order === "asc" ? "desc" : "asc")
                        } else {
                          setSortBy("role")
                          setOrder("asc")
                        }
                      }}
                    >
                      Role {sortBy === "role" ? (order === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-6 py-4 text-left text-white font-semibold">College</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-white/60">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading users...
                        </div>
                      </td>
                    </tr>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-white">{user.name}</td>
                        <td className="px-6 py-4 text-white/70 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/70">{user.college}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                              }`}
                          >
                            {user.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60 text-lg">No users found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#15193c] w-full max-w-lg rounded-xl border border-white/10 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingUserId ? "Edit User" : "Add User"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Full Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User["role"] })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="STUDENT" className="bg-[#1a1d3e]">Student</option>
                  <option value="PRINCIPAL" className="bg-[#1a1d3e]">Principal</option>
                  <option value="PLACEMENT" className="bg-[#1a1d3e]">Placement</option>
                  <option value="HOD" className="bg-[#1a1d3e]">HOD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">College</label>
                <select
                  value={formData.collegeId || ""}
                  onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-[#1a1d3e]">None / Platform</option>
                  {colleges.map((col) => (
                    <option key={col._id} value={col._id} className="bg-[#1a1d3e]">
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as User["status"] })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="active" className="bg-[#1a1d3e]">Active</option>
                  <option value="inactive" className="bg-[#1a1d3e]">Inactive</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
