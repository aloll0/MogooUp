import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  RotateCcw,
  Trash2,
  Save,
  Loader2,
  Check,
  Shield,
  Layers,
  Users,
  FileEdit,
  Sliders,
  Briefcase,
  BarChart2,
} from "lucide-react";
import type { WorkspaceMember, WorkspacePermissions, Space } from "../services/taskflowService";
import { useConfirmStore } from "../stores/useConfirmStore";

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, WorkspacePermissions> = {
  owner: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: true,
    canCreateSpaces: true,
    canManageSpaces: true,
    canDeleteSpaces: true,
    canManageLists: true,
    canInviteMembers: true,
    canManageRoles: true,
    canRemoveMembers: true,
    canViewClients: true,
    canManageClients: true,
    canDeleteClients: true,
    canViewReports: true,
    canExportData: true,
    canManageGoals: true,
    canManageWorkspaceSettings: true,
  },
  admin: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: true,
    canCreateSpaces: true,
    canManageSpaces: true,
    canDeleteSpaces: true,
    canManageLists: true,
    canInviteMembers: true,
    canManageRoles: true,
    canRemoveMembers: true,
    canViewClients: true,
    canManageClients: true,
    canDeleteClients: true,
    canViewReports: true,
    canExportData: true,
    canManageGoals: true,
    canManageWorkspaceSettings: true,
  },
  manager: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: true,
    canCreateSpaces: true,
    canManageSpaces: true,
    canDeleteSpaces: false,
    canManageLists: true,
    canInviteMembers: true,
    canManageRoles: false,
    canRemoveMembers: false,
    canViewClients: true,
    canManageClients: true,
    canDeleteClients: false,
    canViewReports: true,
    canExportData: true,
    canManageGoals: true,
    canManageWorkspaceSettings: false,
  },
  member: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canChangeTaskStatus: true,
    canAssignTasks: true,
    canCommentOnTasks: true,
    canDeleteComments: false,
    canCreateSpaces: false,
    canManageSpaces: false,
    canDeleteSpaces: false,
    canManageLists: false,
    canInviteMembers: false,
    canManageRoles: false,
    canRemoveMembers: false,
    canViewClients: true,
    canManageClients: false,
    canDeleteClients: false,
    canViewReports: true,
    canExportData: false,
    canManageGoals: false,
    canManageWorkspaceSettings: false,
  },
  guest: {
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canChangeTaskStatus: false,
    canAssignTasks: false,
    canCommentOnTasks: true,
    canDeleteComments: false,
    canCreateSpaces: false,
    canManageSpaces: false,
    canDeleteSpaces: false,
    canManageLists: false,
    canInviteMembers: false,
    canManageRoles: false,
    canRemoveMembers: false,
    canViewClients: false,
    canManageClients: false,
    canDeleteClients: false,
    canViewReports: false,
    canExportData: false,
    canManageGoals: false,
    canManageWorkspaceSettings: false,
  },
};

interface MemberPermissionsEditorProps {
  member: WorkspaceMember;
  spaces?: Space[];
  currentUserRole: string;
  currentUserId?: string;
  onSave: (userId: string, role: string, permissions: WorkspacePermissions, allowedSpaces?: string[]) => Promise<void> | void;
  onRemove: (userId: string) => Promise<void> | void;
  isSaving: boolean;
  isRemoving?: boolean;
}

