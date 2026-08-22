import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskflowService } from "../services/taskflowService";
import { 
  Users, 
  CheckCircle, 
  Loader2, 
  Shield, 
  Search,
  Building,
  UserCheck
} from "lucide-react";
import { useToastStore } from "../stores/useToastStore";

export const AdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<"users" | "workspaces">("users");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: taskflowService.getAdminUsers,
  });

  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["adminWorkspaces"],
    queryFn: taskflowService.getAdminWorkspaces,
  });

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: taskflowService.approveUser,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      useToastStore.getState().addToast(`Approved ${updatedUser.fullName || 'user'} successfully`, "success");
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to approve user", "error");
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: taskflowService.suspendUser,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      useToastStore.getState().addToast(`Suspended ${updatedUser.fullName || 'user'} successfully`, "success");
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to suspend user", "error");
    }
  });

  // Filter lists
  const filteredUsers = users.filter((u: any) => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkspaces = workspaces.filter((w: any) => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.owner?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="border-b dark:border-zinc-800 pb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5.5 w-5.5 text-purple-500" />
            <span>Arab Pro Platform Admin Panel</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage system registrations, approve new accounts, and view all active companies and teams.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
              Total Platform Users
            </span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {users.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
              Pending Approvals
            </span>
            <span className="text-2xl font-black text-amber-500 tracking-tight">
              {users.filter((u: any) => !u.isApproved).length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
              Active Companies / Workspaces
            </span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {workspaces.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveSubTab("users");
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "users"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-800"
            }`}
          >
            User Approvals
          </button>
          <button
            onClick={() => {
              setActiveSubTab("workspaces");
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "workspaces"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-800"
            }`}
          >
            Companies & Teams
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder={activeSubTab === "users" ? "Search users by name/email..." : "Search companies/owners..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
        </div>
      </div>

      {/* Subtab Panels */}
      {activeSubTab === "users" ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-zinc-450 text-xs">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold">
                    <th className="p-4">User</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Registered On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                  {filteredUsers.map((u: any) => (
                    <tr key={u._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt={u.fullName}
                            className="h-8 w-8 rounded-full border bg-zinc-850"
                          />
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">{u.fullName}</p>
                            <p className="text-[10px] text-zinc-450">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-55/10 text-green-600 dark:text-green-400 border border-green-200/20">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.isVerified ? (
                          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Verified</span>
                        ) : (
                          <span className="text-zinc-400">Unverified</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {u.isSystemAdmin ? (
                          <span className="text-[10px] font-bold text-purple-650 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            Super Admin
                          </span>
                        ) : u.isApproved ? (
                          <button
                            onClick={() => suspendUserMutation.mutate(u._id)}
                            disabled={suspendUserMutation.isPending}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200/50 hover:bg-red-500 hover:text-white dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 font-bold transition-all text-[11px] cursor-pointer"
                          >
                            Suspend Access
                          </button>
                        ) : (
                          <button
                            onClick={() => approveUserMutation.mutate(u._id)}
                            disabled={approveUserMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all text-[11px] shadow-sm cursor-pointer"
                          >
                            Approve Account
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoadingWorkspaces ? (
            <div className="col-span-2 flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-zinc-450 text-xs">
              No workspaces found.
            </div>
          ) : (
            filteredWorkspaces.map((ws: any) => (
              <div key={ws._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-theme">
                <div>
                  {/* WS Header */}
                  <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3 mb-4 gap-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">{ws.name}</h3>
                      <p className="text-[10px] text-zinc-450 font-semibold font-mono mt-0.5">slug: {ws.slug}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-500/20">
                      Owner: {ws.owner?.fullName || "Unowned"}
                    </span>
                  </div>

                  {/* Spaces / Departments */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block mb-2">
                      Project Spaces / Departments
                    </span>
                    {ws.spaces.length === 0 ? (
                      <p className="text-xs text-zinc-450 italic">No spaces created in this workspace.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {ws.spaces.map((sp: any) => (
                          <span
                            key={sp._id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800"
                          >
                            <span 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: sp.color || "#aa3bff" }} 
                            />
                            {sp.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team Members */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block mb-2">
                      Active Workspace Team ({ws.members.length} members)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ws.members.map((m: any) => (
                        <div key={m._id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150/40 dark:border-zinc-800/40">
                          <img
                            src={m.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt={m.userId?.fullName}
                            className="h-6 w-6 rounded-full border bg-zinc-800"
                          />
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{m.userId?.fullName}</p>
                            <p className="text-[9px] text-zinc-450 capitalize font-medium">{m.role} • {m.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right border-t dark:border-zinc-800 pt-3 mt-4 text-[10px] text-zinc-500 font-semibold">
                  Registered: {new Date(ws.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
