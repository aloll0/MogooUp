import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { taskflowService } from "../services/taskflowService";
import type { Task } from "../services/taskflowService";
import { useToastStore } from "../stores/useToastStore";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";

const DashboardTab = lazy(() => import("../components/DashboardTab").then(m => ({ default: m.DashboardTab })));
const ReportsTab = lazy(() => import("../components/ReportsTab").then(m => ({ default: m.ReportsTab })));
const GanttTab = lazy(() => import("../components/GanttTab").then(m => ({ default: m.GanttTab })));
const CalendarTab = lazy(() => import("../components/CalendarTab").then(m => ({ default: m.CalendarTab })));
const GoalsTab = lazy(() => import("../components/GoalsTab").then(m => ({ default: m.GoalsTab })));
const AdminPanel = lazy(() => import("../components/AdminPanel").then(m => ({ default: m.AdminPanel })));
const ClientProjectsTab = lazy(() => import("../components/ClientProjectsTab").then(m => ({ default: m.ClientProjectsTab })));
import { ScratchpadDrawer } from "../components/ScratchpadDrawer";
import { TimeTrackerWidget } from "../components/TimeTrackerWidget";
import { socketService } from "../services/socketService";
import { KanbanColumn } from "../components/KanbanColumn";
import { TaskDetailsModal } from "../components/TaskDetailsModal";
import { CreateWorkspaceModal } from "../components/CreateWorkspaceModal";
import { CreateSpaceModal } from "../components/CreateSpaceModal";
import { CreateListModal } from "../components/CreateListModal";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { InviteMembersModal } from "../components/InviteMembersModal";
import taskflowLogo from "../assets/taskflow_logo.png";
import arabProLogo from "../assets/arab_pro_logo.png";
import {
  Plus,
  LogOut,
  PlusCircle,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  UserPlus,
  Layers,
  X,
  Loader2,
  Sun,
  Moon,
  MessageSquare,
  Edit3,
  Users,
  Bell,
  LayoutDashboard,
  BarChart2,
  Calendar,
  Clock,
  Target,
  Shield,
  Building,
  UserCheck,
  Trash2,
  Activity,
} from "lucide-react";

// Static reference to prevent empty array literals from re-allocating memory and triggering render loops
const EMPTY_ARRAY: any[] = [];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-500 text-white";
    case "high":
      return "bg-amber-500 text-white";
    case "medium":
      return "bg-purple-500 text-white";
    default:
      return "bg-zinc-500 text-white";
  }
};

