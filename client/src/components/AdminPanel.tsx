import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { taskflowService } from "../services/taskflowService";
import { 
  Users, 
  CheckCircle, 
  Loader2, 
  Shield, 
  Search,
  Building,
  RefreshCw,
  Clock,
  Layers,
  Briefcase,
  Activity,
  ChevronRight,
  ChevronLeft,
  X,
  Printer,
  FileText,
  Trash2,
  ExternalLink,
  UserMinus,
  Eye,
  Calendar,
  CheckSquare,
  AlertCircle,
  ArrowRight,
  Info,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Building2
} from "lucide-react";
import { useToastStore } from "../stores/useToastStore";
import { useConfirmStore } from "../stores/useConfirmStore";

interface AdminPanelProps {
  activeSubTab?: "dashboard" | "companies" | "users" | "deleted" | "audit" | "employee-reports";
}

const STATUS_META: Record<string, { ar: string; en: string; bg: string }> = {
  "to-do": { ar: "قيد الانتظار", en: "To Do", bg: "bg-blue-500/10 text-blue-400 border border-blue-500/25" },
  "todo": { ar: "قيد الانتظار", en: "To Do", bg: "bg-blue-500/10 text-blue-400 border border-blue-500/25" },
  "in-progress": { ar: "قيد التنفيذ", en: "In Progress", bg: "bg-amber-500/10 text-amber-400 border border-amber-500/25" },
  "in_progress": { ar: "قيد التنفيذ", en: "In Progress", bg: "bg-amber-500/10 text-amber-400 border border-amber-500/25" },
  "review": { ar: "قيد المراجعة", en: "In Review", bg: "bg-purple-500/10 text-purple-400 border border-purple-500/25" },
  "done": { ar: "مكتملة", en: "Completed", bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" },
  "blocked": { ar: "معلقة", en: "Blocked", bg: "bg-red-500/10 text-red-400 border border-red-500/25" },
};

const PRIORITY_META: Record<string, { ar: string; en: string; bg: string }> = {
  urgent: { ar: "عاجلة جداً", en: "Urgent", bg: "bg-red-500/15 text-red-400 border border-red-500/30" },
  high: { ar: "عالية", en: "High", bg: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
  medium: { ar: "متوسطة", en: "Medium", bg: "bg-blue-500/15 text-blue-400 border border-blue-500/30" },
  low: { ar: "منخفضة", en: "Low", bg: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30" },
};

const ACTION_META: Record<string, { ar: string; en: string; bg: string }> = {
  created: { ar: "إنشاء جديد", en: "Created", bg: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
  updated: { ar: "تعديل بيانات", en: "Updated", bg: "bg-blue-500/15 text-blue-400 border border-blue-500/30" },
  deleted: { ar: "حذف مهمة", en: "Deleted", bg: "bg-red-500/15 text-red-400 border border-red-500/30" },
  restored: { ar: "استعادة مهمة", en: "Restored", bg: "bg-purple-500/15 text-purple-400 border border-purple-500/30" },
  moved: { ar: "نقل مرحلة", en: "Moved", bg: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
  login: { ar: "تسجيل دخول", en: "Login", bg: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" },
};

const formatArabicDate = (dateVal: string | Date | undefined | null, isAr: boolean): string => {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
};

const formatAuditValue = (key: string, val: any, isAr: boolean): string => {
  if (val === undefined || val === null || val === "") return isAr ? "فارغ" : "Empty";
  
  // Status mapping
  if (key === "status" && typeof val === "string") {
    const meta = STATUS_META[val.toLowerCase()];
    if (meta) return isAr ? meta.ar : meta.en;
  }

  // Priority mapping
  if (key === "priority" && typeof val === "string") {
    const meta = PRIORITY_META[val.toLowerCase()];
    if (meta) return isAr ? meta.ar : meta.en;
  }

  // Assignees
  if (key === "assignees") {
    if (Array.isArray(val)) {
      if (val.length === 0) return isAr ? "بدون مسؤولين" : "None";
      return isAr ? `${val.length} عضو` : `${val.length} members`;
    }
    return isAr ? "المسؤولون" : "Assignees";
  }

  // ISO Dates
  if ((key === "dueDate" || key === "startDate" || key.toLowerCase().includes("date")) && typeof val === "string") {
    return formatArabicDate(val, isAr);
  }

  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
    return formatArabicDate(val, isAr);
  }

  if (typeof val === "object") {
    try {
      const str = JSON.stringify(val);
      if (str.length > 50) return str.substring(0, 47) + "...";
      return str;
    } catch {
      return "[Object]";
    }
  }

  const strVal = String(val);
  if (strVal.includes("data:image") || strVal.includes("base64")) {
    return isAr ? "[بيانات صورة]" : "[Image Data]";
  }
  if (strVal.length > 50) {
    return strVal.substring(0, 47) + "...";
  }
  return strVal;
};

const formatKeyName = (key: string, isAr: boolean): string => {
  if (!isAr) return key;
  const map: Record<string, string> = {
    title: "العنوان",
    description: "الوصف",
    status: "الحالة",
    priority: "الأولوية",
    dueDate: "تاريخ الاستحقاق",
    startDate: "تاريخ البدء",
    assignees: "المسؤولون",
    projectName: "المشروع",
    notes: "الملاحظات",
    timeEstimate: "الوقت المقدر",
    checklist: "قائمة المهام الفرعية",
    tags: "الوسوم",
  };
  return map[key] || key;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ activeSubTab }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const activeTab = activeSubTab || "dashboard";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"today" | "week" | "month">("month");
  const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");

  // Filters for Audit & Deleted Tabs
  const [selectedAuditCompanyId, setSelectedAuditCompanyId] = useState<string>("all");
  const [selectedAuditAction, setSelectedAuditAction] = useState<string>("all");
  const [selectedDeletedCompanyId, setSelectedDeletedCompanyId] = useState<string>("all");
  const [inspectDeletedTask, setInspectDeletedTask] = useState<any | null>(null);

  // Queries
  const { data: stats = { totalCompanies: 0, totalEmployees: 0, activeTasks: 0, completedToday: 0, delayedTasks: 0 } } = useQuery({
    queryKey: ["adminGlobalStats"],
    queryFn: taskflowService.getAdminStats,
    enabled: activeTab === "dashboard",
  });

  const { data: performance = [], isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["adminPerformance"],
    queryFn: taskflowService.getAdminPerformance,
    enabled: activeTab === "dashboard",
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: taskflowService.getAdminUsers,
    enabled: activeTab === "users" || activeTab === "employee-reports",
  });

  const { data: employeeReport = null, isLoading: isLoadingReport } = useQuery({
    queryKey: ["adminEmployeeReport", selectedEmployeeId, selectedTimeframe],
    queryFn: () => taskflowService.getEmployeeReport(selectedEmployeeId!, selectedTimeframe),
    enabled: activeTab === "employee-reports" && !!selectedEmployeeId,
  });

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["adminCompanies"],
    queryFn: taskflowService.getAdminCompanies,
    enabled: activeTab === "companies" || activeTab === "dashboard" || activeTab === "audit" || activeTab === "deleted",
  });

  const { data: deletedTasks = [], isLoading: isLoadingDeleted } = useQuery({
    queryKey: ["adminDeletedTasks", selectedDeletedCompanyId],
    queryFn: () => taskflowService.getAdminDeletedTasks(selectedDeletedCompanyId !== "all" ? selectedDeletedCompanyId : undefined),
    enabled: activeTab === "deleted",
  });

  const { data: globalActivities = [], isLoading: isLoadingAudit } = useQuery({
    queryKey: ["adminGlobalActivities", selectedAuditCompanyId],
    queryFn: () => taskflowService.getGlobalActivities(selectedAuditCompanyId !== "all" ? selectedAuditCompanyId : undefined),
    enabled: activeTab === "audit",
  });

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: taskflowService.approveUser,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      useToastStore.getState().addToast(
        isAr ? `تمت الموافقة على الموظف ${updatedUser.fullName || ''} بنجاح` : `Approved ${updatedUser.fullName || 'user'} successfully`, 
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to approve user", "error");
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: taskflowService.suspendUser,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      useToastStore.getState().addToast(
        isAr ? `تم تعليق حساب الموظف ${updatedUser.fullName || ''} بنجاح` : `Suspended ${updatedUser.fullName || 'user'} successfully`, 
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to suspend user", "error");
    }
  });

  const adminChangeUserPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      taskflowService.adminChangeUserPassword(userId, { newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      useToastStore.getState().addToast(
        isAr ? "تمت إعادة تعيين كلمة مرور المستخدم بنجاح" : "User password reset successfully",
        "success"
      );
      setSelectedUserForReset(null);
      setAdminNewPassword("");
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to reset password", "error");
    }
  });

  const restoreTaskMutation = useMutation({
    mutationFn: taskflowService.restoreDeletedTask,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["adminDeletedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setInspectDeletedTask(null);
      useToastStore.getState().addToast(
        isAr ? `تم استعادة المهمة "${task.title}" بنجاح` : `Restored task "${task.title}" successfully`, 
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to restore task", "error");
    }
  });

  const permanentlyDeleteTaskMutation = useMutation({
    mutationFn: taskflowService.permanentlyDeleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeletedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      setInspectDeletedTask(null);
      useToastStore.getState().addToast(
        isAr ? "تم حذف المهمة نهائياً من قاعدة البيانات" : "Task permanently deleted",
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(
        err?.response?.data?.error?.message || "Failed to permanently delete task",
        "error"
      );
    }
  });

  const handleConfirmPermanentDeleteTask = async (taskId: string, title: string) => {
    const ok = await useConfirmStore.getState().show({
      title: isAr ? `حذف نهائي للمهمة "${title}"` : `Permanently Delete Task "${title}"`,
      message: isAr
        ? `تحذير: هذا الإجراء لا يمكن التراجع عنه أبداً! سيتم مسح كافة تفاصيل المهمة وسجلاتها نهائياً من قاعدة البيانات.`
        : `Warning: This action cannot be undone! The task and all its data will be permanently removed from the database.`,
      confirmText: isAr ? "نعم، حذف نهائي للأبد" : "Yes, Permanently Delete",
      cancelText: isAr ? "إلغاء" : "Cancel",
    });
    if (ok) {
      permanentlyDeleteTaskMutation.mutate(taskId);
    }
  };

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => taskflowService.deleteWorkspace(workspaceId),
    onSuccess: (_, deletedWsId) => {
      queryClient.setQueryData(["adminCompanies"], (old: any) =>
        Array.isArray(old) ? old.filter((w: any) => w._id !== deletedWsId) : []
      );
      queryClient.setQueryData(["workspaces"], (old: any) =>
        Array.isArray(old) ? old.filter((w: any) => w._id !== deletedWsId) : []
      );
      queryClient.invalidateQueries({ queryKey: ["adminCompanies"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setSelectedCompanyId(null);
      useToastStore.getState().addToast(
        isAr ? "تم حذف مساحة العمل بالكامل بنجاح" : "Workspace deleted successfully",
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to delete workspace", "error");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => taskflowService.deleteUser(userId),
    onSuccess: (_, deletedUserId) => {
      queryClient.setQueryData(["adminUsers"], (old: any) =>
        Array.isArray(old) ? old.filter((u: any) => u._id !== deletedUserId) : []
      );
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      queryClient.invalidateQueries({ queryKey: ["adminCompanies"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      useToastStore.getState().addToast(
        isAr ? "تم حذف المستخدم نهائياً بنجاح" : "User deleted permanently",
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to delete user", "error");
    },
  });

  const toggleSystemAdminMutation = useMutation({
    mutationFn: ({ userId, isSystemAdmin }: { userId: string; isSystemAdmin: boolean }) =>
      taskflowService.toggleSystemAdmin(userId, isSystemAdmin),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      useToastStore.getState().addToast(
        isAr
          ? (updatedUser.isSystemAdmin ? "تمت ترقية المستخدم لمشرف عام" : "تمت إزالة صلاحية المشرف العام")
          : (updatedUser.isSystemAdmin ? "Promoted to Super Admin" : "Demoted from Super Admin"),
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to update role", "error");
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role: string }) =>
      taskflowService.updateWorkspaceMemberRole(workspaceId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCompanies"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      useToastStore.getState().addToast(
        isAr ? "تم تحديث دور العضو بنجاح" : "Member role updated successfully",
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to update role", "error");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      taskflowService.removeWorkspaceMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCompanies"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      useToastStore.getState().addToast(
        isAr ? "تمت إزالة العضو من مساحة العمل بنجاح" : "Member removed successfully",
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to remove member", "error");
    },
  });

  const handleConfirmDeleteWorkspace = async (workspaceId: string, name: string) => {
    const ok = await useConfirmStore.getState().show({
      title: isAr ? `حذف شركة ومساحة عمل "${name}"` : `Delete Workspace "${name}"`,
      message: isAr
        ? `هل أنت متأكد من حذف هذه الشركة ومساحات عملها وكافة مهامها وقوائمها ومشاريعها نهائياً؟ هذا الإجراء فوري ولا يمكن التراجع عنه.`
        : `Are you sure you want to permanently delete workspace "${name}" and all of its spaces, lists, tasks, and client projects? This cannot be undone.`,
      confirmText: isAr ? "نعم، حذف نهائي" : "Yes, Delete Permanently",
      cancelText: isAr ? "إلغاء" : "Cancel",
    });
    if (ok) {
      deleteWorkspaceMutation.mutate(workspaceId);
    }
  };

  const handleConfirmDeleteUser = async (userId: string, fullName: string) => {
    const ok = await useConfirmStore.getState().show({
      title: isAr ? `حذف حساب المستخدم "${fullName}"` : `Delete User "${fullName}"`,
      message: isAr
        ? `هل أنت متأكد من حذف هذا الحساب نهائياً من منصة عرب برو؟ سيتم إزالته من جميع مساحات العمل والمهام المسندة إليه.`
        : `Are you sure you want to permanently delete user "${fullName}"? They will be removed from all workspaces and assignments.`,
      confirmText: isAr ? "نعم، حذف نهائي" : "Yes, Delete User",
      cancelText: isAr ? "إلغاء" : "Cancel",
    });
    if (ok) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Filters
  const filteredUsers = users.filter((u: any) => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.owner?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeleted = deletedTasks.filter((t: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (t.title || "").toLowerCase().includes(q);
    const descMatch = (t.description || "").toLowerCase().includes(q);
    const delByMatch = (t.deletedBy?.fullName || "").toLowerCase().includes(q);
    const wsMatch = (t.workspaceId?.name || t.workspaceId?.slug || "").toLowerCase().includes(q);
    const spaceMatch = (t.spaceId?.name || "").toLowerCase().includes(q);
    const clientMatch = (t.clientProjectId?.clientName || t.projectName || "").toLowerCase().includes(q);
    return titleMatch || descMatch || delByMatch || wsMatch || spaceMatch || clientMatch;
  });

  const filteredAudit = globalActivities.filter((act: any) => {
    if (selectedAuditAction !== "all" && act.action !== selectedAuditAction) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const actorName = (act.userId?.fullName || "").toLowerCase();
    const taskTitle = (act.details?.title || "").toLowerCase();
    const companyName = (act.workspaceId?.name || act.workspaceId?.slug || "").toLowerCase();
    const entityType = (act.entityType || "").toLowerCase();
    return actorName.includes(q) || taskTitle.includes(q) || companyName.includes(q) || entityType.includes(q);
  });

  const selectedCompanyObj = companies.find((c: any) => c._id === selectedCompanyId);

  return (
    <div className="p-3 sm:p-6 space-y-6 text-start max-w-full overflow-x-hidden min-w-0">
      
      {/* 1. Header Section */}
      <div className="border-b dark:border-zinc-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>{isAr ? "لوحة تحكم المشرف العام" : "Super Admin Dashboard & Console"}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
            {isAr 
              ? "مراقبة مؤشرات الشركات المتعددة، مراجعة أداء الموظفين، فحص سجل التدقيق، واستعادة المهام المحذوفة."
              : "Monitor multi-company metrics, verify workspace performance sheets, inspect audit histories, and restore deleted records."}
          </p>
        </div>
        
        {/* Tab switchers */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs select-none font-bold border dark:border-zinc-800 shrink-0 max-w-full">
          <button
            onClick={() => { navigate("/admin?sub=dashboard"); setSelectedCompanyId(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "تحليلات عامة" : "Analytics Overview"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=companies"); setSelectedCompanyId(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "companies" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "تفاصيل الشركات" : "Companies Drill-down"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=users"); setSelectedCompanyId(null); setSearchQuery(""); setSelectedEmployeeId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "users" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "موافقات التسجيل" : "Approvals"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=employee-reports"); setSelectedCompanyId(null); setSearchQuery(""); setSelectedEmployeeId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "employee-reports" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "تقارير الموظفين" : "Employee Reports"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=deleted"); setSelectedCompanyId(null); setSearchQuery(""); setSelectedEmployeeId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "deleted" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "سلة المحذوفات" : "Deleted Items"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=audit"); setSelectedCompanyId(null); setSearchQuery(""); setSelectedEmployeeId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "audit" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "سجل النظام" : "System Audit"}
          </button>
        </div>
      </div>

      {/* SEARCH / FILTERS OVERLAY FOR SUBLISTS */}
      {activeTab !== "dashboard" && !selectedCompanyId && !selectedEmployeeId && (
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder={
              activeTab === "companies" ? (isAr ? "البحث عن الشركات..." : "Search companies...") :
              activeTab === "users" ? (isAr ? "البحث عن مستخدمي المنصة..." : "Search platform users...") :
              activeTab === "employee-reports" ? (isAr ? "البحث عن الموظفين..." : "Search employees...") :
              activeTab === "deleted" ? (isAr ? "البحث عن المهام المحذوفة..." : "Search deleted tasks...") : (isAr ? "البحث في السجلات التاريخية..." : "Search log history...")
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:text-white"
          />
          <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-2.5" />
        </div>
      )}

      {/* 2. MAIN PANELS */}

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "إجمالي الشركات" : "Total Companies"}
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white block mt-0.5 tracking-tight">{stats.totalCompanies}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-650 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "الموظفين النشطين" : "Active Employees"}
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white block mt-0.5 tracking-tight">{stats.totalEmployees}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "المهام النشطة" : "Active Tasks"}
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white block mt-0.5 tracking-tight">{stats.activeTasks}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "إنجازات اليوم" : "Completed Today"}
                </span>
                <span className="text-xl font-black text-green-600 dark:text-green-400 block mt-0.5 tracking-tight">{stats.completedToday}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "المهام المتأخرة" : "Delayed Tasks"}
                </span>
                <span className="text-xl font-black text-amber-500 block mt-0.5 tracking-tight">{stats.delayedTasks}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Tasks completed per employee */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col min-h-75 shadow-xs">
              <h3 className="text-xs font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{isAr ? "مخرجات مهام الموظفين" : "Employee Tasks Output"}</span>
              </h3>
              
              {isLoadingPerformance ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : performance.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">{isAr ? "لا توجد سجلات أداء." : "No performance records."}</div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {performance.map((p: any) => {
                    const total = p.assignedTasks || 1;
                    const compPercent = Math.min(Math.round((p.completed / total) * 100), 100);
                    
                    return (
                      <div key={p.userId} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-30">{p.fullName}</span>
                          <span className="font-semibold text-zinc-450">
                            {isAr 
                              ? `مكتمل ${p.completed} / إجمالي ${p.assignedTasks}`
                              : `${p.completed} Completed / ${p.assignedTasks} Total`}
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${compPercent}%` }}
                            title="Completed"
                          />
                          <div 
                            className="h-full bg-amber-500"
                            style={{ width: `${Math.min(Math.round((p.delayed / total) * 100), 100)}%` }}
                            title="Delayed"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 2: Average Completion Time per Employee */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col min-h-75 shadow-xs">
              <h3 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>{isAr ? "متوسط وقت الإنجاز (ساعات)" : "Average Completion Time (Hours)"}</span>
              </h3>

              {isLoadingPerformance ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {performance.map((p: any) => {
                    const maxHours = Math.max(...performance.map((u: any) => u.avgCompletionHours), 5);
                    const widthPercent = Math.min((p.avgCompletionHours / maxHours) * 100, 100);

                    return (
                      <div key={p.userId} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-zinc-800 dark:text-zinc-200">{p.fullName}</span>
                          <span className="text-purple-600 dark:text-purple-400">{p.avgCompletionHours}h</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 3: Companies Tasks breakdown */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col min-h-75 shadow-xs">
              <h3 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                <Building className="h-4 w-4 text-blue-500" />
                <span>{isAr ? "المهام حسب مساحة العمل / الشركة" : "Tasks by Company / Workspace"}</span>
              </h3>

              {isLoadingCompanies ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-650" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {companies.map((c: any) => {
                    const maxTasks = Math.max(...companies.map((x: any) => x.stats?.totalTasks), 1);
                    const percent = Math.min(((c.stats?.totalTasks || 0) / maxTasks) * 100, 100);

                    return (
                      <div key={c._id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-35">{c.name}</span>
                          <span className="font-semibold text-zinc-450">
                            {isAr ? `${c.stats?.totalTasks || 0} مهمة` : `${c.stats?.totalTasks || 0} Tasks`}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {activeTab === "companies" && (
        <div>
          {!selectedCompanyId ? (
            /* Multi-Company Listing Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingCompanies ? (
                <div className="col-span-3 flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-zinc-500 text-xs">{isAr ? "لا توجد مساحات عمل تطابق البحث." : "No workspaces match your query."}</div>
              ) : (
                filteredCompanies.map((ws: any) => (
                  <div 
                    key={ws._id} 
                    onClick={() => setSelectedCompanyId(ws._id)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3 mb-4 gap-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">{ws.name}</h3>
                          <p className="text-[10px] text-zinc-450 font-mono mt-0.5">slug: {ws.slug}</p>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/w/${ws._id}`)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            title={isAr ? "دخول وإدارة الشركة" : "Open Workspace"}
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>{isAr ? "دخول" : "Open"}</span>
                          </button>
                          <button
                            onClick={() => handleConfirmDeleteWorkspace(ws._id, ws.name)}
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            title={isAr ? "حذف الشركة بالكامل" : "Delete Workspace"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-xl border dark:border-zinc-800">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">{isAr ? "المتاجر" : "Clients"}</span>
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{ws.clients?.length || 0}</span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-xl border dark:border-zinc-800">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">{isAr ? "المهام" : "Tasks"}</span>
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{ws.stats?.totalTasks || 0}</span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-xl border dark:border-zinc-800">
                          <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wide block">{isAr ? "المتأخرة" : "Delayed"}</span>
                          <span className="text-sm font-black text-amber-500">{ws.stats?.delayedTasks || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t dark:border-zinc-800 pt-3">
                      <span>{isAr ? "تاريخ التسجيل: " : "Registered: "} {new Date(ws.createdAt).toLocaleDateString()}</span>
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Single Workspace inspection Drill-down Panel */
            selectedCompanyObj && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
                
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b dark:border-zinc-800 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedCompanyId(null)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>{selectedCompanyObj.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400 font-normal">({selectedCompanyObj.slug})</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{isAr ? "شاشة فحص وتدقيق الشركة" : "Workspace Inspection Sheet"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigate(`/w/${selectedCompanyObj._id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{isAr ? "دخول وإدارة الشركة" : "Open & Manage Company"}</span>
                    </button>

                    <button
                      onClick={() => handleConfirmDeleteWorkspace(selectedCompanyObj._id, selectedCompanyObj.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200/50 hover:bg-red-600 hover:text-white text-red-500 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{isAr ? "حذف الشركة نهائياً" : "Delete Workspace"}</span>
                    </button>

                    <span className="text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-lg">
                      {isAr ? "المالك: " : "Owner: "} {selectedCompanyObj.owner?.fullName || (isAr ? "غير معروف" : "Unknown")}
                    </span>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Client Projects List */}
                  <div className="md:col-span-1 border-r dark:border-zinc-800 pr-0 md:pr-6 space-y-4">
                    <h4 className="text-xs font-black uppercase text-zinc-455 dark:text-zinc-500 tracking-wider flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{isAr ? `ملفات متاجر العملاء (${selectedCompanyObj.clients?.length || 0})` : `Client Store Profiles (${selectedCompanyObj.clients?.length || 0})`}</span>
                    </h4>
                    
                    {selectedCompanyObj.clients?.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">{isAr ? "لا توجد متاجر مضافة." : "No stores configured."}</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedCompanyObj.clients.map((cli: any) => (
                          <div key={cli._id} className="p-3.5 bg-zinc-50 dark:bg-zinc-850/30 border dark:border-zinc-800 rounded-xl space-y-2">
                            <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">{cli.clientName}</span>
                            {cli.description && <p className="text-[11px] text-zinc-500 dark:text-zinc-450">{cli.description}</p>}
                            <div className="text-[10px] text-zinc-400 font-bold border-t dark:border-zinc-800 pt-2 flex justify-between">
                              <span>{isAr ? "الخدمات:" : "Services:"}</span>
                              <span className="text-purple-600">
                                {isAr 
                                  ? `${cli.services?.filter((s: any) => s.isChecked).length || 0} نشط` 
                                  : `${cli.services?.filter((s: any) => s.isChecked).length || 0} active`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Departments & Team members */}
                  <div className="md:col-span-1 border-r dark:border-zinc-800 pr-0 md:pr-6 space-y-4">
                    <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{isAr ? `الأقسام وفريق العمل (${selectedCompanyObj.members?.length || 0})` : `Spaces & Workspace Team (${selectedCompanyObj.members?.length || 0})`}</span>
                    </h4>

                    {/* Spaces allowed */}
                    <div className="space-y-2 mb-4">
                      <label className="text-[10px] font-bold uppercase text-zinc-400">{isAr ? "أقسام مساحة العمل" : "Department Spaces"}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCompanyObj.spaces?.map((sp: any) => (
                          <span key={sp._id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sp.color || "#7c3aed" }} />
                            {sp.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Members */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400">{isAr ? "أعضاء الفريق النشطين" : "Active Collaborators"}</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {selectedCompanyObj.members?.map((m: any) => {
                          const memberUserId = m.userId?._id || m.userId;
                          const isOwner = m.role === "owner";
                          return (
                            <div key={m._id} className="flex items-center justify-between gap-2 p-2 bg-zinc-50/50 dark:bg-zinc-850/20 rounded-xl border dark:border-zinc-800/80">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <img
                                  src={m.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                                  alt="Avatar"
                                  className="h-7 w-7 rounded-full bg-zinc-800 border shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-150 block truncate">{m.userId?.fullName || (isAr ? "مستخدم" : "User")}</span>
                                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate block">
                                    {m.userId?.email || ""}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isOwner ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {isAr ? "المنشئ / المالك" : "Owner"}
                                  </span>
                                ) : (
                                  <select
                                    value={m.role}
                                    onChange={(e) => {
                                      updateMemberRoleMutation.mutate({
                                        workspaceId: selectedCompanyObj._id,
                                        userId: memberUserId,
                                        role: e.target.value
                                      });
                                    }}
                                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold rounded-lg px-2 py-1 text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                                  >
                                    <option value="admin">{isAr ? "مدير (Admin)" : "Admin"}</option>
                                    <option value="manager">{isAr ? "مشرف (Manager)" : "Manager"}</option>
                                    <option value="member">{isAr ? "عضو (Member)" : "Member"}</option>
                                    <option value="guest">{isAr ? "زائر (Guest)" : "Guest"}</option>
                                  </select>
                                )}

                                {!isOwner && (
                                  <button
                                    onClick={() => {
                                      removeMemberMutation.mutate({
                                        workspaceId: selectedCompanyObj._id,
                                        userId: memberUserId
                                      });
                                    }}
                                    className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                    title={isAr ? "إزالة العضو من الشركة" : "Remove member from workspace"}
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Work timing statistics */}
                  <div className="md:col-span-1 space-y-4">
                    <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{isAr ? "ملخص أوقات العمل" : "Timing Summary Sheets"}</span>
                    </h4>

                    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-850/20 p-4 border dark:border-zinc-800 rounded-xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{isAr ? "المهام النشطة المسجلة" : "Active Tasks Logged"}</span>
                        <span className="font-black text-zinc-800 dark:text-zinc-200">{selectedCompanyObj.stats?.totalTasks} {isAr ? "مهمة" : "Tasks"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{isAr ? "المهام المتراكمة قيد العمل" : "Uncompleted backlog"}</span>
                        <span className="font-black text-indigo-500">{selectedCompanyObj.stats?.activeTasks} {isAr ? "معلقة" : "Pending"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{isAr ? "المهام المتجاوزة للمدة" : "Overdue timelines"}</span>
                        <span className="font-black text-amber-500">{selectedCompanyObj.stats?.delayedTasks} {isAr ? "متأخرة" : "Overdue"}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">{isAr ? "لم يتم العثور على موظفين." : "No users found."}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold">
                    <th className="p-4">{isAr ? "الموظف" : "User"}</th>
                    <th className="p-4">{isAr ? "الحالة" : "Status"}</th>
                    <th className="p-4">{isAr ? "التحقق" : "Verification"}</th>
                    <th className="p-4">{isAr ? "تاريخ التسجيل" : "Registered On"}</th>
                    <th className="p-4 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                  {filteredUsers.map((u: any) => (
                    <tr key={u._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/15">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt={u.fullName}
                            className="h-8 w-8 rounded-full border bg-zinc-800"
                          />
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{u.fullName}</p>
                            <p className="text-[10px] text-zinc-455">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200/20">
                            <CheckCircle className="h-3 w-3" />
                            {isAr ? "معتمد" : "Approved"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {isAr ? "بانتظار الموافقة" : "Pending Approval"}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.isVerified ? (
                          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">{isAr ? "متحقق" : "Verified"}</span>
                        ) : (
                          <span className="text-zinc-400">{isAr ? "غير متحقق" : "Unverified"}</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-1.5">
                        {/* Reset Password Button */}
                        <button
                          onClick={() => setSelectedUserForReset(u)}
                          className="px-2.5 py-1.5 rounded-lg border border-purple-200/50 hover:bg-purple-600 hover:text-white dark:border-purple-800/40 text-purple-600 dark:text-purple-400 font-bold transition-all text-[11px] cursor-pointer"
                        >
                          {isAr ? "كلمة المرور" : "Password"}
                        </button>

                        {/* Super Admin Toggle Button */}
                        {u.isSystemAdmin ? (
                          <button
                            onClick={() => toggleSystemAdminMutation.mutate({ userId: u._id, isSystemAdmin: false })}
                            disabled={toggleSystemAdminMutation.isPending}
                            className="px-2 py-1.5 rounded-lg bg-purple-500/15 hover:bg-red-500/20 text-[#843ec0] dark:text-[#b57ede] hover:text-red-500 font-bold transition-all text-[11px] cursor-pointer flex items-center gap-1"
                            title={isAr ? "إلغاء صلاحية المشرف العام" : "Demote from Super Admin"}
                          >
                            <Shield className="h-3 w-3" />
                            <span>{isAr ? "مشرف عام" : "Super Admin"}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleSystemAdminMutation.mutate({ userId: u._id, isSystemAdmin: true })}
                            disabled={toggleSystemAdminMutation.isPending}
                            className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-purple-500 text-zinc-500 hover:text-purple-600 font-semibold transition-all text-[11px] cursor-pointer"
                            title={isAr ? "ترقية إلى مشرف عام" : "Promote to Super Admin"}
                          >
                            + {isAr ? "ترقية لمشرف" : "Make Admin"}
                          </button>
                        )}

                        {/* Account Approval / Suspend */}
                        {u.isApproved ? (
                          <button
                            onClick={() => suspendUserMutation.mutate(u._id)}
                            disabled={suspendUserMutation.isPending}
                            className="px-2.5 py-1.5 rounded-lg border border-amber-200/50 hover:bg-amber-500 hover:text-white text-amber-500 font-bold transition-all text-[11px] cursor-pointer"
                          >
                            {isAr ? "تعليق" : "Suspend"}
                          </button>
                        ) : (
                          <button
                            onClick={() => approveUserMutation.mutate(u._id)}
                            disabled={approveUserMutation.isPending}
                            className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all text-[11px] shadow-sm cursor-pointer"
                          >
                            {isAr ? "تأكيد" : "Approve"}
                          </button>
                        )}

                        {/* Delete User Permanently */}
                        <button
                          onClick={() => handleConfirmDeleteUser(u._id, u.fullName)}
                          disabled={deleteUserMutation.isPending}
                          className="p-1.5 rounded-lg border border-red-200/50 hover:bg-red-600 text-red-500 hover:text-white transition-all cursor-pointer shrink-0"
                          title={isAr ? "حذف المستخدم نهائياً من المنصة" : "Delete user permanently"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "deleted" && (
        <div className="space-y-4">
          {/* Top Company Filter Bar & Summary */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                  {isAr ? "سلة المحذوفات واستعادة المهام" : "Deleted Tasks & Recycle Bin"}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                  {deletedTasks.length} {isAr ? "مهمة محذوفة" : "deleted"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAr ? "يمكنك فحص كافة تفاصيل أي مهمة قبل اتخاذ قرار استعادتها أو حذفها نهائياً." : "Inspect full task contents before choosing to restore or permanently purge."}
              </p>
            </div>

            {/* Company Filter Pills */}
            <div className="border-t dark:border-zinc-800/80 pt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 shrink-0">
                <Building2 className="h-3.5 w-3.5 text-purple-500" />
                <span>{isAr ? "الشركة:" : "Company:"}</span>
              </span>

              <button
                onClick={() => setSelectedDeletedCompanyId("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDeletedCompanyId === "all"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {isAr ? "جميع الشركات" : "All Companies"}
              </button>

              {companies.map((c: any) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedDeletedCompanyId(c._id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDeletedCompanyId === c._id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Building className="h-3 w-3 opacity-70" />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            {isLoadingDeleted ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
              </div>
            ) : filteredDeleted.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Trash2 className="h-8 w-8 text-zinc-400 mx-auto opacity-50" />
                <p className="text-zinc-500 text-xs font-semibold">
                  {isAr ? "سلة المحذوفات فارغة (لا توجد عناصر محذوفة مطابقة)." : "No deleted tasks found matching your filter."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold bg-zinc-50/50 dark:bg-zinc-850/40">
                      <th className="p-4">{isAr ? "المهمة والتفاصيل" : "Task & Context"}</th>
                      <th className="p-4">{isAr ? "الشركة والقسم" : "Company & Space"}</th>
                      <th className="p-4">{isAr ? "الحالة والأولوية" : "Status & Priority"}</th>
                      <th className="p-4">{isAr ? "المكلفون" : "Assignees"}</th>
                      <th className="p-4">{isAr ? "حذف بواسطة وتاريخه" : "Deleted By & Date"}</th>
                      <th className="p-4 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                    {filteredDeleted.map((task: any) => {
                      const statusMeta = STATUS_META[task.status?.toLowerCase()] || {
                        ar: task.status || "قيد الانتظار",
                        en: task.status || "To Do",
                        bg: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
                      };
                      const priorityMeta = PRIORITY_META[task.priority?.toLowerCase()] || {
                        ar: task.priority || "متوسطة",
                        en: task.priority || "Medium",
                        bg: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
                      };
                      const assigneesList = Array.isArray(task.assignees) ? task.assignees : [];

                      return (
                        <tr key={task._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                          {/* Task Name & Snippet */}
                          <td className="p-4 max-w-xs">
                            <div className="space-y-1">
                              <p className="font-bold text-zinc-900 dark:text-white text-xs truncate" title={task.title}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-[11px] text-zinc-400 line-clamp-1 truncate" title={task.description}>
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {task.listId?.name && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-semibold">
                                    📋 {task.listId.name}
                                  </span>
                                )}
                                {task.checklist && task.checklist.length > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-semibold border border-purple-500/20">
                                    ☑ {task.checklist.filter((i: any) => i.isCompleted).length}/{task.checklist.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Company & Department */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-bold">
                                <Building className="h-3 w-3 text-purple-500 shrink-0" />
                                <span>{task.workspaceId?.name || task.workspaceId?.slug || "-"}</span>
                              </div>
                              {task.spaceId?.name && (
                                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: task.spaceId.color || "#8b5cf6" }}
                                  />
                                  <span>{task.spaceId.name}</span>
                                </div>
                              )}
                              {task.clientProjectId?.clientName && (
                                <p className="text-[10px] text-zinc-500 font-medium">
                                  💼 {task.clientProjectId.clientName}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Status & Priority */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.bg}`}>
                                {isAr ? statusMeta.ar : statusMeta.en}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityMeta.bg}`}>
                                {isAr ? priorityMeta.ar : priorityMeta.en}
                              </span>
                            </div>
                          </td>

                          {/* Assignees */}
                          <td className="p-4">
                            {assigneesList.length === 0 ? (
                              <span className="text-[11px] text-zinc-400 italic">{isAr ? "غير معين" : "Unassigned"}</span>
                            ) : (
                              <div className="flex items-center -space-x-1.5 rtl:space-x-reverse">
                                {assigneesList.slice(0, 3).map((a: any, idx: number) => (
                                  <img
                                    key={a._id || idx}
                                    src={a.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                                    alt={a.fullName}
                                    title={a.fullName}
                                    className="h-6 w-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-800 shrink-0 object-cover"
                                  />
                                ))}
                                {assigneesList.length > 3 && (
                                  <span className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                    +{assigneesList.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Deletion Info */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img
                                src={task.deletedBy?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                                alt="deletedBy avatar"
                                className="h-6 w-6 rounded-full border bg-zinc-850 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                                  {task.deletedBy?.fullName || (isAr ? "مدير النظام" : "System")}
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  {task.deletedAt ? formatArabicDate(task.deletedAt, isAr) : "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect Details Button */}
                              <button
                                onClick={() => setInspectDeletedTask(task)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[11px] transition-all cursor-pointer border dark:border-zinc-700"
                                title={isAr ? "فحص ومعاينة تفاصيل المهمة قبل الاستعادة" : "Inspect full task contents"}
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                <span>{isAr ? "تفاصيل المهمة" : "Inspect"}</span>
                              </button>

                              {/* Restore Button */}
                              <button
                                onClick={() => restoreTaskMutation.mutate(task._id)}
                                disabled={restoreTaskMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer"
                                title={isAr ? "استعادة المهمة إلى مساحة العمل" : "Restore task"}
                              >
                                <RefreshCw className="h-3 w-3 shrink-0" />
                                <span>{isAr ? "استعادة" : "Restore"}</span>
                              </button>

                              {/* Permanent Delete Button */}
                              <button
                                onClick={() => handleConfirmPermanentDeleteTask(task._id, task.title)}
                                disabled={permanentlyDeleteTaskMutation.isPending}
                                className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-600 text-red-500 hover:text-white transition-all cursor-pointer shrink-0"
                                title={isAr ? "حذف نهائي للأبد من قاعدة البيانات" : "Permanently delete"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-4">
          {/* Header & Filter Controls Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                  {isAr ? "سجل الأحداث والتدقيق للشركات" : "System Audit & Activity Logs"}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {globalActivities.length} {isAr ? "سجل محفوظ" : "logs"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-450 bg-zinc-50 dark:bg-zinc-850 px-2.5 py-0.5 rounded-md border dark:border-zinc-800">
                {isAr ? "سجلات غير قابلة للتعديل" : "Immutable Records"}
              </span>
            </div>

            {/* 1. Company Filter Pills (Isolating per company) */}
            <div className="border-t dark:border-zinc-800/80 pt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 shrink-0">
                <Building2 className="h-3.5 w-3.5 text-purple-500" />
                <span>{isAr ? "عرض سجل شركة:" : "Company Logs:"}</span>
              </span>

              <button
                onClick={() => setSelectedAuditCompanyId("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedAuditCompanyId === "all"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {isAr ? "جميع الشركات" : "All Companies"}
              </button>

              {companies.map((c: any) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedAuditCompanyId(c._id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedAuditCompanyId === c._id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Building className="h-3 w-3 opacity-70" />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            {/* 2. Action Filter Pills */}
            <div className="border-t dark:border-zinc-800/80 pt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 shrink-0">
                <SlidersHorizontal className="h-3 w-3 text-zinc-400" />
                <span>{isAr ? "نوع العملية:" : "Action:"}</span>
              </span>

              {[
                { id: "all", labelAr: "الكل", labelEn: "All" },
                { id: "created", labelAr: "✨ إنشاء", labelEn: "Created" },
                { id: "updated", labelAr: "✏️ تعديل", labelEn: "Updated" },
                { id: "deleted", labelAr: "🗑️ حذف", labelEn: "Deleted" },
                { id: "restored", labelAr: "🔄 استعادة", labelEn: "Restored" },
                { id: "moved", labelAr: "➡️ نقل", labelEn: "Moved" },
              ].map((actFilter) => (
                <button
                  key={actFilter.id}
                  onClick={() => setSelectedAuditAction(actFilter.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    selectedAuditAction === actFilter.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {isAr ? actFilter.labelAr : actFilter.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Stream Feed */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            {isLoadingAudit ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
              </div>
            ) : filteredAudit.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Activity className="h-8 w-8 text-zinc-400 mx-auto opacity-50" />
                <p className="text-zinc-500 text-xs font-semibold">
                  {isAr ? "لا توجد سجلات تدقيق تطابق الفلتر الحالي." : "No audit logs found matching your filter."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-850 max-h-162.5 overflow-y-auto custom-scrollbar">
                {filteredAudit.map((act: any) => {
                  const actionMeta = ACTION_META[act.action?.toLowerCase()] || {
                    ar: act.action || "عملية",
                    en: act.action || "Action",
                    bg: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
                  };
                  
                  const changes = act.details?.changes || {};
                  const changeKeys = Object.keys(changes);
                  const isCreated = act.action === "created";
                  const isDeleted = act.action === "deleted";
                  const isRestored = act.action === "restored";
                  const companyName = act.workspaceId?.name || act.workspaceId?.slug;

                  return (
                    <div
                      key={act._id}
                      className="p-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-850/25 transition-colors space-y-3 text-xs"
                    >
                      {/* Top Row: Actor, Action badge, Company badge, Timestamp */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={act.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt="actor avatar"
                            className="h-7 w-7 rounded-full bg-zinc-850 border border-zinc-200 dark:border-zinc-700 shrink-0 object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900 dark:text-white">
                                {act.userId?.fullName || (isAr ? "مدير النظام" : "System Actor")}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionMeta.bg}`}>
                                {isAr ? actionMeta.ar : actionMeta.en}
                              </span>
                              {companyName && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                  <Building className="h-2.5 w-2.5" />
                                  <span>{companyName}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400">
                              {act.userId?.email || ""}
                            </p>
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3 opacity-60" />
                          <span>{formatArabicDate(act.createdAt, isAr)}</span>
                        </div>
                      </div>

                      {/* Content Card / Structured Breakdown */}
                      <div className="mr-9 ml-2 p-3 bg-zinc-50/80 dark:bg-zinc-850/35 border border-zinc-200/70 dark:border-zinc-800 rounded-xl space-y-2">
                        {/* Title Reference */}
                        <div className="flex items-center gap-2 flex-wrap text-zinc-800 dark:text-zinc-200">
                          <span className="text-zinc-400 font-semibold">{isAr ? "العنصر المتأثر:" : "Target:"}</span>
                          <span className="font-bold text-zinc-900 dark:text-white bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            {act.entityType === "task" ? (isAr ? "مهمة" : "Task") : act.entityType}: "{act.details?.title || act.entityTitle || (isAr ? "بدون عنوان" : "Untitled")}"
                          </span>
                        </div>

                        {/* Case 1: Created Task Summary */}
                        {isCreated && (
                          <div className="pt-1 space-y-2">
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>{isAr ? "تم إنشاء المهمة بنجاح بالخصائص الأولية التالية:" : "Task created with the following attributes:"}</span>
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {changeKeys.map((key) => {
                                const item = changes[key] || {};
                                const val = item.new || item;
                                if (!val) return null;
                                return (
                                  <div
                                    key={key}
                                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 text-[11px]"
                                  >
                                    <span className="text-zinc-400 font-semibold">{formatKeyName(key, isAr)}:</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{formatAuditValue(key, val, isAr)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Case 2: Updated Task Detailed Diffs */}
                        {!isCreated && !isDeleted && !isRestored && changeKeys.length > 0 && (
                          <div className="pt-1 space-y-1.5">
                            <p className="text-[11px] text-zinc-400 font-bold">
                              {isAr ? "التعديلات التي تمت على البيانات:" : "Modifications made:"}
                            </p>
                            <div className="space-y-1.5">
                              {changeKeys.map((key) => {
                                const item = changes[key] || {};
                                const oldText = formatAuditValue(key, item.old, isAr);
                                const newText = formatAuditValue(key, item.new, isAr);
                                return (
                                  <div
                                    key={key}
                                    className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-750 flex items-center justify-between gap-3 flex-wrap text-[11px]"
                                  >
                                    <span className="font-bold text-purple-600 dark:text-purple-400 min-w-24">
                                      {formatKeyName(key, isAr)}
                                    </span>
                                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 line-through">
                                        {oldText}
                                      </span>
                                      <ArrowRight className="h-3 w-3 text-zinc-400 rtl:rotate-180 shrink-0" />
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                        {newText}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Case 3: Deleted Task */}
                        {isDeleted && (
                          <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{isAr ? "تم نقل هذا العنصر إلى سلة المحذوفات بواسطة المستخدم." : "Item moved to trash."}</span>
                          </p>
                        )}

                        {/* Case 4: Restored Task */}
                        {isRestored && (
                          <p className="text-[11px] text-purple-400 font-semibold flex items-center gap-1">
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>{isAr ? "تمت استعادة هذا العنصر بنجاح إلى مساحة العمل النشطة." : "Item restored to active workspace."}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "employee-reports" && (
        <div className="space-y-6">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              /* Hide all components except the print section */
              .no-print,
              button,
              input,
              select,
              aside,
              header,
              .tab-switchers {
                display: none !important;
              }
              /* Make print section full width and visible */
              .print-section {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                padding: 10px !important;
                margin: 0 !important;
              }
              .print-grid {
                display: grid !important;
                grid-template-cols: 1fr 1fr !important;
                gap: 20px !important;
              }
              .print-card {
                border: 1px solid #e4e4e7 !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
              }
              .text-white {
                color: black !important;
              }
              .bg-zinc-900, .dark\\:bg-zinc-900 {
                background: white !important;
              }
              .border-zinc-800, .dark\\:border-zinc-800 {
                border-color: #e4e4e7 !important;
              }
              .text-zinc-400, .text-zinc-500 {
                color: #71717a !important;
              }
              .text-zinc-900, .dark\\:text-white {
                color: black !important;
              }
            }
          `}} />

          {!selectedEmployeeId ? (
            /* 1. List of Employees */
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-xs">
                  {isAr ? "لم يتم العثور على موظفين." : "No employees found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold">
                        <th className="p-4">{isAr ? "الموظف" : "Employee"}</th>
                        <th className="p-4">{isAr ? "تاريخ التسجيل" : "Registered On"}</th>
                        <th className="p-4">{isAr ? "حالة الحساب" : "Account Status"}</th>
                        <th className="p-4 text-right">{isAr ? "تقرير الأنشطة" : "Activity Report"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                      {filteredUsers.map((u: any) => (
                        <tr key={u._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/15">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                                alt={u.fullName}
                                className="h-8 w-8 rounded-full border bg-zinc-800"
                              />
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-white">{u.fullName}</p>
                                <p className="text-[10px] text-zinc-455">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-400 font-medium">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            {u.isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200/20">
                                <CheckCircle className="h-3 w-3" />
                                {isAr ? "نشط" : "Active"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {isAr ? "قيد الانتظار" : "Pending"}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedEmployeeId(u._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>{isAr ? "عرض التقرير" : "View Report"}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* 2. Employee Report Drill-down */
            <div className="space-y-6 print-section">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-4 no-print text-start">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedEmployeeId(null)}
                    className="p-2 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                  >
                    {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                  </button>
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {isAr ? "تقرير متابعة الموظف" : "Employee Tracking Sheet"}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isAr ? "مراقبة وتحليل أداء وأنشطة الموظف في النظام" : "Analyze employee performance & logs"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Timeframe switcher */}
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold border dark:border-zinc-800 shrink-0">
                    <button
                      onClick={() => setSelectedTimeframe("today")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedTimeframe === "today" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      {isAr ? "اليوم" : "Today"}
                    </button>
                    <button
                      onClick={() => setSelectedTimeframe("week")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedTimeframe === "week" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      {isAr ? "الأسبوع" : "Week"}
                    </button>
                    <button
                      onClick={() => setSelectedTimeframe("month")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedTimeframe === "month" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      {isAr ? "الشهر" : "Month"}
                    </button>
                  </div>

                  {/* Print Button */}
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>{isAr ? "تصدير PDF / طباعة" : "Export PDF / Print"}</span>
                  </button>
                </div>
              </div>

              {/* Printable Header (Visible only in print) */}
              <div className="hidden print:block border-b-2 border-zinc-200 pb-4 mb-6 text-start">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-extrabold text-black">
                      {isAr ? "تقرير نشاط الموظف" : "Employee Activity Report"}
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">
                      {isAr ? "منصة إدارة العمل والإنتاجية - عرب برو" : "Taskflow Productivity Platform"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <p>{isAr ? "تاريخ إصدار التقرير: " : "Report Date: "} {new Date().toLocaleString()}</p>
                    <p className="capitalize">{isAr ? "الفترة المحددة: " : "Selected Period: "} {isAr ? (selectedTimeframe === "today" ? "اليوم" : selectedTimeframe === "week" ? "هذا الأسبوع" : "هذا الشهر") : selectedTimeframe}</p>
                  </div>
                </div>
              </div>

              {isLoadingReport ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
                </div>
              ) : !employeeReport ? (
                <div className="text-center py-16 text-zinc-500 text-xs">
                  {isAr ? "فشل تحميل تقرير الموظف." : "Failed to load employee report."}
                </div>
              ) : (
                <div className="space-y-6 text-start">
                  
                  {/* User details card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 print-card">
                    <img
                      src={employeeReport.user.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                      alt={employeeReport.user.fullName}
                      className="h-14 w-14 rounded-full border bg-zinc-800"
                    />
                    <div>
                      <h4 className="font-extrabold text-base text-zinc-900 dark:text-white">
                        {employeeReport.user.fullName}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{employeeReport.user.email}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {isAr ? "تاريخ الانضمام: " : "Joined On: "} {new Date(employeeReport.user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* KPIs Stats Scorecard */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs print-card">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                        {isAr ? "المهام المسندة في الفترة" : "Tasks Assigned in Period"}
                      </span>
                      <span className="text-2xl font-black text-zinc-900 dark:text-white block mt-1 tracking-tight">
                        {employeeReport.stats.assignedTasksCount}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs print-card">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                        {isAr ? "المهام المكتملة في الفترة" : "Tasks Completed in Period"}
                      </span>
                      <span className="text-2xl font-black text-green-600 dark:text-green-400 block mt-1 tracking-tight">
                        {employeeReport.stats.completedTasksCount}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs print-card">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                        {isAr ? "نسبة إنجاز المهام" : "Completion Rate"}
                      </span>
                      <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block mt-1 tracking-tight">
                        {employeeReport.stats.assignedTasksCount > 0 
                          ? `${Math.round((employeeReport.stats.completedTasksCount / employeeReport.stats.assignedTasksCount) * 100)}%`
                          : "0%"}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs print-card">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                        {isAr ? "العمليات المسجلة بالنظام" : "System Actions Recorded"}
                      </span>
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block mt-1 tracking-tight">
                        {employeeReport.stats.activitiesCount}
                      </span>
                    </div>
                  </div>

                  {/* Main Details grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-grid">
                    
                    {/* Left Column: Activity Timeline */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col print-card">
                      <h3 className="text-xs font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        <span>{isAr ? "سجل العمليات التاريخي خلال الفترة" : "Activity Timeline"}</span>
                      </h3>

                      {employeeReport.activities.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 text-xs italic">
                          {isAr ? "لا توجد عمليات مسجلة للموظف في هذه الفترة." : "No operations recorded during this timeframe."}
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-120 overflow-y-auto pr-1 custom-scrollbar">
                          {employeeReport.activities.map((act: any) => {
                            const dateStr = new Date(act.createdAt).toLocaleDateString();
                            const timeStr = new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            
                            // Humanize operations
                            let actionLabel = act.action;
                            let actionColor = "bg-zinc-100 text-zinc-650";
                            if (act.action === "created") {
                              actionLabel = isAr ? "إنشاء" : "Create";
                              actionColor = "bg-green-500/10 text-green-600";
                            } else if (act.action === "updated") {
                              actionLabel = isAr ? "تعديل" : "Update";
                              actionColor = "bg-blue-500/10 text-blue-600";
                            } else if (act.action === "deleted") {
                              actionLabel = isAr ? "حذف" : "Delete";
                              actionColor = "bg-red-500/10 text-red-600";
                            } else if (act.action === "moved") {
                              actionLabel = isAr ? "نقل" : "Move";
                              actionColor = "bg-amber-500/10 text-amber-600";
                            }

                            let titleText = act.details?.title || act.entityType;

                            return (
                              <div key={act._id} className="flex gap-3 text-xs items-start border-b dark:border-zinc-800/40 pb-3 last:border-b-0">
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${actionColor}`}>
                                  {actionLabel}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-zinc-800 dark:text-zinc-200 font-semibold truncate">
                                    {isAr ? `تعديل على ${act.entityType}:` : `Action on ${act.entityType}:`} <span className="font-bold text-zinc-950 dark:text-white">"{titleText}"</span>
                                  </p>
                                  {act.workspaceId?.name && (
                                    <p className="text-[10px] text-zinc-455 font-bold mt-0.5">
                                      {isAr ? "مساحة العمل: " : "Workspace: "} {act.workspaceId.name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-[9px] text-zinc-400 shrink-0 font-medium">
                                  <p>{dateStr}</p>
                                  <p>{timeStr}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Assigned Tasks */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col print-card">
                      <h3 className="text-xs font-black uppercase text-zinc-455 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                        <Layers className="h-4 w-4 text-blue-500" />
                        <span>{isAr ? "المهام المكلف بها حالياً أو المنجزة" : "Assigned Task List"}</span>
                      </h3>

                      {employeeReport.tasks.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400 text-xs italic">
                          {isAr ? "لا توجد مهام مكلف بها الموظف حالياً." : "No tasks assigned to this employee."}
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-120 overflow-y-auto pr-1 custom-scrollbar">
                          {employeeReport.tasks.map((task: any) => {
                            let priorityColor = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
                            if (task.priority === "urgent") priorityColor = "bg-red-500/10 text-red-600";
                            else if (task.priority === "high") priorityColor = "bg-amber-500/10 text-amber-600";
                            else if (task.priority === "medium") priorityColor = "bg-purple-500/10 text-purple-600";

                            return (
                              <div key={task._id} className="p-3 bg-zinc-50/50 dark:bg-zinc-850/20 border border-zinc-150/40 dark:border-zinc-800/80 rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between items-start gap-3">
                                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs block truncate flex-1 text-start">
                                    {task.title}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                    {task.status}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-zinc-455 font-bold border-t dark:border-zinc-800 pt-2">
                                  <div className="flex gap-2 items-center">
                                    <span className="text-zinc-400">{isAr ? "الشركة:" : "Workspace:"}</span>
                                    <span className="text-zinc-700 dark:text-zinc-300 font-mono">{task.workspaceName}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${priorityColor}`}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* Admin Reset Password Modal */}
      {selectedUserForReset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-start relative">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {isAr ? "إعادة تعيين كلمة مرور المستخدم" : "Reset User Password"}
              </h2>
              <button
                onClick={() => setSelectedUserForReset(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-150 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!adminNewPassword.trim()) return;
                adminChangeUserPasswordMutation.mutate({
                  userId: selectedUserForReset._id,
                  newPassword: adminNewPassword,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isAr 
                    ? `أدخل كلمة المرور الجديدة للمستخدم: ${selectedUserForReset.fullName} (${selectedUserForReset.email})` 
                    : `Enter a new password for: ${selectedUserForReset.fullName} (${selectedUserForReset.email})`}
                </p>
                <input
                  type="password"
                  required
                  placeholder={isAr ? "كلمة المرور الجديدة" : "New password"}
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2.5 px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 font-semibold"
                />
              </div>
              
              <div className="flex gap-2 justify-end border-t dark:border-zinc-800 pt-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForReset(null);
                    setAdminNewPassword("");
                  }}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={adminChangeUserPasswordMutation.isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {adminChangeUserPasswordMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isAr ? "إعادة تعيين" : "Reset Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Deleted Task Modal */}
      {inspectDeletedTask && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in animate-duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col text-start relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-850/30">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                    {isAr ? "فحص ومعاينة المهمة المحذوفة" : "Deleted Task Detailed Inspection"}
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isAr ? "راجع محتوى المهمة وهيكلها التنظيمي لتحديد قرار الاستعادة أو الحذف النهائي." : "Inspect full task contents and context before deciding to restore or purge."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectDeletedTask(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs">
              
              {/* Deletion Alert Banner */}
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-red-600 dark:text-red-400 text-xs">
                  <p className="font-bold">
                    {isAr ? "بيانات الحذف المسجلة:" : "Deletion Record:"}
                  </p>
                  <p className="text-[11px] opacity-90">
                    {isAr
                      ? `تم حذف هذه المهمة بتاريخ ${formatArabicDate(inspectDeletedTask.deletedAt, isAr)} بواسطة "${inspectDeletedTask.deletedBy?.fullName || "مدير النظام"}" (${inspectDeletedTask.deletedBy?.email || "-"})`
                      : `Deleted on ${formatArabicDate(inspectDeletedTask.deletedAt, isAr)} by "${inspectDeletedTask.deletedBy?.fullName || "System"}" (${inspectDeletedTask.deletedBy?.email || "-"})`}
                  </p>
                </div>
              </div>

              {/* Task Title & Status Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-snug">
                    {inspectDeletedTask.title}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(() => {
                      const sm = STATUS_META[inspectDeletedTask.status?.toLowerCase()] || { ar: inspectDeletedTask.status || "قيد الانتظار", en: inspectDeletedTask.status || "To Do", bg: "bg-blue-500/10 text-blue-400 border border-blue-500/25" };
                      const pm = PRIORITY_META[inspectDeletedTask.priority?.toLowerCase()] || { ar: inspectDeletedTask.priority || "متوسطة", en: inspectDeletedTask.priority || "Medium", bg: "bg-blue-500/15 text-blue-400 border border-blue-500/30" };
                      return (
                        <>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${sm.bg}`}>
                            {isAr ? sm.ar : sm.en}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${pm.bg}`}>
                            {isAr ? pm.ar : pm.en}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Task Full Description */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-500" />
                  <span>{isAr ? "الوصف ومحتوى المهمة:" : "Task Description & Content:"}</span>
                </h4>
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 rounded-xl leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans text-xs min-h-16">
                  {inspectDeletedTask.description ? (
                    inspectDeletedTask.description
                  ) : (
                    <span className="text-zinc-400 italic">
                      {isAr ? "لا يوجد نص تفصيلي لوصف هذه المهمة." : "No description provided for this task."}
                    </span>
                  )}
                </div>
              </div>

              {/* Organizational Location Breakdown */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  <span>{isAr ? "الموقع التنظيمي والشركة:" : "Organizational Context:"}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold">{isAr ? "الشركة / مساحة العمل:" : "Workspace / Company:"}</span>
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Building className="h-3.5 w-3.5 text-purple-500" />
                      <span>{inspectDeletedTask.workspaceId?.name || inspectDeletedTask.workspaceId?.slug || "-"}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold">{isAr ? "القسم / المساحة:" : "Department / Space:"}</span>
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                      {inspectDeletedTask.spaceId?.color && (
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: inspectDeletedTask.spaceId.color }} />
                      )}
                      <span>{inspectDeletedTask.spaceId?.name || (isAr ? "عام" : "General")}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold">{isAr ? "المرحلة / قائمة المهام:" : "List / Stage:"}</span>
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Layers className="h-3.5 w-3.5 text-amber-500" />
                      <span>{inspectDeletedTask.listId?.name || "-"}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold">{isAr ? "مشروع العميل:" : "Client Project:"}</span>
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{inspectDeletedTask.clientProjectId?.clientName || inspectDeletedTask.projectName || "-"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignees & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Assignees */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{isAr ? "المكلفون بالعمل:" : "Assigned Team:"}</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200/80 dark:border-zinc-800 min-h-14">
                    {Array.isArray(inspectDeletedTask.assignees) && inspectDeletedTask.assignees.length > 0 ? (
                      <div className="space-y-2">
                        {inspectDeletedTask.assignees.map((a: any, idx: number) => (
                          <div key={a._id || idx} className="flex items-center gap-2">
                            <img
                              src={a.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                              alt={a.fullName}
                              className="h-6 w-6 rounded-full border bg-zinc-800 shrink-0 object-cover"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs truncate">{a.fullName}</p>
                              <p className="text-[10px] text-zinc-400 truncate">{a.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[11px]">{isAr ? "لا يوجد مكلفين محددين." : "No assignees assigned."}</span>
                    )}
                  </div>
                </div>

                {/* Dates & Reporter */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                    <span>{isAr ? "التواريخ والمنشئ:" : "Dates & Reporter:"}</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{isAr ? "تاريخ الاستحقاق:" : "Due Date:"}</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatArabicDate(inspectDeletedTask.dueDate, isAr)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{isAr ? "تاريخ البدء:" : "Start Date:"}</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatArabicDate(inspectDeletedTask.startDate, isAr)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{isAr ? "تاريخ الإنشاء:" : "Created At:"}</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatArabicDate(inspectDeletedTask.createdAt, isAr)}</span>
                    </div>
                    {inspectDeletedTask.reporterId?.fullName && (
                      <div className="flex justify-between pt-1 border-t dark:border-zinc-800">
                        <span className="text-zinc-400">{isAr ? "أنشئت بواسطة:" : "Reported By:"}</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{inspectDeletedTask.reporterId.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtasks / Checklist if any */}
              {Array.isArray(inspectDeletedTask.checklist) && inspectDeletedTask.checklist.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{isAr ? "قائمة المهام الفرعية والفحص:" : "Checklist Items:"}</span>
                    <span className="text-[10px] text-zinc-500">
                      ({inspectDeletedTask.checklist.filter((i: any) => i.isCompleted).length}/{inspectDeletedTask.checklist.length})
                    </span>
                  </h4>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
                    {inspectDeletedTask.checklist.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span
                          className={`h-4 w-4 rounded-md flex items-center justify-center border text-[10px] ${
                            item.isCompleted
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "border-zinc-400 dark:border-zinc-600 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <span className={item.isCompleted ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-200 font-medium"}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes if any */}
              {inspectDeletedTask.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-amber-500" />
                    <span>{isAr ? "ملاحظات إضافية:" : "Additional Notes:"}</span>
                  </h4>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                    {inspectDeletedTask.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-850/30 flex-wrap">
              <button
                type="button"
                onClick={() => setInspectDeletedTask(null)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>

              <div className="flex items-center gap-2">
                {/* Permanent Delete Button */}
                <button
                  type="button"
                  onClick={() => handleConfirmPermanentDeleteTask(inspectDeletedTask._id, inspectDeletedTask.title)}
                  disabled={permanentlyDeleteTaskMutation.isPending}
                  className="px-3.5 py-2 rounded-xl border border-red-500/30 hover:bg-red-600 text-red-500 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{isAr ? "حذف نهائي للأبد" : "Permanently Delete"}</span>
                </button>

                {/* Restore Task Button */}
                <button
                  type="button"
                  onClick={() => restoreTaskMutation.mutate(inspectDeletedTask._id)}
                  disabled={restoreTaskMutation.isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {restoreTaskMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{isAr ? "استعادة المهمة إلى مساحة العمل" : "Restore Task to Workspace"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
