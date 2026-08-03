import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { taskflowService } from "../services/taskflowService";
import type { Workspace, Space, List, Task, Comment, Attachment } from "../services/taskflowService";
import { DashboardTab } from "../components/DashboardTab";
import { ReportsTab } from "../components/ReportsTab";
import {
  Plus,
  LogOut,
  PlusCircle,
  Briefcase,
  ChevronDown,
  UserPlus,
  Layers,
  Trash2,
  X,
  Loader2,
  Sun,
  Moon,
  MessageSquare,
  Paperclip,
  Check,
  Image as ImageIcon,
  Edit3,
  Users,
  Bell,
  LayoutDashboard,
  BarChart2,
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

// --- Decoupled Kanban Column Component ---
interface KanbanColumnProps {
  list: List;
  onAddTaskClick: (listId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, listId: string, status: string) => void;
  onTaskClick: (task: Task) => void;
  allLists: List[];
  currentUserRole: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  list,
  onAddTaskClick,
  onDeleteTask,
  onMoveTask,
  onTaskClick,
  allLists,
  currentUserRole,
}) => {
  const { t } = useTranslation();
  // Query tasks for this specific list ID. Standard React Query caching.
  const { data: tasks = EMPTY_ARRAY, isLoading } = useQuery({
    queryKey: ["tasks", list._id],
    queryFn: () => taskflowService.getTasksByList(list._id),
  });

  return (
    <div className="w-72 shrink-0 bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col max-h-full transition-theme">
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{list.name}</span>
          <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-500">
            {tasks.length}
          </span>
        </div>

        {/* Action button */}
        <div className="flex items-center">
          <button
            onClick={() => onAddTaskClick(list._id)}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-850 rounded-md text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[50px]">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-555">
            {t('kanban.noTasks')}
          </div>
        ) : (
          tasks.map((task: Task) => {
            // Find first attached image to display as card thumbnail
            const coverImage = task.attachments?.find((att) =>
              att.url.startsWith("data:image/") || att.name.match(/\.(jpeg|jpg|gif|png|webp)/i)
            );
            return (
              <div
                key={task._id}
                onClick={() => onTaskClick(task)}
                className="bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 p-3 rounded-lg shadow-sm hover:shadow-md transition-all relative group text-start cursor-pointer overflow-hidden"
              >
                {coverImage && (
                  <div className="h-28 -mx-3 -mt-3 mb-3 overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
                    <img
                      src={coverImage.url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                    {task.title}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!["owner", "admin", "manager"].includes(currentUserRole)) {
                        alert(t('warnings.notAuthorizedDeleteTask'));
                        return;
                      }
                      if (confirm(t('kanban.confirmDeleteTask'))) {
                        onDeleteTask(task._id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {task.description && (
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Tags & Assignees */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full select-none capitalize ${getPriorityColor(task.priority)}`}>
                      {t(`priorities.${task.priority}`)}
                    </span>
                    {task.attachments && task.attachments.length > 0 && (
                      <span className="text-[10px] flex items-center gap-0.5 text-zinc-400 font-semibold">
                        <Paperclip className="h-2.5 w-2.5" />
                        {task.attachments.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center -space-x-1">
                    {task.assignees?.map((assignee: any) => (
                      <img
                        key={assignee._id}
                        title={assignee.fullName}
                        src={assignee.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                        alt="assignee"
                        className="h-5 w-5 rounded-full border border-white dark:border-zinc-900 bg-zinc-800"
                      />
                    ))}
                  </div>
                </div>

                {/* Column Shifting actions */}
                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/40 flex justify-between gap-1">
                  {allLists.map((targetList) => {
                    if (targetList._id === list._id) return null;
                    return (
                      <button
                        key={targetList._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveTask(
                            task._id,
                            targetList._id,
                            targetList.name.toLowerCase().replace(/\s+/g, "-")
                          );
                        }}
                        className="text-[9px] font-medium text-zinc-400 hover:text-purple-500 px-1 py-0.5 rounded-md hover:bg-purple-500/5 transition-all truncate cursor-pointer"
                      >
                        {t('kanban.moveTo', { targetName: targetList.name })}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task footer trigger */}
      <button
        onClick={() => onAddTaskClick(list._id)}
        className="m-2 py-2 flex items-center justify-center gap-1.5 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-850/50 transition-all cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{t('kanban.addTask')}</span>
      </button>
    </div>
  );
};

// --- Trello-Style Task Details Modal ---
interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  workspaceMembers: any[];
  allLists: List[];
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  workspaceMembers,
  allLists,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable task state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [priority, setPriority] = useState(task.priority);
  const [listId, setListId] = useState(task.listId);
  const [isUploading, setIsUploading] = useState(false);

  // Time tracking states
  const [timeEstimate, setTimeEstimate] = useState(task.timeEstimate || 0);
  const [logHours, setLogHours] = useState("");
  const [logComment, setLogComment] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));

  // Comment state
  const [commentText, setCommentText] = useState("");

  // Get comments query
  const { data: comments = EMPTY_ARRAY, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", task._id],
    queryFn: () => taskflowService.getComments(task._id),
  });

  // Sync state if task updates
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setListId(task.listId);
    setTimeEstimate(task.timeEstimate || 0);
  }, [task]);

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (updateData: Partial<Task>) => taskflowService.updateTask(task._id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => taskflowService.createComment(task._id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task._id] });
      setCommentText("");
    },
  });

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTaskMutation.mutate({ title });
    }
  };

  const handleSaveDescription = () => {
    updateTaskMutation.mutate({ description });
    setIsEditingDesc(false);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as any;
    setPriority(val);
    updateTaskMutation.mutate({ priority: val });
  };

  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setListId(val);
    const matchedList = allLists.find((l) => l._id === val);
    const status = matchedList ? matchedList.name.toLowerCase().replace(/\s+/g, "-") : "to-do";
    updateTaskMutation.mutate({ listId: val, status });
  };

  // Toggle assignee checkbox
  const handleToggleAssignee = (userId: string) => {
    const currentAssigneeIds = task.assignees?.map((a) => a._id) || [];
    let updatedIds: string[];
    
    if (currentAssigneeIds.includes(userId)) {
      updatedIds = currentAssigneeIds.filter((id) => id !== userId);
    } else {
      updatedIds = [...currentAssigneeIds, userId];
    }
    
    updateTaskMutation.mutate({ assignees: updatedIds as any });
  };

  // Base64 file uploader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const newAttachment: Attachment = {
          name: file.name,
          url: base64Data,
          publicId: `b64-${Date.now()}`,
          size: file.size,
        };

        const currentAttachments = task.attachments || [];
        await updateTaskMutation.mutateAsync({
          attachments: [...currentAttachments, newAttachment],
        });
      } catch (err) {
        alert(t('taskModal.uploadCoverFailed'));
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate(commentText);
  };

  const handleTimeEstimateBlur = () => {
    const val = Number(timeEstimate);
    if (!isNaN(val) && val >= 0 && val !== task.timeEstimate) {
      updateTaskMutation.mutate({ timeEstimate: val });
    }
  };

  const handleLogTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Number(logHours);
    if (isNaN(hours) || hours <= 0) {
      alert("Please enter a valid number of hours.");
      return;
    }

    const newLog = {
      userId: user!.id,
      hours,
      comment: logComment,
      date: new Date(logDate).toISOString(),
    };

    const existingLogs = task.loggedTime || [];
    updateTaskMutation.mutate({
      loggedTime: [...existingLogs, newLog],
    });

    setLogHours("");
    setLogComment("");
    setLogDate(new Date().toISOString().substring(0, 10));
  };

  // Find first attached image for the modal header banner
  const coverImage = task.attachments?.find((att) =>
    att.url.startsWith("data:image/") || att.name.match(/\.(jpeg|jpg|gif|png|webp)/i)
  );

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] max-h-[700px] relative animate-fade-in transition-theme">
        
        {/* Close Button floating */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-20 h-8 w-8 bg-zinc-900/60 text-white rounded-full flex items-center justify-center hover:bg-zinc-900 transition-all cursor-pointer shadow-md"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* LEFT COLUMN: Main task properties & files (60%) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto border-e border-zinc-100 dark:border-zinc-800/80">
          {/* Cover Banner */}
          <div className="h-44 w-full bg-linear-to-r from-purple-600 to-indigo-600 relative shrink-0">
            {coverImage ? (
              <img
                src={coverImage.url}
                alt="Banner Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/20 select-none">
                <ImageIcon className="h-20 w-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          </div>

          <div className="p-6 space-y-6">
            {/* Task Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.taskTitleLabel')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full text-2xl font-extrabold bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-purple-500 focus:outline-hidden py-1 transition-all"
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.statusLabel')}</label>
                <select
                  value={listId}
                  onChange={handleListChange}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-purple-500/50"
                >
                  {allLists.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.priorityLabel')}</label>
                <select
                  value={priority}
                  onChange={handlePriorityChange}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="low">{t('priorities.low')}</option>
                  <option value="medium">{t('priorities.medium')}</option>
                  <option value="high">{t('priorities.high')}</option>
                  <option value="urgent">{t('priorities.urgent')}</option>
                </select>
              </div>
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.descriptionLabel')}</label>
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>{t('taskModal.edit')}</span>
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2.5 px-3 text-sm focus:ring-2 focus:ring-purple-500/50 h-32"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-4 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                    >
                      {t('taskModal.cancel')}
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 cursor-pointer"
                    >
                      {t('taskModal.saveDescription')}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-800/20 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800/40">
                  {description || t('taskModal.noDescription')}
                </p>
              )}
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.attachmentsLabel')}</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                  <span>{t('taskModal.uploadCover')}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {task.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="group border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden relative h-20"
                    >
                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white font-semibold truncate px-2">{att.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">{t('taskModal.noAttachments')}</p>
              )}
            </div>

            {/* Time Tracking Section */}
            <div className="space-y-4 border-t dark:border-zinc-800 pt-6">
              <h3 className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                {t('stats.logTimeTitle', { defaultValue: "Time Tracking & Logs" })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded-xl border dark:border-zinc-800/80">
                {/* Time Estimate Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-500 block">
                    {t('stats.timeEstimateLabel', { defaultValue: "Time Estimate (Hours)" })}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={timeEstimate === 0 ? "" : timeEstimate}
                    onChange={(e) => setTimeEstimate(e.target.value === "" ? 0 : Number(e.target.value))}
                    onBlur={handleTimeEstimateBlur}
                    placeholder={t('stats.timeEstimatePlaceholder', { defaultValue: "e.g. 5" })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Quick Log Form */}
                <form onSubmit={handleLogTimeSubmit} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-500 block">
                    {t('stats.logTimeTitle', { defaultValue: "Log Work Time" })}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Hours"
                      required
                      value={logHours}
                      onChange={(e) => setLogHours(e.target.value)}
                      className="w-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder={t('stats.commentLabel', { defaultValue: "Notes..." })}
                      value={logComment}
                      onChange={(e) => setLogComment(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      {t('stats.logHoursBtn', { defaultValue: "Log" })}
                    </button>
                  </div>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full text-[10px] bg-transparent border-none text-zinc-455 dark:text-zinc-500 focus:outline-hidden mt-1"
                  />
                </form>
              </div>

              {/* List of Time Logs */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-455 dark:text-zinc-500 block">
                  {t('stats.loggedTimeLabel', { defaultValue: "Logged Time Entries" })}
                </label>
                {task.loggedTime && task.loggedTime.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar text-start">
                    {task.loggedTime.map((log: any, idx: number) => {
                      const member = workspaceMembers.find(
                        (m) => m.userId?._id === log.userId || m.userId === log.userId
                      );
                      const memberName = member?.userId?.fullName || "Deleted User";
                      const memberAvatar = member?.userId?.avatarUrl;

                      return (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-zinc-50/50 dark:bg-zinc-850/10 border dark:border-zinc-800/80 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={memberAvatar || "https://api.dicebear.com/7.x/bottts/svg"}
                              alt="Avatar"
                              className="h-5 w-5 rounded-full border bg-zinc-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate block">{memberName}</span>
                              {log.comment && <span className="text-[10px] text-zinc-500 dark:text-zinc-450 truncate block italic">{log.comment}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 font-semibold shrink-0">
                            <span className="text-purple-650 dark:text-purple-400">{log.hours}h</span>
                            <span className="text-[9px] text-zinc-400">
                              {log.date ? new Date(log.date).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-455 italic">{t('stats.noTimeLogged', { defaultValue: "No time logged yet." })}</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Assignees, Comments & Activity (40%) */}
        <div className="w-full md:w-80 bg-zinc-50/70 dark:bg-zinc-900/40 p-6 flex flex-col h-full overflow-y-auto">
          {/* Workspace Members check assignment */}
          <div className="space-y-3 shrink-0 mb-6 border-b dark:border-zinc-800 pb-6">
            <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 block">{t('taskModal.assigneesLabel')}</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pe-1">
              {workspaceMembers.map((m: any) => {
                const isAssigned = task.assignees?.some((a) => a._id === m.userId._id);
                return (
                  <button
                    key={m._id}
                    onClick={() => handleToggleAssignee(m.userId._id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-start text-sm hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={m.userId.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                        alt="avatar"
                        className="h-6 w-6 rounded-full bg-zinc-800 border"
                      />
                      <span className="font-medium truncate">{m.userId.fullName}</span>
                    </div>
                    {isAssigned && <Check className="h-4 w-4 text-purple-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.commentsLabel')}</label>
            </div>

            {/* Scrollable list of comments */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pe-1 text-start">
              {isLoadingComments ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-4">{t('taskModal.noComments')}</p>
              ) : (
                comments.map((c: Comment) => (
                  <div key={c._id} className="flex gap-2.5 items-start">
                    <img
                      src={c.userId.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                      alt="avatar"
                      className="h-7 w-7 rounded-full bg-zinc-850 shrink-0 border"
                    />
                    <div className="flex-1 bg-white dark:bg-zinc-850 p-3 rounded-xl shadow-xs border dark:border-zinc-800/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{c.userId.fullName}</span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Write comment input */}
            <form onSubmit={handlePostComment} className="mt-auto shrink-0 pt-2 border-t dark:border-zinc-800">
              <div className="relative">
                <textarea
                  placeholder={t('taskModal.writeCommentPlaceholder')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 ps-3 pe-10 text-xs focus:ring-2 focus:ring-purple-500/50 outline-hidden h-14 resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={createCommentMutation.isPending}
                  className="absolute end-2.5 bottom-2.5 p-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all cursor-pointer disabled:bg-purple-400"
                >
                  {createCommentMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Main Dashboard Page ---
export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  // Active selections
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [activeTab, setActiveTab] = useState<"kanban" | "team" | "dashboard" | "reports">("kanban");
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

  // Inputs
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState("#aa3bff");
  const [newListName, setNewListName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member" | "guest">("member");

  // target column listId
  const [targetListIdForTask, setTargetListIdForTask] = useState<string | null>(null);

  // --- Queries ---
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: taskflowService.getWorkspaces,
  });
  const workspaces = workspacesData || EMPTY_ARRAY;

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspace) {
      setActiveWorkspace(workspaces[0]);
    }
  }, [workspaces, activeWorkspace]);

  const { data: spacesData, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ["spaces", activeWorkspace?._id],
    queryFn: () => taskflowService.getSpaces(activeWorkspace!._id),
    enabled: !!activeWorkspace?._id,
  });
  const spaces = spacesData || EMPTY_ARRAY;

  useEffect(() => {
    if (spaces.length > 0) {
      setActiveSpace(spaces[0]);
    } else {
      setActiveSpace(null);
    }
  }, [spaces, activeWorkspace]);

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
    enabled: !!activeWorkspace?._id && ["team", "dashboard", "reports"].includes(activeTab),
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
      setActiveWorkspace(newWs);
      setIsWorkspaceModalOpen(false);
      setNewWorkspaceName("");
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (spaceData: { workspaceId: string; name: string; description?: string; color?: string }) =>
      taskflowService.createSpace(spaceData),
    onSuccess: (newSp) => {
      queryClient.invalidateQueries({ queryKey: ["spaces", activeWorkspace?._id] });
      setActiveSpace(newSp);
      setIsSpaceModalOpen(false);
      setNewSpaceName("");
      setNewSpaceDescription("");
    },
  });

  const createListMutation = useMutation({
    mutationFn: (data: { spaceId: string; name: string; position: number }) =>
      taskflowService.createList(data.spaceId, data.name, data.position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", activeSpace?._id] });
      setIsListModalOpen(false);
      setNewListName("");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: { listId: string; title: string; description: string; priority: string }) =>
      taskflowService.createTask(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.listId] });
      setIsTaskModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setTargetListIdForTask(null);
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: (data: { taskId: string; listId: string; status: string }) =>
      taskflowService.updateTask(data.taskId, { listId: data.listId, status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskflowService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      taskflowService.inviteWorkspaceMember(activeWorkspace!._id, data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", activeWorkspace?._id] });
      setIsInviteModalOpen(false);
      setInviteEmail("");
      alert(t('inviteModal.success'));
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || t('inviteModal.failed'));
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      taskflowService.updateWorkspaceMemberRole(activeWorkspace!._id, data.userId, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", activeWorkspace?._id] });
      alert(t('workspaceMembersModal.roleChangeSuccess'));
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || t('workspaceMembersModal.roleChangeFailed'));
    },
  });

  // --- Handlers ---
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createWorkspaceMutation.mutate(newWorkspaceName);
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !activeWorkspace) return;
    createSpaceMutation.mutate({
      workspaceId: activeWorkspace._id,
      name: newSpaceName,
      description: newSpaceDescription,
      color: newSpaceColor,
    });
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || !activeSpace) return;
    createListMutation.mutate({
      spaceId: activeSpace._id,
      name: newListName,
      position: (lists.length + 1) * 1000,
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !targetListIdForTask) return;
    createTaskMutation.mutate({
      listId: targetListIdForTask,
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace) return;
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleOpenSpaceModal = () => {
    if (!["owner", "admin"].includes(currentUserRole)) {
      alert(t('warnings.notAdminSpace'));
      return;
    }
    setIsSpaceModalOpen(true);
  };

  const handleOpenListModal = () => {
    if (!["owner", "admin", "manager"].includes(currentUserRole)) {
      alert(t('warnings.notAdminOrManagerColumn'));
      return;
    }
    setIsListModalOpen(true);
  };

  const openAddTaskModal = (listId: string) => {
    if (!["owner", "admin", "manager", "member"].includes(currentUserRole)) {
      alert(t('warnings.notAuthorizedTask'));
      return;
    }
    setTargetListIdForTask(listId);
    setIsTaskModalOpen(true);
  };

  const handleOpenInviteModal = () => {
    if (!["owner", "admin"].includes(currentUserRole)) {
      alert(t('warnings.notAdminInvite'));
      return;
    }
    setIsInviteModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-950 dark:text-zinc-50 overflow-hidden transition-theme">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col justify-between border-e border-zinc-800/80 shrink-0">
        <div className="flex flex-col overflow-y-auto">
          {/* Header Branding */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center bg-purple-600 rounded-lg text-white font-bold text-lg">
                T
              </div>
              <span className="font-bold text-lg tracking-wide">Taskflow</span>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="p-4 border-b border-zinc-800">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              {t('sidebar.currentWorkspace')}
            </label>
            <div className="relative">
              <select
                value={activeWorkspace?._id || ""}
                onChange={(e) => {
                  const ws = workspaces.find((w) => w._id === e.target.value);
                  if (ws) setActiveWorkspace(ws);
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-sm text-zinc-100 appearance-none focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
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

          {/* Tab Navigation (Board vs Team vs Dashboard vs Reports) */}
          <div className="px-4 py-2 border-b border-zinc-800 space-y-1">
            <button
              onClick={() => {
                setActiveTab("dashboard");
              }}
              className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all text-start cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-zinc-850 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('sidebar.dashboard', { defaultValue: "Widgets Dashboard" })}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
              }}
              className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all text-start cursor-pointer ${
                activeTab === "reports"
                  ? "bg-zinc-850 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>{t('sidebar.reports', { defaultValue: "Reports & Analytics" })}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("kanban");
                if (spaces.length > 0 && !activeSpace) {
                  setActiveSpace(spaces[0]);
                }
              }}
              className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all text-start cursor-pointer ${
                activeTab === "kanban"
                  ? "bg-zinc-850 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>{t('sidebar.board', { defaultValue: "Kanban Board" })}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("team");
              }}
              className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all text-start cursor-pointer ${
                activeTab === "team"
                  ? "bg-zinc-850 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{t('sidebar.team', { defaultValue: "Workspace Team" })}</span>
            </button>
          </div>

          {/* Spaces Navigation */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                {t('sidebar.spaces')} ({spaces.length})
              </span>
              <button
                onClick={handleOpenSpaceModal}
                className="text-zinc-400 hover:text-zinc-100 p-0.5 hover:bg-zinc-800 rounded-md transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {isLoadingSpaces ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-650" />
                </div>
              ) : spaces.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">{t('sidebar.noActiveSpaces')}</p>
              ) : (
                spaces.map((sp) => (
                  <button
                    key={sp._id}
                    onClick={() => {
                      setActiveSpace(sp);
                      setActiveTab("kanban");
                    }}
                    className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all text-start cursor-pointer ${
                      activeSpace?._id === sp._id && activeTab === "kanban"
                        ? "bg-purple-600/10 text-purple-400 font-semibold"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sp.color || "#aa3bff" }}
                    />
                    <span className="truncate">{sp.name}</span>
                  </button>
                ))
              )}
            </nav>
          </div>
        </div>

        {/* Footer Profile */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Demo"}
              alt="Avatar"
              className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 shrink-0"
            />
            <div className="text-start overflow-hidden">
              <p className="text-sm font-semibold text-zinc-100 truncate">{user?.fullName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title={t('sidebar.logOut')}
            className="text-zinc-500 hover:text-red-400 hover:bg-zinc-800 p-1.5 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN BOARD WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {workspaces.length === 0 && !isLoadingWorkspaces ? (
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
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 flex items-center justify-between shrink-0 transition-theme">
              {activeTab === "team" ? (
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
                      <div className="p-3 border-b dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-950/10">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {t('notifications.title', { defaultValue: "Notifications" })} ({unreadCount})
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-[10px] font-bold text-purple-650 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer"
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
                    className="h-7 w-7 rounded-full border border-dashed border-zinc-400 bg-zinc-100 dark:bg-zinc-855 flex items-center justify-center text-zinc-500 hover:text-zinc-955 dark:hover:text-zinc-100 hover:border-zinc-800 hover:bg-white transition-all cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </header>

            {/* Main view body: Board Columns, Team, Dashboard or Reports */}
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
            ) : activeTab === "dashboard" ? (
              <DashboardTab
                workspaceName={activeWorkspace?.name}
                tasks={workspaceTasks}
                members={members}
              />
            ) : activeTab === "reports" ? (
              <ReportsTab
                workspaceName={activeWorkspace?.name}
                tasks={workspaceTasks}
                members={members}
              />
            ) : (
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-zinc-50/50 dark:bg-zinc-950/20 transition-theme kanban-scrollbar">
                <div className="flex gap-4 h-full items-start">
                  {lists.map((list) => (
                    <KanbanColumn
                      key={list._id}
                      list={list}
                      onAddTaskClick={openAddTaskModal}
                      onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
                      onMoveTask={(taskId, listId, status) =>
                        moveTaskMutation.mutate({ taskId, listId, status })
                      }
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
      {isWorkspaceModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-bold">{t('createWorkspaceModal.title')}</h2>
              <button
                onClick={() => setIsWorkspaceModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-4 text-start">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('createWorkspaceModal.label')}</label>
                <input
                  type="text"
                  placeholder={t('createWorkspaceModal.placeholder')}
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createWorkspaceMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {createWorkspaceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('createWorkspaceModal.btnSubmit')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Space Modal */}
      {isSpaceModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-bold">{t('createSpaceModal.title')}</h2>
              <button
                onClick={() => setIsSpaceModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSpace} className="space-y-4 text-start">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('createSpaceModal.labelName')}</label>
                <input
                  type="text"
                  placeholder={t('createSpaceModal.placeholderName')}
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('createSpaceModal.labelDesc')}</label>
                <textarea
                  placeholder={t('createSpaceModal.placeholderDesc')}
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 h-20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500 block mb-1">{t('createSpaceModal.labelColor')}</label>
                <div className="flex gap-2">
                  {["#aa3bff", "#00f2fe", "#f59e0b", "#10b981", "#ef4444"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSpaceColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                        newSpaceColor === c ? "border-zinc-950 dark:border-white scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={createSpaceMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {createSpaceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('createSpaceModal.btnSubmit')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create List Modal */}
      {isListModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-bold">{t('createListModal.title')}</h2>
              <button
                onClick={() => setIsListModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateList} className="space-y-4 text-start">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('createListModal.label')}</label>
                <input
                  type="text"
                  placeholder={t('createListModal.placeholder')}
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createListMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {createListMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('createListModal.btnSubmit')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Task Modal */}
      {isTaskModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-bold">{t('createTaskModal.title')}</h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4 text-start">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('createTaskModal.labelTitle')}</label>
                <input
                  type="text"
                  placeholder={t('createTaskModal.placeholderTitle')}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('createTaskModal.labelDesc')}</label>
                <textarea
                  placeholder={t('createTaskModal.placeholderDesc')}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 h-20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('createTaskModal.labelPriority')}</label>
                <select
                  value={newTaskPriority}
                  onChange={(e: any) => setNewTaskPriority(e.target.value)}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="low">{t('priorities.low')}</option>
                  <option value="medium">{t('priorities.medium')}</option>
                  <option value="high">{t('priorities.high')}</option>
                  <option value="urgent">{t('priorities.urgent')}</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {createTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('createTaskModal.btnSubmit')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Invite/Manage Members Modal */}
      {isInviteModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col transition-theme">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3 shrink-0">
              <h2 className="text-lg font-bold">{t('workspaceMembersModal.title')}</h2>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Split Content: Left Invite Form, Right Members list */}
            <div className="flex flex-col md:flex-row gap-6 overflow-hidden flex-1">
              
              {/* Left Side: Invite Form */}
              <div className="flex-1 space-y-4">
                <h3 className="text-sm font-bold text-zinc-650 dark:text-zinc-350 border-b pb-1 dark:border-zinc-800">
                  {t('workspaceMembersModal.inviteTab')}
                </h3>
                
                <form onSubmit={handleInvite} className="space-y-4 text-start">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-zinc-500">{t('inviteModal.labelEmail')}</label>
                    <input
                      type="email"
                      placeholder={t('inviteModal.placeholderEmail')}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-zinc-500">{t('inviteModal.labelRole')}</label>
                    <select
                      value={inviteRole}
                      onChange={(e: any) => setInviteRole(e.target.value)}
                      className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-855 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="admin">{t('roles.admin')}</option>
                      <option value="manager">{t('roles.manager')}</option>
                      <option value="member">{t('roles.member')}</option>
                      <option value="guest">{t('roles.guest')}</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={inviteMemberMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {inviteMemberMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{t('inviteModal.btnSubmit')}</span>
                  </button>
                </form>
              </div>

              {/* Divider vertical for larger screens */}
              <div className="hidden md:block w-px bg-zinc-150 dark:bg-zinc-800" />

              {/* Right Side: Members List with role updater */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-sm font-bold text-zinc-650 dark:text-zinc-350 border-b pb-1 dark:border-zinc-800 shrink-0 mb-3">
                  {t('workspaceMembersModal.membersTab')}
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 pe-1">
                  {members.map((m: any) => {
                    const isOwner = m.role === "owner";
                    const isSelf = m.userId?._id === user?.id;
                    const canEditRole = ["owner", "admin"].includes(currentUserRole) && !isOwner && !isSelf;

                    return (
                      <div key={m._id} className="flex items-center justify-between p-2 rounded-xl border border-zinc-150 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/10">
                        <div className="flex items-center gap-2 min-w-0">
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

                        <div className="shrink-0 ms-2">
                          {canEditRole ? (
                            <select
                              value={m.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                if (confirm(t('workspaceMembersModal.confirmRoleChange'))) {
                                  updateMemberRoleMutation.mutate({ userId: m.userId?._id, role: newRole });
                                }
                              }}
                              className="bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-lg py-1 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-purple-500 cursor-pointer"
                            >
                              <option value="admin">{t('roles.admin')}</option>
                              <option value="manager">{t('roles.manager')}</option>
                              <option value="member">{t('roles.member')}</option>
                              <option value="guest">{t('roles.guest')}</option>
                            </select>
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
      )}

    </div>
  );
};
