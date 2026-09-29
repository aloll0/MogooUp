import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Check,
  Trash2,
  Sliders,
} from "lucide-react";
import { taskflowService } from "../services/taskflowService";
import type { WorkspacePermissions } from "../services/taskflowService";
import { DEFAULT_PERMISSIONS_BY_ROLE } from "./MemberPermissionsEditor";
import { useConfirmStore } from "../stores/useConfirmStore";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  currentUserRole: string;
  currentUserId?: string;
  onInvite: (email: string, role: string, permissions?: WorkspacePermissions) => void;
  onUpdateRole: (userId: string, role: string) => void;
  onRemoveMember?: (userId: string) => void;
  isInvitePending: boolean;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserRole,
  currentUserId,
  onInvite,
  onUpdateRole,
  onRemoveMember,
  isInvitePending,
}) => {
  const { t } = useTranslation();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member" | "guest">("member");
  const [customPermissions, setCustomPermissions] = useState<WorkspacePermissions>({
    ...DEFAULT_PERMISSIONS_BY_ROLE.member,
  });
  const [showAdvancedPermissions, setShowAdvancedPermissions] = useState(false);

  // User search suggestions
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInviteEmail("");
      setInviteRole("member");
      setCustomPermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE.member });
      setShowAdvancedPermissions(false);
      setSuggestedUsers([]);
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // When role changes, update custom permissions to role default
  const handleRoleChange = (role: "admin" | "manager" | "member" | "guest") => {
    setInviteRole(role);
    setCustomPermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE[role] });
  };

  // Search registered users as email is typed
  useEffect(() => {
    const trimmed = inviteEmail.trim();
    if (trimmed.length < 2) {
      setSuggestedUsers([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const users = await taskflowService.searchUsers(trimmed);
        // Filter out users already in the workspace
        const existingUserIds = new Set(members.map((m: any) => m.userId?._id || m.userId?.id || m.userId));
        const filtered = (users || []).filter((u: any) => !existingUserIds.has(u._id));
        setSuggestedUsers(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inviteEmail, members]);

  if (!isOpen) return null;

  const handleSelectUser = (user: any) => {
    setInviteEmail(user.email);
    setShowSuggestions(false);
  };

  const handleTogglePermission = (key: keyof WorkspacePermissions) => {
    setCustomPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onInvite(inviteEmail.trim(), inviteRole, customPermissions);
    setInviteEmail("");
    setShowSuggestions(false);
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!onRemoveMember) return;
    const confirmed = await useConfirmStore.getState().show({
      title: t("workspaceMembersModal.confirmRemoveMemberTitle", { defaultValue: "Remove Member from Workspace" }),
      message: t("workspaceMembersModal.confirmRemoveMember", {
        defaultValue: "Are you sure you want to remove this member from the workspace?",
      }),
      confirmText: t("workspaceMembersModal.removeMember", { defaultValue: "Remove" }),
      cancelText: t("common.cancel", { defaultValue: "Cancel" }),
      type: "danger",
    });

    if (confirmed) {
      onRemoveMember(memberUserId);
    }
  };

  const roles = [
    { id: "admin", label: t("roles.admin"), desc: t("workspaceMembersModal.role_admin_desc") },
    { id: "manager", label: t("roles.manager"), desc: t("workspaceMembersModal.role_manager_desc") },
    { id: "member", label: t("roles.member"), desc: t("workspaceMembersModal.role_member_desc") },
    { id: "guest", label: t("roles.guest"), desc: t("workspaceMembersModal.role_guest_desc") },
  ] as const;

  const permissionItems = [
    { key: "canCreateTasks" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canCreateTasks") },
    { key: "canEditTasks" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canEditTasks") },
    { key: "canDeleteTasks" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canDeleteTasks") },
    { key: "canManageLists" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canManageLists") },
    { key: "canManageSpaces" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canManageSpaces") },
    { key: "canInviteMembers" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canInviteMembers") },
    { key: "canViewReports" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canViewReports") },
    { key: "canManageClients" as keyof WorkspacePermissions, label: t("workspaceMembersModal.perm_canManageClients") },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col transition-theme my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {t("workspaceMembersModal.title")}
              </h2>
              <p className="text-xs text-zinc-400">
                {t("workspaceMembersModal.confirmRoleChange", {
                  defaultValue: "Invite team members and manage their roles & permissions",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: Split Invite & Current Members */}
        <div className="flex flex-col md:flex-row gap-6 overflow-hidden flex-1 min-h-0">
          
          {/* Left Side: Invite Form */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-start">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {t("workspaceMembersModal.inviteTab")}
            </h3>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              {/* Email with autocomplete dropdown */}
              <div className="space-y-1 relative">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("inviteModal.labelEmail")}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder={t("inviteModal.placeholderEmail")}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onFocus={() => suggestedUsers.length > 0 && setShowSuggestions(true)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 py-2.5 px-3 pe-8 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                    required
                  />
                  {isSearchingUsers && (
                    <div className="absolute end-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestedUsers.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto divide-y dark:divide-zinc-800">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900/60">
                      {t("workspaceMembersModal.quickAdd", { defaultValue: "Registered Users" })}
                    </div>
                    {suggestedUsers.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-2.5 p-2.5 text-start hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors cursor-pointer"
                      >
                        <img
                          src={u.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                          alt=""
                          className="h-7 w-7 rounded-full bg-zinc-800 border shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                            {u.fullName}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Role selection radio pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("inviteModal.labelRole")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => {
                    const isSelected = inviteRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                          isSelected
                            ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500 text-purple-700 dark:text-purple-300 font-semibold"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{r.label}</span>
                          {isSelected && <Check className="h-3 w-3 text-purple-500" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Permissions Accordion */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedPermissions(!showAdvancedPermissions)}
                  className="w-full flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-purple-500" />
                    <span>{t("workspaceMembersModal.customizePermissions", { defaultValue: "Customize Permissions" })}</span>
                  </span>
                  {showAdvancedPermissions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAdvancedPermissions && (
                  <div className="p-3 bg-white dark:bg-zinc-950/30 space-y-2 border-t dark:border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {permissionItems.map((p) => {
                        const enabled = customPermissions[p.key];
                        return (
                          <label
                            key={p.key}
                            onClick={() => handleTogglePermission(p.key)}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                              enabled
                                ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold"
                                : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                            }`}
                          >
                            <span>{p.label}</span>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => {}}
                              className="accent-purple-600 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isInvitePending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shadow-purple-500/25"
              >
                {isInvitePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>{t("inviteModal.btnSubmit")}</span>
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-zinc-200 dark:border-zinc-800" />

          {/* Right Side: Current Workspace Members */}
          <div className="flex-1 flex flex-col min-h-0 text-start">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {t("workspaceMembersModal.membersTab")} ({members.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {members.map((m: any) => {
                const isOwner = m.role === "owner";
                const isSelf = (m.userId?._id || m.userId) === currentUserId;
                const canEdit = ["owner", "admin"].includes(currentUserRole) && !isOwner && !isSelf;

                return (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={m.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                        alt="avatar"
                        className="h-8 w-8 rounded-full bg-zinc-800 border shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">
                          {m.userId?.fullName} {isSelf && <span className="text-[10px] text-purple-500 font-semibold">(You)</span>}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">{m.userId?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ms-2">
                      {canEdit ? (
                        <>
                          <select
                            value={m.role}
                            onChange={async (e) => {
                              const newRole = e.target.value;
                              const confirmed = await useConfirmStore.getState().show({
                                title: t("workspaceMembersModal.confirmRoleChangeTitle", { defaultValue: "Change Member Role" }),
                                message: t("workspaceMembersModal.confirmRoleChange"),
                                confirmText: t("common.save", { defaultValue: "Save" }),
                                cancelText: t("common.cancel", { defaultValue: "Cancel" }),
                              });
                              if (confirmed) {
                                onUpdateRole(m.userId?._id || (m.userId as any), newRole);
                              }
                            }}
                            className="bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg py-1 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-purple-500 cursor-pointer text-zinc-900 dark:text-zinc-100"
                          >
                            <option value="admin">{t("roles.admin")}</option>
                            <option value="manager">{t("roles.manager")}</option>
                            <option value="member">{t("roles.member")}</option>
                            <option value="guest">{t("roles.guest")}</option>
                          </select>

                          {onRemoveMember && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId?._id || (m.userId as any))}
                              title={t("workspaceMembersModal.removeMember", { defaultValue: "Remove" })}
                              className="p-1 text-zinc-400 hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 capitalize">
                          {t(`roles.${m.role}`)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