// --- Main Dashboard Page ---
export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const isAr = i18n.language === "ar";

  const { workspaceId, tab, spaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTeamMember, setSelectedTeamMember] = useState<any>(null);

  // Selected task detail view modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modals
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Inputs

  // target column listId
  const [targetListIdForTask, setTargetListIdForTask] = useState<string | null>(null);

  // --- Queries ---
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: taskflowService.getWorkspaces,
  });
  const workspaces = workspacesData || EMPTY_ARRAY;

  const activeWorkspace = workspaces.find((w) => w._id === workspaceId) || workspaces[0] || null;
  const isAdminPath = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isLoadingWorkspaces && workspaces.length > 0) {
      if (!workspaceId && !isAdminPath) {
        navigate(`/w/${workspaces[0]._id}`, { replace: true });
      } else if (workspaceId && !isAdminPath) {
        const exists = workspaces.some((w) => w._id === workspaceId);
        if (!exists && !user?.isSystemAdmin) {
          navigate(`/w/${workspaces[0]._id}`, { replace: true });
        }
      }
    }
  }, [isLoadingWorkspaces, workspaces, workspaceId, isAdminPath, navigate, user]);

  // WebSocket room setup & query invalidation
  useEffect(() => {
    const socket = socketService.connect();

    if (activeWorkspace?._id) {
      socketService.joinWorkspace(activeWorkspace._id);
    }

    const handleTaskCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });
    };

    const handleTaskUpdated = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });
      if (payload?._id) {
        queryClient.invalidateQueries({ queryKey: ["activities", payload._id] });
      }
    };

    const handleTaskDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });
    };

    const handleCommentCreated = (payload: { taskId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", payload.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    };

    socket.on("task-created", handleTaskCreated);
    socket.on("task-updated", handleTaskUpdated);
    socket.on("task-deleted", handleTaskDeleted);
    socket.on("comment-created", handleCommentCreated);

    return () => {
      if (activeWorkspace?._id) {
        socketService.leaveWorkspace(activeWorkspace._id);
      }
      socket.off("task-created", handleTaskCreated);
      socket.off("task-updated", handleTaskUpdated);
      socket.off("task-deleted", handleTaskDeleted);
      socket.off("comment-created", handleCommentCreated);
    };
  }, [activeWorkspace?._id, queryClient]);

  const { data: spacesData, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ["spaces", activeWorkspace?._id],
    queryFn: () => taskflowService.getSpaces(activeWorkspace!._id),
    enabled: !!activeWorkspace?._id,
  });
  const spaces = spacesData || EMPTY_ARRAY;

  const activeSpace = spaceId ? spaces.find((s) => s._id === spaceId) || null : null;

  const activeTab = isAdminPath
    ? "admin"
    : spaceId
    ? "kanban"
    : (tab as "kanban" | "team" | "dashboard" | "reports" | "gantt" | "calendar" | "goals" | "admin" | "clients") ||
      (user?.isSystemAdmin ? "admin" : "kanban");

  const [searchParams] = useSearchParams();
  const adminSubTab = searchParams.get("sub") || "dashboard";

  useEffect(() => {
    if (!isLoadingSpaces && spaces.length > 0 && activeWorkspace?._id === workspaceId) {
      const isBoardTab = !tab || tab === "kanban" || spaceId;
      if (isBoardTab) {
        if (!spaceId) {
          navigate(`/w/${workspaceId}/space/${spaces[0]._id}`, { replace: true });
        } else {
          const exists = spaces.some((s) => s._id === spaceId);
          if (!exists) {
            navigate(`/w/${workspaceId}/space/${spaces[0]._id}`, { replace: true });
          }
        }
      }
    }
  }, [isLoadingSpaces, spaces, workspaceId, tab, spaceId, navigate, activeWorkspace]);

  useEffect(() => {
    if (user?.isSystemAdmin && !workspaceId && !isAdminPath) {
      navigate("/admin", { replace: true });
    }
  }, [user, workspaceId, isAdminPath, navigate]);

  const { data: listsData } = useQuery({
    queryKey: ["lists", activeSpace?._id],
    queryFn: () => taskflowService.getLists(activeSpace!._id),
    enabled: !!activeSpace?._id,
  });
  const lists = listsData || EMPTY_ARRAY;

  const { data: membersData } = useQuery({
    queryKey: ["members", activeWorkspace?._id],
    queryFn: () => taskflowService.getWorkspaceMembers(activeWorkspace!._id),
    enabled: !!activeWorkspace?._id,
  });
  const members = membersData || EMPTY_ARRAY;

  const { data: workspaceTasksData } = useQuery({
    queryKey: ["workspaceTasks", activeWorkspace?._id],
    queryFn: () => taskflowService.getTasksByWorkspace(activeWorkspace!._id),
    enabled: !!activeWorkspace?._id,
  });
  const workspaceTasks = workspaceTasksData || EMPTY_ARRAY;

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => taskflowService.getNotifications(),
    refetchInterval: 10000,
  });
  const notifications = notificationsData || EMPTY_ARRAY;
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => taskflowService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => taskflowService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const currentUserRole = activeWorkspace?.ownerId === user?.id
    ? "owner"
    : (members.find((m: any) => m.userId?._id === user?.id)?.role || "guest");

  // Track task detailed update by query mapping
  const currentTaskDetails = selectedTask
    ? (queryClient.getQueryData(["tasks", selectedTask.listId]) as Task[])?.find((t) => t._id === selectedTask._id) || selectedTask
    : null;

  // --- Mutations ---
  const createWorkspaceMutation = useMutation({
    mutationFn: (name: string) => taskflowService.createWorkspace(name),
    onSuccess: (newWs) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      navigate(`/w/${newWs._id}`);
      setIsWorkspaceModalOpen(false);
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (spaceData: { workspaceId: string; name: string; description?: string; color?: string }) =>
      taskflowService.createSpace(spaceData),
    onSuccess: (newSp) => {
      queryClient.invalidateQueries({ queryKey: ["spaces", activeWorkspace?._id] });
      navigate(`/w/${workspaceId}/space/${newSp._id}`);
      setIsSpaceModalOpen(false);
    },
  });

  const createListMutation = useMutation({
    mutationFn: (data: { spaceId: string; name: string; position: number }) =>
      taskflowService.createList(data.spaceId, data.name, data.position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", activeSpace?._id] });
      setIsListModalOpen(false);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: {
      listId: string;
      title: string;
      description?: string;
      priority?: string;
      clientProjectId: string;
      projectName: string;
      assignees: string[];
      dueDate: string;
      notes?: string;
    }) => taskflowService.createTask(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.listId] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });
      setIsTaskModalOpen(false);
      setTargetListIdForTask(null);
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: (data: { taskId: string; listId: string; status: string }) =>
      taskflowService.updateTask(data.taskId, { listId: data.listId, status: data.status }),
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });

      // Snapshot the previous values
      const previousWorkspaceTasks = queryClient.getQueryData(["workspaceTasks", activeWorkspace?._id]);

      // Find the task to get its source list ID
      const allTasks = (previousWorkspaceTasks as Task[]) || [];
      const taskToMove = allTasks.find((t) => t._id === variables.taskId);

      let previousSourceTasks: Task[] | undefined;
      let previousTargetTasks: Task[] | undefined;
      const sourceListId = taskToMove?.listId;
      const targetListId = variables.listId;

      if (sourceListId) {
        previousSourceTasks = queryClient.getQueryData(["tasks", sourceListId]);
      }
      previousTargetTasks = queryClient.getQueryData(["tasks", targetListId]);

      // Optimistically update workspace tasks
      if (taskToMove) {
        const updatedTask = { ...taskToMove, listId: targetListId, status: variables.status };
        
        queryClient.setQueryData(
          ["workspaceTasks", activeWorkspace?._id],
          allTasks.map((t) => (t._id === variables.taskId ? updatedTask : t))
        );

        // Optimistically update source list tasks
        if (sourceListId) {
          const sourceTasks = (previousSourceTasks || []).filter((t) => t._id !== variables.taskId);
          queryClient.setQueryData(["tasks", sourceListId], sourceTasks);
        }

        // Optimistically update target list tasks
        const targetTasks = previousTargetTasks || [];
        // Make sure it doesn't already exist in target
        if (!targetTasks.some((t) => t._id === variables.taskId)) {
          queryClient.setQueryData(["tasks", targetListId], [...targetTasks, updatedTask]);
        }
      }

      // Return context with snapshotted values
      return { previousWorkspaceTasks, previousSourceTasks, previousTargetTasks, sourceListId, targetListId };
    },
    onError: (_err, _variables, context) => {
      // Rollback to the previous values on error
      if (context) {
        queryClient.setQueryData(["workspaceTasks", activeWorkspace?._id], context.previousWorkspaceTasks);
        if (context.sourceListId) {
          queryClient.setQueryData(["tasks", context.sourceListId], context.previousSourceTasks);
        }
        queryClient.setQueryData(["tasks", context.targetListId], context.previousTargetTasks);
      }
    },
    onSettled: () => {
      // Invalidate queries to sync with backend
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskflowService.deleteTask(taskId),
    onMutate: async (taskId) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });

      // Snapshot the previous values
      const previousWorkspaceTasks = queryClient.getQueryData(["workspaceTasks", activeWorkspace?._id]);

      // Find the task to get its list ID
      const allTasks = (previousWorkspaceTasks as Task[]) || [];
      const taskToDelete = allTasks.find((t) => t._id === taskId);
      const listId = taskToDelete?.listId;

      let previousListTasks: Task[] | undefined;
      if (listId) {
        previousListTasks = queryClient.getQueryData(["tasks", listId]);
      }

      // Optimistically update workspace tasks
      queryClient.setQueryData(
        ["workspaceTasks", activeWorkspace?._id],
        allTasks.filter((t) => t._id !== taskId)
      );

      // Optimistically update column list tasks
      if (listId && previousListTasks) {
        queryClient.setQueryData(
          ["tasks", listId],
          previousListTasks.filter((t) => t._id !== taskId)
        );
      }

      // Return context with snapshotted values
      return { previousWorkspaceTasks, previousListTasks, listId };
    },
    onError: (err: any, _taskId, context) => {
      // Display the error to the user
      const errMsg = err?.response?.data?.error?.message || err?.message || "Failed to delete task";
      useToastStore.getState().addToast(errMsg, "error");

      // Rollback to the previous values on error
      if (context) {
        queryClient.setQueryData(["workspaceTasks", activeWorkspace?._id], context.previousWorkspaceTasks);
        if (context.listId) {
          queryClient.setQueryData(["tasks", context.listId], context.previousListTasks);
        }
      }
    },
    onSettled: () => {
      // Invalidate queries to sync with backend
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks", activeWorkspace?._id] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: taskflowService.deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", activeSpace?._id] });
      useToastStore.getState().addToast("Column deleted successfully", "success");
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to delete column", "error");
    }
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      taskflowService.inviteWorkspaceMember(activeWorkspace!._id, data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", activeWorkspace?._id] });
      setIsInviteModalOpen(false);
      useToastStore.getState().addToast(t('inviteModal.success'), "success");
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || t('inviteModal.failed'), "error");
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      taskflowService.updateWorkspaceMemberRole(activeWorkspace!._id, data.userId, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", activeWorkspace?._id] });
      useToastStore.getState().addToast(t('workspaceMembersModal.roleChangeSuccess'), "success");
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || t('workspaceMembersModal.roleChangeFailed'), "error");
    },
  });

    const handleOpenSpaceModal = () => {
    if (!["owner", "admin"].includes(currentUserRole)) {
      useToastStore.getState().addToast(t('warnings.notAdminSpace'), "warning");
      return;
    }
    setIsSpaceModalOpen(true);
  };

  const handleOpenListModal = () => {
    if (!["owner", "admin", "manager"].includes(currentUserRole)) {
      useToastStore.getState().addToast(t('warnings.notAdminOrManagerColumn'), "warning");
      return;
    }
    setIsListModalOpen(true);
  };

  const openAddTaskModal = (listId: string) => {
    if (!["owner", "admin", "manager", "member"].includes(currentUserRole)) {
      useToastStore.getState().addToast(t('warnings.notAuthorizedTask'), "warning");
      return;
    }
    setTargetListIdForTask(listId);
    setIsTaskModalOpen(true);
  };

  const handleOpenInviteModal = () => {
    if (!["owner", "admin"].includes(currentUserRole)) {
      useToastStore.getState().addToast(t('warnings.notAdminInvite'), "warning");
      return;
    }
    setIsInviteModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-[#070111] font-sans text-zinc-950 dark:text-zinc-50 overflow-hidden transition-theme">
      {/* 1. SIDEBAR */}
      <aside className={`bg-[#120722] text-zinc-100 flex flex-col justify-between border-e border-[#1f1035] shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="flex flex-col overflow-y-auto flex-1">
          {/* Header Branding */}
          <div className={`p-4 flex items-center border-b border-[#1f1035] ${isSidebarCollapsed ? "flex-col gap-3 justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={taskflowLogo} alt="Taskflow Logo" className="h-8 w-8 object-contain rounded-lg shadow-md shrink-0" />
              {!isSidebarCollapsed && (
                <span className="font-bold text-lg tracking-wide text-zinc-100 truncate">Taskflow</span>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer shrink-0"
              title={isSidebarCollapsed ? t('sidebar.expand', { defaultValue: "Expand" }) : t('sidebar.collapse', { defaultValue: "Collapse" })}
            >
              {isSidebarCollapsed ? (
                <Menu className="h-4.5 w-4.5" />
              ) : (
                i18n.dir() === "rtl" ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          {/* Workspace Switcher */}
          {!isSidebarCollapsed && !user?.isSystemAdmin && (
            <div className="p-4 border-b border-[#1f1035]">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                {t('sidebar.currentWorkspace')}
              </label>
              <div className="relative">
                <select
                  value={activeWorkspace?._id || ""}
                  onChange={(e) => {
                    const ws = workspaces.find((w) => w._id === e.target.value);
                    if (ws) navigate(`/w/${ws._id}`);
                  }}
                  className="w-full bg-[#1b0d32] border border-[#2b174d] rounded-lg py-2 px-3 text-sm text-zinc-100 appearance-none focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  {workspaces.map((ws) => (
                    <option key={ws._id} value={ws._id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('sidebar.createWorkspace')}</span>
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className={`px-2 py-3 border-b border-[#1f1035] space-y-1 ${isSidebarCollapsed ? "flex flex-col items-center" : ""}`}>
            {[
              ...(!user?.isSystemAdmin
                ? [
                  { id: "kanban", icon: Layers, label: t('sidebar.board', { defaultValue: "Kanban Board" }) },
                    { id: "dashboard", icon: LayoutDashboard, label: t('sidebar.dashboard', { defaultValue: "Widgets Dashboard" }) },
                    { id: "reports", icon: BarChart2, label: t('sidebar.reports', { defaultValue: "Reports & Analytics" }) },
                    { id: "clients", icon: Briefcase, label: t('sidebar.clients', { defaultValue: "Client Projects" }) },
                    { id: "gantt", icon: Clock, label: t('sidebar.gantt', { defaultValue: "Gantt Chart" }) },
                    { id: "calendar", icon: Calendar, label: t('sidebar.calendar', { defaultValue: "Calendar View" }) },
                    { id: "team", icon: Users, label: t('sidebar.team', { defaultValue: "Workspace Team" }) },
                    { id: "goals", icon: Target, label: t('sidebar.goals', { defaultValue: "Strategic Goals & OKRs" }) },
                  ]
                : []),
              ...(user?.isSystemAdmin
                ? [
                    { id: "admin-dashboard", icon: LayoutDashboard, label: t('sidebar.adminDashboard', { defaultValue: "Admin Dashboard" }) },
                    { id: "admin-companies", icon: Building, label: t('sidebar.companiesDrilldown', { defaultValue: "Company Inspector" }) },
                    { id: "admin-users", icon: UserCheck, label: t('sidebar.approvals', { defaultValue: "User Approvals" }) },
                    { id: "admin-deleted", icon: Trash2, label: t('sidebar.deletedItems', { defaultValue: "Deleted Items" }) },
                    { id: "admin-audit", icon: Activity, label: t('sidebar.auditLogs', { defaultValue: "System Audit Logs" }) },
                  ]
                : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const sub = tab.id.startsWith("admin-") ? tab.id.substring(6) : null;
              const isActive = sub 
                ? (activeTab === "admin" && adminSubTab === sub)
                : (activeTab === tab.id);
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id.startsWith("admin-")) {
                      const targetSub = tab.id.substring(6);
                      navigate(`/admin?sub=${targetSub}`);
                    } else if (tab.id === "admin") {
                      navigate("/admin");
                    } else if (tab.id === "kanban") {
                      if (spaces.length > 0) {
                        const targetSpaceId = activeSpace?._id || spaces[0]._id;
                        navigate(`/w/${activeWorkspace?._id}/space/${targetSpaceId}`);
                      } else {
                        navigate(`/w/${activeWorkspace?._id}/kanban`);
                      }
                    } else {
                      navigate(`/w/${activeWorkspace?._id}/${tab.id}`);
                    }
                  }}
                  className={`w-full flex items-center rounded-lg transition-all cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 py-2 px-3 text-start"
                  } ${
                    isActive
                      ? "bg-purple-500/15 border-s-4 border-purple-500 text-white font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                  title={isSidebarCollapsed ? tab.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="text-sm truncate">{tab.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Spaces Navigation */}
          {!user?.isSystemAdmin && (
            <div className="p-3 flex flex-col">
              <div className={`flex items-center justify-between mb-3 ${isSidebarCollapsed ? "justify-center" : ""}`}>
              {!isSidebarCollapsed && (
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                  {t('sidebar.spaces')} ({spaces.length})
                </span>
              )}
              <button
                onClick={handleOpenSpaceModal}
                className="text-zinc-400 hover:text-zinc-100 p-0.5 hover:bg-white/5 rounded-md transition-all cursor-pointer"
                title={t('sidebar.createSpace', { defaultValue: "Create Space" })}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <nav className={`space-y-1 ${isSidebarCollapsed ? "flex flex-col items-center" : ""}`}>
              {isLoadingSpaces ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-655" />
                </div>
              ) : spaces.length === 0 ? (
                !isSidebarCollapsed && <p className="text-[11px] text-zinc-550 text-center py-4">{t('sidebar.noActiveSpaces')}</p>
              ) : (
                spaces.map((sp) => {
                  const isActive = activeSpace?._id === sp._id && activeTab === "kanban";
                  return (
                    <button
                      key={sp._id}
                      onClick={() => {
                        navigate(`/w/${activeWorkspace?._id}/space/${sp._id}`);
                      }}
                      className={`w-full flex items-center rounded-lg transition-all cursor-pointer ${
                        isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 py-2 px-3 text-start"
                      } ${
                        isActive
                          ? "bg-purple-500/10 text-purple-300 font-semibold border-s-4 border-purple-500/60"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                      }`}
                      title={isSidebarCollapsed ? sp.name : undefined}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sp.color || "#aa3bff" }}
                      />
                      {!isSidebarCollapsed && <span className="text-sm truncate">{sp.name}</span>}
                    </button>
                  );
                })
              )}
            </nav>
          </div>
          )}
        </div>

        {/* Footer Profile */}
        <div className="flex flex-col shrink-0">
          {/* Powered by logo footer */}
          {!isSidebarCollapsed && (
            <div className="px-4 py-2.5 border-t border-[#1f1035] flex flex-col gap-1 items-center justify-center bg-zinc-950/20">
              <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase">POWERED BY</span>
              <img src={arabProLogo} alt="Arab Pro" className="h-5 object-contain opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          )}

          {/* Profile bar */}
          <div className={`p-3 border-t border-[#1f1035] bg-[#0c0318] flex items-center justify-between ${isSidebarCollapsed ? "flex-col gap-3 justify-center" : ""}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Demo"}
                alt="Avatar"
                className="h-8 w-8 rounded-full bg-zinc-850 border border-[#2b174d] shrink-0"
              />
              {!isSidebarCollapsed && (
                <div className="text-start overflow-hidden">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => logout()}
              title={t('sidebar.logOut')}
              className="text-zinc-500 hover:text-red-400 hover:bg-white/5 p-1.5 rounded-lg transition-all cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN BOARD WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {user?.isSystemAdmin ? (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in text-start">
            {/* Header Toolbar */}
            <header className="h-16 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#120722]/30 backdrop-blur-md p-4 flex items-center justify-between shrink-0 transition-theme relative z-20">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-500" />
                <h1 className="text-xl font-bold tracking-tight">
                  {adminSubTab === "dashboard" ? (isAr ? "تحليلات عامة للمنصة" : "Admin Analytics Overview") :
                   adminSubTab === "companies" ? (isAr ? "فحص مساحات عمل الشركات" : "Workspace & Company Inspector") :
                   adminSubTab === "users" ? (isAr ? "مراجعة واعتماد الحسابات" : "User Access Verification") :
                   adminSubTab === "deleted" ? (isAr ? "استعادة المهام المحذوفة" : "Soft-Deleted Task Recovery") :
                   (isAr ? "سجل الأحداث والتدقيق للنظام" : "Immutable System Audit Logs")}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                  {isAr ? "مشرف نظام عرب برو" : "Arab Pro Platform Admin"}
                </span>
              </div>

              {/* Actions on the right side of header for Admin */}
              <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div dir="ltr" className="flex items-center bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-850 relative h-8 shrink-0 select-none">
                  <motion.div
                    className="absolute top-0.5 bottom-0.5 bg-white dark:bg-zinc-900 rounded-md shadow-xs"
                    initial={false}
                    animate={{
                      left: i18n.language === 'en' ? '2px' : '34px',
                      width: '32px'
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                  
                  <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`relative z-10 w-8 h-full text-center text-[10px] font-extrabold transition-colors cursor-pointer ${
                      i18n.language === 'en'
                        ? 'text-purple-650 dark:text-purple-400'
                        : 'text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200'
                    }`}
                  >
                    EN
                  </button>
                  
                  <button
                    onClick={() => i18n.changeLanguage('ar')}
                    className={`relative z-10 w-8 h-full text-center text-[10px] font-extrabold transition-colors cursor-pointer ${
                      i18n.language === 'ar'
                        ? 'text-purple-650 dark:text-purple-400'
                        : 'text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200'
                    }`}
                  >
                    AR
                  </button>
                </div>

                {/* Theme Switcher */}
                <button
                  onClick={toggleTheme}
                  title={t('header.toggleTheme')}
                  className="p-2 text-zinc-555 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-55 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              }>
                <AdminPanel activeSubTab={adminSubTab as any} />
              </Suspense>
            </div>
          </div>
        ) : workspaces.length === 0 && !isLoadingWorkspaces ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto animate-fade-in">
            <Briefcase className="h-16 w-16 text-purple-500 mb-6" />
            <h1 className="text-3xl font-extrabold mb-3">{t('welcome.title')}</h1>
            <p className="text-zinc-550 dark:text-zinc-400 mb-8 leading-relaxed">
              {t('welcome.subtitle')}
            </p>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-md transition-all cursor-pointer"
            >
              {t('welcome.btnCreateWs')}
            </button>
          </div>
        ) : !activeSpace && activeTab === "kanban" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <Layers className="h-16 w-16 text-purple-500 mb-6 animate-pulse" />
            <h1 className="text-2xl font-bold mb-3">{t('noSpaces.title')}</h1>
            <p className="text-zinc-550 dark:text-zinc-400 mb-8 leading-relaxed">
              {t('noSpaces.subtitle', { workspaceName: activeWorkspace?.name })}
            </p>
            <button
              onClick={handleOpenSpaceModal}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-md transition-all cursor-pointer"
            >
              {t('noSpaces.btnCreateSpace')}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Toolbar */}
            <header className="h-16 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#120722]/30 backdrop-blur-md p-4 flex items-center justify-between shrink-0 transition-theme relative z-20">
              {activeTab === "admin" ? (
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <h1 className="text-xl font-bold tracking-tight">
                    {adminSubTab === "dashboard" ? "Admin Analytics Overview" :
                     adminSubTab === "companies" ? "Workspace & Company Inspector" :
                     adminSubTab === "users" ? "User Access Verification" :
                     adminSubTab === "deleted" ? "Soft-Deleted Task Recovery" :
                     "Immutable System Audit Logs"}
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    Arab Pro Platform Admin
                  </span>
                </div>
              ) : activeTab === "clients" ? (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-purple-500" />
                  <h1 className="text-xl font-bold tracking-tight">{t('sidebar.clients', { defaultValue: "Client Projects" })}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    {activeWorkspace?.name}
                  </span>
                </div>
              ) : activeTab === "team" ? (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-500" />
                  <h1 className="text-xl font-bold tracking-tight">{t('sidebar.team', { defaultValue: "Workspace Team" })}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    {activeWorkspace?.name}
                  </span>
                </div>
              ) : activeTab === "dashboard" ? (
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-purple-500" />
                  <h1 className="text-xl font-bold tracking-tight">{t('sidebar.dashboard', { defaultValue: "Widgets Dashboard" })}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    {activeWorkspace?.name}
                  </span>
                </div>
              ) : activeTab === "reports" ? (
                <div className="flex items-center gap-3">
                  <BarChart2 className="h-5 w-5 text-purple-500" />
                  <h1 className="text-xl font-bold tracking-tight">{t('sidebar.reports', { defaultValue: "Reports & Analytics" })}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    {activeWorkspace?.name}
                  </span>
                </div>
              ) : activeTab === "gantt" ? (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <h1 className="text-xl font-bold tracking-tight">{t('sidebar.gantt', { defaultValue: "Gantt Chart" })}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    {activeWorkspace?.name}
                  </span>
                </div>
              ) : activeTab === "calendar" ? (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <h1 className="text-xl font-bold tracking-tight">{t('sidebar.calendar', { defaultValue: "Calendar View" })}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    {activeWorkspace?.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: activeSpace?.color || "#aa3bff" }}
                  />
                  <h1 className="text-xl font-bold tracking-tight">{activeSpace?.name}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                    {t('header.kanbanBoard')}
                  </span>
                </div>
              )}

              {/* Invite Members / Actions */}
              <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div dir="ltr" className="flex items-center bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-850 relative h-8 shrink-0 select-none">
                  <motion.div
                    className="absolute top-0.5 bottom-0.5 bg-white dark:bg-zinc-900 rounded-md shadow-xs"
                    initial={false}
                    animate={{
                      left: i18n.language === 'en' ? '2px' : '34px',
                      width: '32px'
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                  
                  <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`relative z-10 w-8 h-full text-center text-[10px] font-extrabold transition-colors cursor-pointer ${
                      i18n.language === 'en'
                        ? 'text-purple-650 dark:text-purple-400'
                        : 'text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200'
                    }`}
                  >
                    EN
                  </button>
                  
                  <button
                    onClick={() => i18n.changeLanguage('ar')}
                    className={`relative z-10 w-8 h-full text-center text-[10px] font-extrabold transition-colors cursor-pointer ${
                      i18n.language === 'ar'
                        ? 'text-purple-650 dark:text-purple-400'
                        : 'text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200'
                    }`}
                  >
                    AR
                  </button>
                </div>

                {/* Notification Bell Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 text-zinc-555 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-55 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all relative cursor-pointer"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute end-0 mt-2 w-80 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 transition-theme max-h-96 flex flex-col">
                      <div className="p-3 border-b dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-950/10 gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setIsNotificationsOpen(false)}
                            className="text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors p-0.5 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800 cursor-pointer"
                            title="Close"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            {t('notifications.title', { defaultValue: "Notifications" })} ({unreadCount})
                          </span>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-[10px] font-bold text-purple-650 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer whitespace-nowrap"
                          >
                            {t('notifications.markAllRead', { defaultValue: "Mark all as read" })}
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-80">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-zinc-450">
                            {t('notifications.empty', { defaultValue: "No notifications yet" })}
                          </div>
                        ) : (
                          notifications.map((n: any) => (
                            <div
                              key={n._id}
                              onClick={async () => {
                                if (!n.isRead) {
                                  markReadMutation.mutate(n._id);
                                }
                                setIsNotificationsOpen(false);
                                if (n.entityType === "task" && n.entityId) {
                                  try {
                                    const fullTaskObj = await taskflowService.getTaskById(n.entityId);
                                    if (fullTaskObj) {
                                      setSelectedTask(fullTaskObj);
                                    }
                                  } catch (error) {
                                    console.error("Failed to load task details for notification:", error);
                                  }
                                }
                              }}
                              className={`p-3 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-all ${
                                !n.isRead ? "bg-purple-500/5" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 shrink-0">
                                  {n.type === "task_assigned" && <Users className="h-4.5 w-4.5 text-blue-500" />}
                                  {n.type === "task_updated" && <Layers className="h-4.5 w-4.5 text-amber-500" />}
                                  {n.type === "comment_mentioned" && <MessageSquare className="h-4.5 w-4.5 text-purple-500" />}
                                  {n.type === "workspace_invite" && <UserPlus className="h-4.5 w-4.5 text-green-500" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100">
                                    {n.title}
                                  </p>
                                  <p className="text-[11px] text-zinc-550 mt-0.5 break-words">
                                    {n.message}
                                  </p>
                                  <span className="text-[9px] text-zinc-450 block mt-1">
                                    {new Date(n.createdAt).toLocaleTimeString(i18n.language, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                {!n.isRead && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleTheme}
                  title={t('header.toggleTheme')}
                  className="p-2 text-zinc-555 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-55 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>

                {/* Hide workspace-specific items for Super Admin */}
                {!user?.isSystemAdmin && (
                  <>
                    {/* Scratchpad Trigger Button */}
                    <button
                      onClick={() => setIsScratchpadOpen(true)}
                      title={t('scratchpad.scratchpadTitle')}
                      className="p-2 text-zinc-555 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-55 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center -space-x-2 overflow-hidden rtl:space-x-reverse">
                      {members.map((m: any) => (
                        <img
                          key={m._id}
                          title={`${m.userId?.fullName} (${t(`roles.${m.role}`)})`}
                          src={m.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                          alt="member"
                          className="h-7 w-7 rounded-full border border-white dark:border-zinc-900 bg-zinc-800"
                        />
                      ))}
                      <button
                        onClick={handleOpenInviteModal}
                        className="h-7 w-7 rounded-full border border-dashed border-zinc-400 bg-zinc-100 dark:bg-zinc-855 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:border-zinc-800 hover:bg-white transition-all cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </header>

            {/* Main view body: Board Columns, Team, Dashboard or Reports */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {activeTab === "team" ? (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20 transition-theme">
                
                {/* Left Panel: Members list */}
                <div className="w-full md:w-80 border-e border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 flex flex-col min-h-0 shrink-0 transition-theme">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>{t('workspaceMembersModal.membersTab')}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md select-none">
                        {members.length}
                      </span>
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {members.map((m: any) => {
                      const isSelected = selectedTeamMember?._id === m._id;
                      const memberTasks = workspaceTasks.filter((task: any) => 
                        task.assignees?.some((assignee: any) => assignee._id === m.userId?._id || assignee === m.userId?._id)
                      );

                      return (
                        <button
                          key={m._id}
                          onClick={() => setSelectedTeamMember(m)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-start transition-all cursor-pointer ${
                            isSelected
                              ? "border-purple-500 bg-purple-500/5 shadow-xs"
                              : "border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={m.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                              alt="avatar"
                              className="h-10 w-10 rounded-full bg-zinc-800 border shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate text-zinc-800 dark:text-zinc-200">
                                {m.userId?.fullName}
                              </p>
                              <p className="text-xs text-zinc-450 truncate">{m.userId?.email}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 capitalize">
                                  {t(`roles.${m.role}`)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1 ms-2">
                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                              {memberTasks.length} {t('tasksCount', { defaultValue: "Tasks" })}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none capitalize ${
                              m.status === 'active' 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel: Assigned Tasks */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-6">
                  {selectedTeamMember ? (
                    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-xs transition-theme">
                      
                      {/* Member profile header card */}
                      <div className="p-6 border-b dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/20 dark:bg-zinc-950/10 shrink-0">
                        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
                          <img
                            src={selectedTeamMember.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt="avatar"
                            className="h-16 w-16 rounded-full bg-zinc-800 border-2 border-purple-500 shadow-sm"
                          />
                          <div>
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                              {selectedTeamMember.userId?.fullName}
                            </h3>
                            <p className="text-sm text-zinc-450">{selectedTeamMember.userId?.email}</p>
                            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-150/50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 capitalize">
                                {t(`roles.${selectedTeamMember.role}`)}
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                                selectedTeamMember.status === 'active'
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {selectedTeamMember.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-6 text-center shrink-0">
                          <div>
                            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                              {workspaceTasks.filter((task: any) => 
                                task.assignees?.some((assignee: any) => assignee._id === selectedTeamMember.userId?._id || assignee === selectedTeamMember.userId?._id)
                              ).length}
                            </p>
                            <p className="text-xs text-zinc-450 font-bold uppercase tracking-wider">
                              {t('stats.totalTasks', { defaultValue: "Total Tasks" })}
                            </p>
                          </div>
                          <div>
                            <p className="text-2xl font-black text-green-500">
                              {workspaceTasks.filter((task: any) => 
                                task.status === 'done' &&
                                task.assignees?.some((assignee: any) => assignee._id === selectedTeamMember.userId?._id || assignee === selectedTeamMember.userId?._id)
                              ).length}
                            </p>
                            <p className="text-xs text-zinc-450 font-bold uppercase tracking-wider">
                              {t('stats.completed', { defaultValue: "Completed" })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Member's Tasks List */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">
                          {t('stats.assignedTasksList', { defaultValue: "Assigned Tasks" })}
                        </h4>
                        
                        {workspaceTasks.filter((task: any) => 
                          task.assignees?.some((assignee: any) => assignee._id === selectedTeamMember.userId?._id || assignee === selectedTeamMember.userId?._id)
                        ).length === 0 ? (
                          <div className="text-center py-12">
                            <Layers className="h-12 w-12 text-zinc-350 dark:text-zinc-700 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">{t('stats.noAssignedTasks', { defaultValue: "No tasks assigned to this member yet." })}</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {workspaceTasks.filter((task: any) => 
                              task.assignees?.some((assignee: any) => assignee._id === selectedTeamMember.userId?._id || assignee === selectedTeamMember.userId?._id)
                            ).map((task: any) => (
                              <div
                                key={task._id}
                                onClick={() => setSelectedTask(task)}
                                className="group flex items-center justify-between p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/5 hover:border-purple-500/50 hover:bg-white dark:hover:bg-zinc-850/30 transition-all cursor-pointer"
                              >
                                <div className="min-w-0 space-y-1">
                                  <h5 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                    {task.title}
                                  </h5>
                                  <p className="text-xs text-zinc-500 truncate max-w-lg">
                                    {task.description || t('taskModal.noDescription')}
                                  </p>
                                </div>

                                <div className="shrink-0 flex items-center gap-3 ms-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full select-none capitalize ${getPriorityColor(task.priority)}`}>
                                    {t(`priorities.${task.priority}`)}
                                  </span>
                                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 capitalize">
                                    {task.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center bg-white/20 dark:bg-zinc-900/10 transition-theme">
                      <Users className="h-16 w-16 text-purple-500/50 mb-4" />
                      <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-150 mb-1">
                        {t('stats.selectMemberTitle', { defaultValue: "Select a Team Collaborator" })}
                      </h3>
                      <p className="text-sm text-zinc-500 max-w-sm">
                        {t('stats.selectMemberDesc', { defaultValue: "Click on any team member from the left panel to analyze their workload and assigned tasks." })}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : activeTab === "admin" ? (
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              }>
                <AdminPanel activeSubTab={adminSubTab as any} />
              </Suspense>
            ) : activeTab === "clients" ? (
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              }>
                <ClientProjectsTab
                  workspaceId={activeWorkspace?._id || ""}
                  currentUserRole={currentUserRole}
                />
              </Suspense>
            ) : activeTab === "dashboard" || activeTab === "goals" || activeTab === "reports" || activeTab === "gantt" || activeTab === "calendar" ? (
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              }>
                {activeTab === "dashboard" ? (
                  <DashboardTab
                    workspaceName={activeWorkspace?.name}
                    tasks={workspaceTasks}
                    members={members}
                  />
                ) : activeTab === "goals" ? (
                  <GoalsTab
                    workspaceId={activeWorkspace?._id || ""}
                    members={members}
                    currentUserRole={currentUserRole}
                  />
                ) : activeTab === "reports" ? (
                  <ReportsTab
                    workspaceName={activeWorkspace?.name}
                    tasks={workspaceTasks}
                    members={members}
                  />
                ) : activeTab === "gantt" ? (
                  <GanttTab
                    workspaceName={activeWorkspace?.name}
                    tasks={workspaceTasks}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                ) : (
                  <CalendarTab
                    workspaceName={activeWorkspace?.name}
                    tasks={workspaceTasks}
                    onTaskClick={(task) => setSelectedTask(task)}
                  />
                )}
              </Suspense>
            ) : (
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-zinc-50/50 dark:bg-zinc-950/20 transition-theme kanban-scrollbar">
                <div className="flex gap-4 h-full items-start">
                  {lists.map((list) => (
                    <KanbanColumn
                      key={list._id}
                      list={list}
                      onAddTaskClick={openAddTaskModal}
                      onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
                      deletingTaskId={deleteTaskMutation.isPending ? deleteTaskMutation.variables : undefined}
                      onMoveTask={(taskId, listId, status) =>
                        moveTaskMutation.mutate({ taskId, listId, status })
                      }
                      onDeleteList={(listId) => deleteListMutation.mutate(listId)}
                      onTaskClick={(task) => setSelectedTask(task)}
                      allLists={lists}
                      currentUserRole={currentUserRole}
                    />
                  ))}

                  {/* Create Column Column Trigger */}
                  <button
                    onClick={handleOpenListModal}
                    className="w-72 border border-dashed border-zinc-350 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-zinc-500 hover:text-purple-500 hover:bg-purple-500/5 shrink-0 transition-all cursor-pointer"
                  >
                    <PlusCircle className="h-4.5 w-4.5" />
                    <span>{t('kanban.createColumn')}</span>
                  </button>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* --- MODALS BLOCK --- */}

      {/* Trello Task Details Modal */}
      {currentTaskDetails && (
        <TaskDetailsModal
          task={currentTaskDetails}
          onClose={() => setSelectedTask(null)}
          workspaceMembers={members}
          allLists={lists}
        />
      )}

      {/* 1. Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onSubmit={(name) => createWorkspaceMutation.mutate(name)}
        isPending={createWorkspaceMutation.isPending}
      />

      {/* 2. Create Space Modal */}
      <CreateSpaceModal
        isOpen={isSpaceModalOpen}
        onClose={() => setIsSpaceModalOpen(false)}
        onSubmit={(data) =>
          createSpaceMutation.mutate({
            workspaceId: activeWorkspace!._id,
            name: data.name,
            description: data.description,
            color: data.color,
          })
        }
        isPending={createSpaceMutation.isPending}
      />

      {/* 3. Create List Modal */}
      <CreateListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSubmit={(name) =>
          createListMutation.mutate({
            spaceId: activeSpace!._id,
            name,
            position: (lists.length + 1) * 1000,
          })
        }
        isPending={createListMutation.isPending}
      />

      {/* 4. Create Task Modal */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={(data) =>
          createTaskMutation.mutate({
            listId: targetListIdForTask!,
            title: data.title,
            description: data.description,
            priority: data.priority,
            clientProjectId: data.clientProjectId,
            projectName: data.projectName,
            assignees: data.assignees,
            dueDate: data.dueDate,
            notes: data.notes,
          })
        }
        isPending={createTaskMutation.isPending}
        workspaceId={activeWorkspace?._id || ""}
        workspaceMembers={members}
      />

      {/* 5. Invite/Manage Members Modal */}
      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        members={members}
        currentUserRole={currentUserRole}
        currentUserId={user?.id}
        onInvite={(email, role) => inviteMemberMutation.mutate({ email, role })}
        onUpdateRole={(userId, role) => updateMemberRoleMutation.mutate({ userId, role })}
        isInvitePending={inviteMemberMutation.isPending}
      />

      {/* Global Widgets & Drawers */}
      <ScratchpadDrawer
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />

      {activeWorkspace && !user?.isSystemAdmin && (
        <TimeTrackerWidget tasks={workspaceTasks} />
      )}

    </div>
  );
};
