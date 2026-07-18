import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { mogooService } from "../services/mogooService";
import type { Workspace, Space, List, Task, Comment, Attachment } from "../services/mogooService";
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
  User,
  Clock,
  Image as ImageIcon,
  Edit3,
} from "lucide-react";

// Static reference to prevent empty array literals from re-allocating memory and triggering render loops
const EMPTY_ARRAY: any[] = [];

// --- Decoupled Kanban Column Component ---
interface KanbanColumnProps {
  list: List;
  onAddTaskClick: (listId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, listId: string, status: string) => void;
  onTaskClick: (task: Task) => void;
  allLists: List[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  list,
  onAddTaskClick,
  onDeleteTask,
  onMoveTask,
  onTaskClick,
  allLists,
}) => {
  // Query tasks for this specific list ID. Standard React Query caching.
  const { data: tasks = EMPTY_ARRAY, isLoading } = useQuery({
    queryKey: ["tasks", list._id],
    queryFn: () => mogooService.getTasksByList(list._id),
  });

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

  return (
    <div className="w-72 bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col max-h-full transition-theme">
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
            No tasks in list
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
                className="bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 p-3 rounded-lg shadow-sm hover:shadow-md transition-all relative group text-left cursor-pointer overflow-hidden"
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
                      if (confirm("Are you sure you want to delete this task?")) {
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
                      {task.priority}
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
                        Move to {targetList.name}
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
        <span>Add Task</span>
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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable task state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [priority, setPriority] = useState(task.priority);
  const [listId, setListId] = useState(task.listId);
  const [isUploading, setIsUploading] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");

  // Get comments query
  const { data: comments = EMPTY_ARRAY, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", task._id],
    queryFn: () => mogooService.getComments(task._id),
  });

  // Sync state if task updates
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setListId(task.listId);
  }, [task]);

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (updateData: Partial<Task>) => mogooService.updateTask(task._id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => mogooService.createComment(task._id, content),
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
        alert("Failed to upload image cover.");
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
          className="absolute top-4 right-4 z-20 h-8 w-8 bg-zinc-900/60 text-white rounded-full flex items-center justify-center hover:bg-zinc-900 transition-all cursor-pointer shadow-md"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* LEFT COLUMN: Main task properties & files (60%) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto border-r border-zinc-100 dark:border-zinc-800/80">
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
              <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">Task Title</label>
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
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">Status / Column</label>
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
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">Priority</label>
                <select
                  value={priority}
                  onChange={handlePriorityChange}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">Description</label>
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
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
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 cursor-pointer"
                    >
                      Save Description
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-800/20 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800/40">
                  {description || "No description set for this task."}
                </p>
              )}
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">Attachments</label>
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
                  <span>Upload Cover Image</span>
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
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No attachments uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Assignees, Comments & Activity (40%) */}
        <div className="w-full md:w-80 bg-zinc-50/70 dark:bg-zinc-900/40 p-6 flex flex-col h-full overflow-y-auto">
          {/* Workspace Members check assignment */}
          <div className="space-y-3 shrink-0 mb-6 border-b dark:border-zinc-800 pb-6">
            <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 block">Assignees</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {workspaceMembers.map((m: any) => {
                const isAssigned = task.assignees?.some((a) => a._id === m.userId._id);
                return (
                  <button
                    key={m._id}
                    onClick={() => handleToggleAssignee(m.userId._id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left text-sm hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
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
              <label className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">Comments & Activity</label>
            </div>

            {/* Scrollable list of comments */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 text-left">
              {isLoadingComments ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-4">No comments posted yet.</p>
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
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-3 pr-10 text-xs focus:ring-2 focus:ring-purple-500/50 outline-hidden h-14 resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={createCommentMutation.isPending}
                  className="absolute right-2.5 bottom-2.5 p-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all cursor-pointer disabled:bg-purple-400"
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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  // Active selections
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);

  // Selected task detail view modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modals
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

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
    queryFn: mogooService.getWorkspaces,
  });
  const workspaces = workspacesData || EMPTY_ARRAY;

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspace) {
      setActiveWorkspace(workspaces[0]);
    }
  }, [workspaces, activeWorkspace]);

  const { data: spacesData, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ["spaces", activeWorkspace?._id],
    queryFn: () => mogooService.getSpaces(activeWorkspace!._id),
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
    queryFn: () => mogooService.getLists(activeSpace!._id),
    enabled: !!activeSpace?._id,
  });
  const lists = listsData || EMPTY_ARRAY;

  const { data: membersData } = useQuery({
    queryKey: ["members", activeWorkspace?._id],
    queryFn: () => mogooService.getWorkspaceMembers(activeWorkspace!._id),
    enabled: !!activeWorkspace?._id,
  });
  const members = membersData || EMPTY_ARRAY;

  // Track task detailed update by query mapping
  const currentTaskDetails = selectedTask
    ? (queryClient.getQueryData(["tasks", selectedTask.listId]) as Task[])?.find((t) => t._id === selectedTask._id) || selectedTask
    : null;

  // --- Mutations ---
  const createWorkspaceMutation = useMutation({
    mutationFn: (name: string) => mogooService.createWorkspace(name),
    onSuccess: (newWs) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setActiveWorkspace(newWs);
      setIsWorkspaceModalOpen(false);
      setNewWorkspaceName("");
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (spaceData: { workspaceId: string; name: string; description?: string; color?: string }) =>
      mogooService.createSpace(spaceData),
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
      mogooService.createList(data.spaceId, data.name, data.position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", activeSpace?._id] });
      setIsListModalOpen(false);
      setNewListName("");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: { listId: string; title: string; description: string; priority: string }) =>
      mogooService.createTask(data),
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
      mogooService.updateTask(data.taskId, { listId: data.listId, status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => mogooService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      mogooService.inviteWorkspaceMember(activeWorkspace!._id, data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", activeWorkspace?._id] });
      setIsInviteModalOpen(false);
      setInviteEmail("");
      alert("Member invited successfully!");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error?.message || "Invitation failed.");
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

  const openAddTaskModal = (listId: string) => {
    setTargetListIdForTask(listId);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-950 dark:text-zinc-50 overflow-hidden transition-theme">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col justify-between border-r border-zinc-800/80 shrink-0">
        <div className="flex flex-col overflow-y-auto">
          {/* Header Branding */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center bg-purple-600 rounded-lg text-white font-bold text-lg">
                M
              </div>
              <span className="font-bold text-lg tracking-wide">Mogoo</span>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="p-4 border-b border-zinc-800">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Current Workspace
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
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Workspace</span>
            </button>
          </div>

          {/* Spaces Navigation */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Spaces ({spaces.length})
              </span>
              <button
                onClick={() => setIsSpaceModalOpen(true)}
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
                <p className="text-xs text-zinc-500 text-center py-4">No active spaces yet.</p>
              ) : (
                spaces.map((sp) => (
                  <button
                    key={sp._id}
                    onClick={() => setActiveSpace(sp)}
                    className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all text-left cursor-pointer ${
                      activeSpace?._id === sp._id
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
            <div className="text-left overflow-hidden">
              <p className="text-sm font-semibold text-zinc-100 truncate">{user?.fullName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
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
            <h1 className="text-3xl font-extrabold mb-3">Welcome to Mogoo!</h1>
            <p className="text-zinc-550 dark:text-zinc-400 mb-8 leading-relaxed">
              Every project space requires a workspace to start. Setup your workspace to launch lists and Kanban cards.
            </p>
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Create Your First Workspace
            </button>
          </div>
        ) : !activeSpace ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <Layers className="h-16 w-16 text-purple-500 mb-6 animate-pulse" />
            <h1 className="text-2xl font-bold mb-3">No Spaces Registered</h1>
            <p className="text-zinc-500 mb-8 leading-relaxed">
              Spaces let you categorize sprints, teams, or folders. Setup your first space in <span className="font-semibold text-zinc-950 dark:text-zinc-50">{activeWorkspace?.name}</span>.
            </p>
            <button
              onClick={() => setIsSpaceModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Create Space
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Toolbar */}
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 flex items-center justify-between shrink-0 transition-theme">
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: activeSpace.color || "#aa3bff" }}
                />
                <h1 className="text-xl font-bold tracking-tight">{activeSpace.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md text-zinc-500 dark:text-zinc-400 select-none">
                  Kanban Board
                </span>
              </div>

              {/* Invite Members */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  title="Toggle Light/Dark Theme"
                  className="p-2 text-zinc-550 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-55 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>

                <div className="flex items-center -space-x-2 overflow-hidden">
                  {members.map((m: any) => (
                    <img
                      key={m._id}
                      title={`${m.userId.fullName} (${m.role})`}
                      src={m.userId.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                      alt="member"
                      className="h-7 w-7 rounded-full border border-white dark:border-zinc-900 bg-zinc-800"
                    />
                  ))}
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="h-7 w-7 rounded-full border border-dashed border-zinc-400 bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:border-zinc-800 hover:bg-white transition-all cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </header>

            {/* Kanban Columns Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-zinc-50/50 dark:bg-zinc-950/20 transition-theme">
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
                  />
                ))}

                {/* Create Column Column Trigger */}
                <button
                  onClick={() => setIsListModalOpen(true)}
                  className="w-72 border border-dashed border-zinc-350 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-zinc-500 hover:text-purple-500 hover:bg-purple-500/5 shrink-0 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>Create Column</span>
                </button>
              </div>
            </div>
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
              <h2 className="text-lg font-bold">Create a Workspace</h2>
              <button
                onClick={() => setIsWorkspaceModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. engineering, design team"
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
                <span>Create Workspace</span>
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
              <h2 className="text-lg font-bold">Create a Project Space</h2>
              <button
                onClick={() => setIsSpaceModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSpace} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Space Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sprints, Roadmaps"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
                <textarea
                  placeholder="What is this space for?"
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 h-20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500 block mb-1">Color Theme</label>
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
                <span>Create Space</span>
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
              <h2 className="text-lg font-bold">Add Kanban Column</h2>
              <button
                onClick={() => setIsListModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateList} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Column Title</label>
                <input
                  type="text"
                  placeholder="e.g. Backlog, Ready for Review"
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
                <span>Create Column</span>
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
              <h2 className="text-lg font-bold">Add Task Card</h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Task Title</label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
                <textarea
                  placeholder="Write a description..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 h-20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e: any) => setNewTaskPriority(e.target.value)}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {createTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Add Task</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-bold">Invite to Workspace</h2>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Email Address</label>
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviteMemberMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {inviteMemberMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Invite User</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
