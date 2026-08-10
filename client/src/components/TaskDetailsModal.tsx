import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { taskflowService } from "../services/taskflowService";
import type { List, Task, Attachment } from "../services/taskflowService";
import { useTimeTrackerStore } from "../stores/useTimeTrackerStore";
import {
  X,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Clock,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react";
import { useToastStore } from "../stores/useToastStore";
import { useConfirmStore } from "../stores/useConfirmStore";

// Static reference to prevent empty array literals from re-allocating memory and triggering render loops
const EMPTY_ARRAY: any[] = [];

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  workspaceMembers: any[];
  allLists: List[];
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  workspaceMembers,
  allLists,
}) => {
  const { t, i18n } = useTranslation();
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
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  // Date states
  const [startDate, setStartDate] = useState(task.startDate ? task.startDate.substring(0, 10) : "");
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.substring(0, 10) : "");

  // Time tracking states
  const [timeEstimate, setTimeEstimate] = useState(task.timeEstimate || 0);
  const [logHours, setLogHours] = useState("");
  const [logComment, setLogComment] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const tracker = useTimeTrackerStore();
  const isThisTaskTracked = tracker.activeTaskId === task._id;
  const [elapsedStr, setElapsedStr] = useState("00:00:00");

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((val) => (val < 10 ? `0${val}` : `${val}`))
      .join(":");
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isThisTaskTracked && !tracker.isPaused) {
      interval = setInterval(() => {
        setElapsedStr(formatTime(tracker.getElapsedSeconds()));
      }, 1000);
    } else {
      setElapsedStr(formatTime(tracker.getElapsedSeconds()));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isThisTaskTracked, tracker.isPaused, tracker.startTime, tracker.elapsedSeconds]);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionUserIds, setSelectedMentionUserIds] = useState<string[]>([]);
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState("");

  const [newTagText, setNewTagText] = useState("");

  const handleAddTagSubmit = () => {
    const val = newTagText.trim();
    if (val) {
      const currentTags = task.tags || [];
      if (!currentTags.includes(val)) {
        const updatedTags = [...currentTags, val];
        updateTaskMutation.mutate({ tags: updatedTags });
      }
      setNewTagText("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = task.tags || [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);
    updateTaskMutation.mutate({ tags: updatedTags });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newChecklistItemTitle.trim();
    if (!title) return;

    const currentChecklist = task.checklist || [];
    const updatedChecklist = [...currentChecklist, { title, isCompleted: false }];
    
    updateTaskMutation.mutate({ checklist: updatedChecklist as any });
    setNewChecklistItemTitle("");
  };

  const handleToggleChecklistItem = (itemId: string | undefined, isCompleted: boolean) => {
    if (!itemId) return;
    const currentChecklist = task.checklist || [];
    const updatedChecklist = currentChecklist.map((item) =>
      item._id === itemId ? { ...item, isCompleted } : item
    );
    updateTaskMutation.mutate({ checklist: updatedChecklist as any });
  };

  const handleRemoveChecklistItem = (itemId: string | undefined) => {
    if (!itemId) return;
    const currentChecklist = task.checklist || [];
    const updatedChecklist = currentChecklist.filter((item) => item._id !== itemId);
    updateTaskMutation.mutate({ checklist: updatedChecklist as any });
  };

  const handleCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const selectionStart = e.target.selectionStart;
    const lastAtPos = val.lastIndexOf("@", selectionStart - 1);

    if (lastAtPos !== -1 && (lastAtPos === 0 || val[lastAtPos - 1] === " " || val[lastAtPos - 1] === "\n")) {
      const textSinceAt = val.substring(lastAtPos + 1, selectionStart);
      if (!textSinceAt.includes(" ")) {
        setShowMentionSuggestions(true);
        setMentionSearchText(textSinceAt);
        setMentionStartIndex(lastAtPos);
        return;
      }
    }
    setShowMentionSuggestions(false);
  };

  const handleSelectMention = (member: any) => {
    const beforeAt = commentText.substring(0, mentionStartIndex);
    const afterCursor = commentText.substring(mentionStartIndex + mentionSearchText.length + 1);
    const newText = `${beforeAt}@${member.userId.fullName} ${afterCursor}`;
    
    setCommentText(newText);
    if (!selectedMentionUserIds.includes(member.userId._id)) {
      setSelectedMentionUserIds([...selectedMentionUserIds, member.userId._id]);
    }
    setShowMentionSuggestions(false);
  };

  const filteredMembers = workspaceMembers.filter((m) =>
    m.userId?.fullName?.toLowerCase().includes(mentionSearchText.toLowerCase())
  );

  // Get comments query
  const { data: comments = EMPTY_ARRAY, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", task._id],
    queryFn: () => taskflowService.getComments(task._id),
  });

  // Get activities query
  const { data: activities = EMPTY_ARRAY, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["activities", task._id],
    queryFn: () => taskflowService.getTaskActivities(task._id),
  });

  const feedItems = [
    ...comments.map((c) => ({ ...c, itemType: "comment" as const })),
    ...activities.map((act) => ({ ...act, itemType: "activity" as const })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const renderActivityText = (act: any) => {
    const isAr = i18n.language === 'ar';
    
    if (act.action === "created") {
      return isAr ? `أنشأ هذه المهمة` : `created this task`;
    }
    if (act.action === "moved") {
      return isAr ? `نقل هذه المهمة` : `moved this task`;
    }
    
    const changes = act.details?.changes || {};
    const changeKeys = Object.keys(changes);
    if (changeKeys.length > 0) {
      const descriptions = changeKeys.map((key) => {
        const val = changes[key];
        if (key === "status") {
          return isAr ? `غير الحالة إلى "${val}"` : `changed status to "${val}"`;
        }
        if (key === "priority") {
          return isAr ? `غير الأولوية إلى "${val}"` : `changed priority to "${val}"`;
        }
        if (key === "dueDate") {
          const dateStr = val ? new Date(val).toLocaleDateString() : "";
          return isAr ? `غير تاريخ الاستحقاق إلى ${dateStr}` : `changed due date to ${dateStr}`;
        }
        return isAr ? `عدّل ${key}` : `updated ${key}`;
      });
      return descriptions.join(", ");
    }
    
    return isAr ? `عدّل هذه المهمة` : `updated this task`;
  };

  // Sync state if task updates
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setListId(task.listId);
    setTimeEstimate(task.timeEstimate || 0);
    setStartDate(task.startDate ? task.startDate.substring(0, 10) : "");
    setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");
  }, [task]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    updateTaskMutation.mutate({ startDate: val ? new Date(val).toISOString() : null });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDueDate(val);
    updateTaskMutation.mutate({ dueDate: val ? new Date(val).toISOString() : null });
  };

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (updateData: Partial<Task>) => taskflowService.updateTask(task._id, updateData),
    onMutate: async (updateData) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["workspaceTasks"] });

      // Snapshot previous caches
      const previousWorkspaceQueries = queryClient.getQueriesData({ queryKey: ["workspaceTasks"] });
      const previousColumnTasks = queryClient.getQueryData(["tasks", task.listId]);

      // Optimistically update ["workspaceTasks", ...]
      queryClient.setQueriesData({ queryKey: ["workspaceTasks"] }, (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((t) => (t._id === task._id ? { ...t, ...updateData } : t));
      });

      // Optimistically update ["tasks", listId]
      queryClient.setQueryData(["tasks", task.listId], (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        
        // If listId changed, we might need to remove it from this list or move it
        if (updateData.listId && updateData.listId !== task.listId) {
          // Remove from source list
          return oldData.filter((t) => t._id !== task._id);
        }
        
        return oldData.map((t) => (t._id === task._id ? { ...t, ...updateData } : t));
      });

      // If listId changed, we also need to add it to the target list
      let previousTargetTasks: Task[] | undefined;
      if (updateData.listId && updateData.listId !== task.listId) {
        previousTargetTasks = queryClient.getQueryData(["tasks", updateData.listId]);
        queryClient.setQueryData(["tasks", updateData.listId], (oldData: Task[] | undefined) => {
          const targetTasks = oldData || [];
          const updatedTask = { ...task, ...updateData };
          if (!targetTasks.some((t) => t._id === task._id)) {
            return [...targetTasks, updatedTask];
          }
          return targetTasks.map((t) => (t._id === task._id ? updatedTask : t));
        });
      }

      return { previousWorkspaceQueries, previousColumnTasks, previousTargetTasks, targetListId: updateData.listId };
    },
    onError: (_err, _updateData, context) => {
      // Rollback on error
      if (context) {
        context.previousWorkspaceQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
        queryClient.setQueryData(["tasks", task.listId], context.previousColumnTasks);
        if (context.targetListId && context.previousTargetTasks) {
          queryClient.setQueryData(["tasks", context.targetListId], context.previousTargetTasks);
        }
      }
    },
    onSettled: () => {
      // Invalidate queries to sync with backend
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (payload: { content: string; mentions: string[] }) =>
      taskflowService.createComment(task._id, payload.content, payload.mentions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task._id] });
      setCommentText("");
      setSelectedMentionUserIds([]);
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
        useToastStore.getState().addToast(t('taskModal.uploadCoverFailed'), "error");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = async (publicId: string) => {
    setDeletingAttachmentId(publicId);
    try {
      const currentAttachments = task.attachments || [];
      const updatedAttachments = currentAttachments.filter((att) => (att.publicId || att.name) !== publicId);
      await updateTaskMutation.mutateAsync({
        attachments: updatedAttachments,
      });
    } catch (err) {
      useToastStore.getState().addToast("Failed to delete attachment", "error");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate({
      content: commentText,
      mentions: selectedMentionUserIds,
    });
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
      useToastStore.getState().addToast("Please enter a valid number of hours.", "warning");
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

            {/* Start Date & Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.startDateLabel', { defaultValue: "Start Date" })}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.dueDateLabel', { defaultValue: "Due Date" })}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={handleDueDateChange}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            {/* Tags / Labels Row */}
            <div className="space-y-2 text-start">
              <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
                {t('taskModal.tagsLabel', { defaultValue: "Tags & Labels" })}
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {task.tags && task.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-650 dark:text-purple-400 border border-purple-200/25 dark:border-purple-800/30 group"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-450 hover:text-red-500 transition-all cursor-pointer font-bold leading-none text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                
                {/* Inline Add Tag input with Save/Add button */}
                <div className="flex gap-1.5 items-center shrink-0">
                  <input
                    type="text"
                    placeholder={t('taskModal.addTagPlaceholder', { defaultValue: "New tag..." })}
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTagSubmit();
                      }
                    }}
                    className="bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500 w-24 transition-all text-zinc-850 dark:text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddTagSubmit}
                    className="px-2 py-1 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {t('taskModal.addTagBtn', { defaultValue: "Add" })}
                  </button>
                </div>
              </div>
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.descriptionLabel')}</label>
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-purple-650 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
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
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2.5 px-3 text-sm focus:ring-2 focus:ring-purple-500/50 h-32"
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
                <p className="text-sm text-zinc-650 dark:text-zinc-355 leading-relaxed bg-zinc-50/50 dark:bg-zinc-800/20 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800/40">
                  {description || t('taskModal.noDescription')}
                </p>
              )}
            </div>

            {/* Checklist / Subtasks Section */}
            <div className="space-y-3 text-start">
              {(() => {
                const checklist = task.checklist || [];
                const total = checklist.length;
                const completed = checklist.filter((item) => item.isCompleted).length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
                        {t('taskModal.checklistLabel', { defaultValue: "Subtasks & Checklist" })}
                      </label>
                      <span className="text-xs font-bold text-purple-650 dark:text-purple-400">{percentage}%</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Subtasks list */}
                    {total > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {checklist.map((item: any) => (
                          <div key={item._id} className="flex items-center justify-between gap-2 group hover:bg-zinc-55 dark:hover:bg-zinc-850 p-1.5 rounded-lg transition-all border border-transparent hover:border-zinc-200/40 dark:hover:border-zinc-800/40">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs flex-1 text-zinc-805 dark:text-zinc-300">
                              <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={() => handleToggleChecklistItem(item._id, !item.isCompleted)}
                                className="h-4 w-4 rounded-sm border-zinc-305 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                              <span className={item.isCompleted ? "line-through text-zinc-400 dark:text-zinc-500" : ""}>
                                {item.title}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveChecklistItem(item._id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-450 hover:text-red-500 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Add Checklist Item inline form */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newChecklistItemTitle}
                  onChange={(e) => setNewChecklistItemTitle(e.target.value)}
                  placeholder={t('taskModal.newSubtaskPlaceholder', { defaultValue: "Add a subtask..." })}
                  className="flex-1 bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100 outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  {t('taskModal.addSubtask', { defaultValue: "Add" })}
                </button>
              </form>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">{t('taskModal.attachmentsLabel')}</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs text-purple-650 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
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

              {(task.attachments && task.attachments.length > 0) || isUploading ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {task.attachments && task.attachments.map((att, idx) => {
                    const uniqueId = att.publicId || att.name || `b64-${idx}`;
                    const isDeleting = deletingAttachmentId === uniqueId;
                    return (
                      <div
                        key={idx}
                        className="group border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden relative h-20 hover:border-purple-500/50 transition-all"
                      >
                        <img
                          src={att.url}
                          alt={att.name}
                          onClick={() => !isDeleting && setPreviewImageUrl(att.url)}
                          className="w-full h-full object-cover cursor-zoom-in"
                        />
                        <div
                          onClick={() => !isDeleting && setPreviewImageUrl(att.url)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in"
                        >
                          <span className="text-[10px] text-white font-semibold truncate px-2">{att.name}</span>
                        </div>

                        {isDeleting ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmed = await useConfirmStore.getState().show({
                                title: t('taskModal.deleteAttachmentTitle', { defaultValue: "Delete Attachment" }),
                                message: t('taskModal.confirmDeleteAttachment', { defaultValue: "Are you sure you want to delete this attachment?" }),
                                confirmText: t('common.delete', { defaultValue: "Delete" }),
                                cancelText: t('common.cancel', { defaultValue: "Cancel" }),
                              });
                              if (confirmed) {
                                handleDeleteAttachment(uniqueId);
                              }
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-750 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 shadow-sm"
                            title={t('taskModal.deleteAttachment', { defaultValue: "Delete Attachment" })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {isUploading && (
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center h-20 bg-zinc-100/50 dark:bg-zinc-800/20 animate-pulse">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-650 dark:text-purple-400" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-555 italic">{t('taskModal.noAttachments')}</p>
              )}
            </div>

            {/* Time Tracking Section */}
            <div className="space-y-4 border-t dark:border-zinc-800 pt-6">
              <h3 className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                {t('stats.logTimeTitle', { defaultValue: "Time Tracking & Logs" })}
              </h3>

              {/* Interactive Timer Controls */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950/20 border dark:border-zinc-850 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Clock className={`h-4.5 w-4.5 shrink-0 ${isThisTaskTracked && !tracker.isPaused ? "text-purple-500 animate-pulse" : "text-zinc-400"}`} />
                  <span className="font-bold">
                    {isThisTaskTracked
                      ? tracker.isPaused
                        ? "Timer Paused"
                        : "Timer Running"
                      : "Track Time"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isThisTaskTracked && (
                    <span className="font-mono text-xs font-black text-purple-650 dark:text-purple-400 bg-purple-500/5 px-2.5 py-1 rounded-lg border border-purple-500/10">
                      {elapsedStr}
                    </span>
                  )}

                  <div className="flex gap-1.5">
                    {isThisTaskTracked ? (
                      <>
                        {tracker.isPaused ? (
                          <button
                            type="button"
                            onClick={tracker.resume}
                            className="bg-purple-650 hover:bg-purple-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                          >
                            Resume
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={tracker.pause}
                            className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                          >
                            Pause
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const totalSec = tracker.stop();
                            const hoursDecimal = Math.max(0.01, Number((totalSec / 3600).toFixed(2)));
                            setLogHours(hoursDecimal.toString());
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                        >
                          Stop & Log
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => tracker.start(task._id, task.title)}
                        disabled={tracker.activeTaskId !== null}
                        className="bg-purple-650 hover:bg-purple-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                        title={tracker.activeTaskId !== null ? "Another timer is currently running" : ""}
                      >
                        Start Timer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-zinc-55/30 dark:bg-zinc-950/20 p-4 rounded-xl border dark:border-zinc-800/80">
                {/* Time Estimate Row */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b dark:border-zinc-850">
                  <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-500 block">
                    {t('stats.timeEstimateLabel', { defaultValue: "Time Estimate" })}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={timeEstimate === 0 ? "" : timeEstimate}
                      onChange={(e) => setTimeEstimate(e.target.value === "" ? 0 : Number(e.target.value))}
                      onBlur={handleTimeEstimateBlur}
                      placeholder="Hours"
                      className="w-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1 px-2.5 text-xs text-center focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                    />
                    <span className="text-xs text-zinc-400 font-semibold">{t('timeTracker.hours')}</span>
                  </div>
                </div>

                {/* Quick Log Form Row */}
                <form onSubmit={handleLogTimeSubmit} className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-455 dark:text-zinc-500 block">
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
                      className="w-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                    />
                    <input
                      type="text"
                      placeholder={t('stats.commentLabel', { defaultValue: "Notes..." })}
                      value={logComment}
                      onChange={(e) => setLogComment(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="submit"
                      className="bg-purple-650 hover:bg-purple-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      {t('stats.logHoursBtn', { defaultValue: "Log" })}
                    </button>
                  </div>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="text-[10px] bg-transparent border-none text-zinc-455 dark:text-zinc-555 focus:outline-hidden"
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
              <label className="text-xs font-bold uppercase text-zinc-455 dark:text-zinc-500">
                {t('taskModal.commentsLabel', { defaultValue: "Comments & Activity" })}
              </label>
            </div>

            {/* Scrollable list of comments & activities */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pe-1 text-start">
              {isLoadingComments || isLoadingActivities ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              ) : feedItems.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-555 italic py-4">{t('taskModal.noComments')}</p>
              ) : (
                feedItems.map((item: any) => {
                  if (item.itemType === "comment") {
                    return (
                      <div key={item._id} className="flex gap-2.5 items-start">
                        <img
                          src={item.userId.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                          alt="avatar"
                          className="h-7 w-7 rounded-full bg-zinc-850 shrink-0 border"
                        />
                        <div className="flex-1 bg-white dark:bg-zinc-850 p-3 rounded-xl shadow-xs border dark:border-zinc-800/40">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{item.userId.fullName}</span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">{item.content}</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item._id} className="flex gap-2.5 items-center pl-1">
                        <img
                          src={item.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                          alt="avatar"
                          className="h-5.5 w-5.5 rounded-full bg-zinc-850 shrink-0 border dark:border-zinc-800"
                        />
                        <div className="flex-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 mr-1">
                            {item.userId?.fullName || "User"}
                          </span>
                          <span>{renderActivityText(item)}</span>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 ml-2 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>

            {/* Write comment input */}
            <form onSubmit={handlePostComment} className="mt-auto shrink-0 pt-2 border-t dark:border-zinc-800 relative">
              {showMentionSuggestions && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-zinc-855 border dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 text-start">
                  {filteredMembers.map((m: any) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => handleSelectMention(m)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-350 transition-all cursor-pointer"
                    >
                      <img
                        src={m.userId.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                        alt="avatar"
                        className="h-5.5 w-5.5 rounded-full border bg-zinc-800 shrink-0"
                      />
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{m.userId.fullName}</span>
                      <span className="text-[10px] text-zinc-400">({m.userId.email})</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <textarea
                  placeholder={t('taskModal.writeCommentPlaceholder')}
                  value={commentText}
                  onChange={handleCommentTextChange}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 ps-3 pe-10 text-xs focus:ring-2 focus:ring-purple-500/50 outline-hidden h-14 resize-none text-zinc-900 dark:text-zinc-100"
                  required
                />
                <button
                  type="submit"
                  disabled={createCommentMutation.isPending}
                  className="absolute end-2.5 bottom-2.5 p-1 bg-purple-650 hover:bg-purple-700 text-white rounded-lg transition-all cursor-pointer disabled:bg-purple-400"
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

      {/* Full-screen Image Lightbox Preview */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center cursor-zoom-out p-4 animate-fade-in"
        >
          <img
            src={previewImageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 end-4 bg-zinc-900/60 hover:bg-zinc-900 text-white rounded-full p-2 cursor-pointer shadow-md transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
};