export const MemberPermissionsEditor: React.FC<MemberPermissionsEditorProps> = ({
  member,
  spaces = [],
  currentUserRole,
  currentUserId,
  onSave,
  onRemove,
  isSaving,
  isRemoving = false,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [selectedRole, setSelectedRole] = useState<string>(member.role || "member");
  const [permissions, setPermissions] = useState<WorkspacePermissions>(() => {
    return member.permissions && Object.keys(member.permissions).length > 0
      ? { ...DEFAULT_PERMISSIONS_BY_ROLE[member.role || "member"], ...member.permissions }
      : { ...DEFAULT_PERMISSIONS_BY_ROLE[member.role || "member"] };
  });
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(() => {
    return Array.isArray(member.allowedSpaces) ? member.allowedSpaces : [];
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedRole(member.role || "member");
    setPermissions(
      member.permissions && Object.keys(member.permissions).length > 0
        ? { ...DEFAULT_PERMISSIONS_BY_ROLE[member.role || "member"], ...member.permissions }
        : { ...DEFAULT_PERMISSIONS_BY_ROLE[member.role || "member"] }
    );
    setSelectedSpaces(Array.isArray(member.allowedSpaces) ? member.allowedSpaces : []);
    setHasChanges(false);
  }, [member._id, member.role, member.permissions, member.allowedSpaces]);

  const isOwner = member.role === "owner";
  const isSelf = (member.userId?._id || member.userId) === currentUserId;
  const canManage = ["owner", "admin"].includes(currentUserRole) && !isOwner && !isSelf;

  const handleRoleChange = (newRole: string) => {
    if (!canManage) return;
    setSelectedRole(newRole);
    // Apply defaults of the new role
    setPermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE[newRole] });
    setHasChanges(true);
  };

  const handleToggleSpace = (spaceId: string) => {
    if (!canManage || isOwner) return;
    setSelectedSpaces((prev) => {
      const next = prev.includes(spaceId) ? prev.filter((id) => id !== spaceId) : [...prev, spaceId];
      setHasChanges(true);
      return next;
    });
  };

  const handleToggleAllSpaces = () => {
    if (!canManage || isOwner) return;
    const allSpaceIds = spaces.map((s) => s._id);
    const areAllSelected = allSpaceIds.every((id) => selectedSpaces.includes(id));
    const next = areAllSelected ? [] : allSpaceIds;
    setSelectedSpaces(next);
    setHasChanges(true);
  };

  const handleTogglePermission = (key: keyof WorkspacePermissions) => {
    if (!canManage || isOwner) return;
    setPermissions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return next;
    });
  };

  const handleResetDefaults = () => {
    if (!canManage) return;
    setPermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE[selectedRole] });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!canManage) return;
    onSave(member.userId?._id || (member.userId as any), selectedRole, permissions, selectedSpaces);
    setHasChanges(false);
  };

  const handleRemoveMember = async () => {
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
      onRemove(member.userId?._id || (member.userId as any));
    }
  };

  const roleDefinitions = [
    {
      id: "admin",
      label: t("roles.admin"),
      desc: t("workspaceMembersModal.role_admin_desc"),
      color: "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400",
      badgeColor: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    },
    {
      id: "manager",
      label: t("roles.manager"),
      desc: t("workspaceMembersModal.role_manager_desc"),
      color: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    },
    {
      id: "member",
      label: t("roles.member"),
      desc: t("workspaceMembersModal.role_member_desc"),
      color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
    {
      id: "guest",
      label: t("roles.guest"),
      desc: t("workspaceMembersModal.role_guest_desc"),
      color: "border-zinc-500/40 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
      badgeColor: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
    },
  ];

  const permissionGroups = [
    {
      title: t("workspaceMembersModal.taskOps", { defaultValue: "Task Operations" }),
      icon: FileEdit,
      items: [
        {
          key: "canCreateTasks" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canCreateTasks", { defaultValue: "Create Tasks" }),
          desc: t("workspaceMembersModal.perm_canCreateTasks_desc", { defaultValue: "Allow member to create new tasks in spaces and lists" }),
        },
        {
          key: "canEditTasks" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canEditTasks", { defaultValue: "Edit Task Details" }),
          desc: t("workspaceMembersModal.perm_canEditTasks_desc", { defaultValue: "Edit task details, descriptions, due dates, and custom fields" }),
        },
        {
          key: "canDeleteTasks" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canDeleteTasks", { defaultValue: "Delete Tasks" }),
          desc: t("workspaceMembersModal.perm_canDeleteTasks_desc", { defaultValue: "Permanently delete tasks from the workspace" }),
          isDanger: true,
        },
        {
          key: "canChangeTaskStatus" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canChangeTaskStatus", { defaultValue: "Move Tasks & Change Status" }),
          desc: t("workspaceMembersModal.perm_canChangeTaskStatus_desc", { defaultValue: "Move tasks between workflow columns and update status" }),
        },
        {
          key: "canAssignTasks" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canAssignTasks", { defaultValue: "Assign & Reassign Tasks" }),
          desc: t("workspaceMembersModal.perm_canAssignTasks_desc", { defaultValue: "Assign tasks to team members and modify assignees" }),
        },
        {
          key: "canCommentOnTasks" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canCommentOnTasks", { defaultValue: "Add Comments & Files" }),
          desc: t("workspaceMembersModal.perm_canCommentOnTasks_desc", { defaultValue: "Write comments, notes, and attach files to tasks" }),
        },
        {
          key: "canDeleteComments" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canDeleteComments", { defaultValue: "Delete Comments" }),
          desc: t("workspaceMembersModal.perm_canDeleteComments_desc", { defaultValue: "Delete comments and notes from tasks" }),
          isDanger: true,
        },
      ],
    },
    {
      title: t("workspaceMembersModal.spaceOps", { defaultValue: "Spaces & Structure" }),
      icon: Layers,
      items: [
        {
          key: "canCreateSpaces" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canCreateSpaces", { defaultValue: "Create Spaces" }),
          desc: t("workspaceMembersModal.perm_canCreateSpaces_desc", { defaultValue: "Create new project spaces and folders" }),
        },
        {
          key: "canManageSpaces" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canManageSpaces", { defaultValue: "Manage Spaces" }),
          desc: t("workspaceMembersModal.perm_canManageSpaces_desc", { defaultValue: "Edit space names, colors, and configuration" }),
        },
        {
          key: "canDeleteSpaces" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canDeleteSpaces", { defaultValue: "Delete Spaces" }),
          desc: t("workspaceMembersModal.perm_canDeleteSpaces_desc", { defaultValue: "Permanently delete project spaces and their lists" }),
          isDanger: true,
        },
        {
          key: "canManageLists" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canManageLists", { defaultValue: "Manage Lists & Columns" }),
          desc: t("workspaceMembersModal.perm_canManageLists_desc", { defaultValue: "Create, edit, reorder, or delete lists and columns" }),
        },
      ],
    },
    {
      title: t("workspaceMembersModal.teamOps", { defaultValue: "Team & Members" }),
      icon: Users,
      items: [
        {
          key: "canInviteMembers" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canInviteMembers", { defaultValue: "Invite Members" }),
          desc: t("workspaceMembersModal.perm_canInviteMembers_desc", { defaultValue: "Send invitations and add collaborators to the workspace" }),
        },
        {
          key: "canManageRoles" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canManageRoles", { defaultValue: "Manage Roles & Permissions" }),
          desc: t("workspaceMembersModal.perm_canManageRoles_desc", { defaultValue: "Change member roles and customize their permission matrix" }),
        },
        {
          key: "canRemoveMembers" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canRemoveMembers", { defaultValue: "Remove Members" }),
          desc: t("workspaceMembersModal.perm_canRemoveMembers_desc", { defaultValue: "Remove and kick collaborators from the workspace" }),
          isDanger: true,
        },
      ],
    },
    {
      title: t("workspaceMembersModal.clientOps", { defaultValue: "Client Projects" }),
      icon: Briefcase,
      items: [
        {
          key: "canViewClients" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canViewClients", { defaultValue: "View Client Projects" }),
          desc: t("workspaceMembersModal.perm_canViewClients_desc", { defaultValue: "Browse client directory, projects, and contracts" }),
        },
        {
          key: "canManageClients" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canManageClients", { defaultValue: "Manage Client Projects" }),
          desc: t("workspaceMembersModal.perm_canManageClients_desc", { defaultValue: "Create and update client projects and services" }),
        },
        {
          key: "canDeleteClients" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canDeleteClients", { defaultValue: "Delete Client Projects" }),
          desc: t("workspaceMembersModal.perm_canDeleteClients_desc", { defaultValue: "Permanently delete client project records" }),
          isDanger: true,
        },
      ],
    },
    {
      title: t("workspaceMembersModal.analyticsOps", { defaultValue: "Reports & Goals" }),
      icon: BarChart2,
      items: [
        {
          key: "canViewReports" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canViewReports", { defaultValue: "View Reports & Analytics" }),
          desc: t("workspaceMembersModal.perm_canViewReports_desc", { defaultValue: "Access analytics dashboards and progress reports" }),
        },
        {
          key: "canExportData" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canExportData", { defaultValue: "Export Data & Reports" }),
          desc: t("workspaceMembersModal.perm_canExportData_desc", { defaultValue: "Download and print workspace data as PDF or Excel" }),
        },
        {
          key: "canManageGoals" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canManageGoals", { defaultValue: "Manage Strategic Goals (OKRs)" }),
          desc: t("workspaceMembersModal.perm_canManageGoals_desc", { defaultValue: "Create, edit, and track strategic goals and OKRs" }),
        },
      ],
    },
    {
      title: t("workspaceMembersModal.settingsOps", { defaultValue: "Workspace Settings" }),
      icon: Sliders,
      items: [
        {
          key: "canManageWorkspaceSettings" as keyof WorkspacePermissions,
          title: t("workspaceMembersModal.perm_canManageWorkspaceSettings", { defaultValue: "Workspace Settings" }),
          desc: t("workspaceMembersModal.perm_canManageWorkspaceSettings_desc", { defaultValue: "Manage workspace branding, logo, and core settings" }),
        },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Role Selection Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("workspaceMembersModal.roleLabel", { defaultValue: "Workspace Role" })}
            </h4>
          </div>
          {isOwner && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
              {t("roles.owner")} (Full Owner)
            </span>
          )}
        </div>

        {isOwner ? (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>{t("workspaceMembersModal.role_owner_desc")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {roleDefinitions.map((roleItem) => {
              const isCurrent = selectedRole === roleItem.id;
              return (
                <button
                  key={roleItem.id}
                  type="button"
                  disabled={!canManage}
                  onClick={() => handleRoleChange(roleItem.id)}
                  className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isCurrent
                      ? `${roleItem.color} ring-2 ring-purple-500 shadow-xs font-semibold`
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  } ${!canManage ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{roleItem.label}</span>
                    {isCurrent && <Check className="h-3.5 w-3.5 text-purple-500 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {roleItem.desc}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Assigned Departments & Spaces Section */}
      <div className="space-y-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-500" />
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isAr ? "الأقسام والمساحات المصرح بها" : "Assigned Departments & Spaces"}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAr
                  ? "حدد الأقسام التي يحق لهذا العضو دخولها واستعراض مهامها داخل مساحة العمل"
                  : "Select the spaces/departments this member has permission to enter and view"}
              </p>
            </div>
          </div>

          {canManage && !isOwner && selectedRole !== "admin" && spaces.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllSpaces}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer font-bold shrink-0"
            >
              {spaces.every((s) => selectedSpaces.includes(s._id))
                ? (isAr ? "إلغاء تحديد الكل" : "Deselect All")
                : (isAr ? "تحديد كل الأقسام" : "Select All")}
            </button>
          )}
        </div>

        {isOwner || selectedRole === "admin" ? (
          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-300 text-xs flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-purple-500" />
            <span>
              {isAr
                ? "المدير وصاحب مساحة العمل لديهم صلاحية تلقائية للوصول إلى كافة الأقسام والمساحات."
                : "Admins and Owners have automatic access to all departments and spaces."}
            </span>
          </div>
        ) : spaces.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2">
            {isAr ? "لا توجد أقسام منشأة في مساحة العمل حالياً" : "No spaces created in this workspace yet"}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {spaces.map((sp) => {
              const isChecked = selectedSpaces.includes(sp._id);
              return (
                <button
                  key={sp._id}
                  type="button"
                  disabled={!canManage}
                  onClick={() => handleToggleSpace(sp._id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-start cursor-pointer ${
                    isChecked
                      ? "border-purple-500/50 bg-purple-500/10 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  } ${!canManage ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: sp.color || "#b57ede" }}
                    />
                    <span className="text-xs font-semibold truncate">{sp.name}</span>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isChecked
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Permissions Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("workspaceMembersModal.permissions", { defaultValue: "Custom Permissions" })}
            </h4>
          </div>

          {canManage && !isOwner && (
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("workspaceMembersModal.resetToDefaults", { defaultValue: "Reset to Role Defaults" })}</span>
            </button>
          )}
        </div>

        <div className="space-y-5">
          {permissionGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div
                key={group.title}
                className="bg-zinc-50/60 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <GroupIcon className="h-3.5 w-3.5 text-purple-500" />
                  <span>{group.title}</span>
                </div>

                <div className="space-y-2">
                  {group.items.map((perm) => {
                    const isEnabled = isOwner ? true : !!permissions[perm.key];
                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isEnabled
                            ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-750 shadow-xs"
                            : "bg-zinc-100/50 dark:bg-zinc-900/20 border-zinc-200/50 dark:border-zinc-800/50 opacity-75"
                        } ${canManage && !isOwner ? "cursor-pointer hover:border-purple-500/40" : ""}`}
                      >
                        <div className="min-w-0 pr-3">
                          <p
                            className={`text-xs font-bold ${
                              isEnabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
                            }`}
                          >
                            {perm.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-md sm:max-w-xl">
                            {perm.desc}
                          </p>
                        </div>

                        {/* Modern Switch Toggle */}
                        <div
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            isEnabled ? "bg-purple-600" : "bg-zinc-300 dark:bg-zinc-700"
                          } ${!canManage || isOwner ? "opacity-60 pointer-events-none" : ""}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      {canManage && !isOwner && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t dark:border-zinc-800">
          <button
            type="button"
            disabled={isRemoving}
            onClick={handleRemoveMember}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-red-500 hover:text-white hover:bg-red-500/90 border border-red-500/30 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            <span>{t("workspaceMembersModal.removeMember", { defaultValue: "Remove from Workspace" })}</span>
          </button>

          <button
            type="button"
            disabled={isSaving || !hasChanges}
            onClick={handleSave}
            className={`w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              hasChanges
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-60"
            }`}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{t("workspaceMembersModal.savePermissions", { defaultValue: "Save Changes" })}</span>
          </button>
        </div>
      )}
    </div>
  );
};
