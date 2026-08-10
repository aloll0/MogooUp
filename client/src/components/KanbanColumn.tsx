import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { taskflowService } from "../services/taskflowService";
import type { List, Task } from "../services/taskflowService";
import { Plus, Trash2, Paperclip, CheckSquare, Loader2 } from "lucide-react";

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
  allLists: _allLists,
  currentUserRole,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [columnName, setColumnName] = useState(list.name);

  useEffect(() => {
    setColumnName(list.name);
  }, [list.name]);

  const queryClient = useQueryClient();
  const updateListMutation = useMutation({
    mutationFn: (newName: string) => taskflowService.updateList(list._id, { name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", list.spaceId] });
    },
  });

  const handleSaveName = () => {
    const trimmed = columnName.trim();
    if (trimmed && trimmed !== list.name) {
      updateListMutation.mutate(trimmed);
    }
    setIsEditingName(false);
  };

  const canEditColumn = ["owner", "admin", "manager"].includes(currentUserRole);

  // Query tasks for this specific list ID. Standard React Query caching.
  const { data: tasks = EMPTY_ARRAY, isLoading } = useQuery({
    queryKey: ["tasks", list._id],
    queryFn: () => taskflowService.getTasksByList(list._id),
  });

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
          onMoveTask(taskId, list._id, list.name.toLowerCase().replace(/\s+/g, "-"));
        }
      }}
      className={`w-72 shrink-0 rounded-xl flex flex-col max-h-full transition-all duration-200 border-2 ${
        isDragOver
          ? "bg-purple-500/10 border-purple-500 border-dashed"
          : "bg-zinc-100/70 dark:bg-zinc-900/60 border-zinc-250/20 dark:border-zinc-800/80"
      }`}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isEditingName ? (
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveName();
                } else if (e.key === "Escape") {
                  setColumnName(list.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="font-semibold text-sm bg-zinc-55 dark:bg-zinc-950 border border-purple-500 rounded px-1.5 py-0.5 outline-hidden w-full focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
            />
          ) : (
            <span
              onClick={() => {
                if (canEditColumn) {
                  setIsEditingName(true);
                }
              }}
              title={canEditColumn ? "Click to edit column name" : undefined}
              className={`font-semibold text-sm truncate px-1.5 py-0.5 rounded select-none max-w-[150px] block ${
                canEditColumn ? "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 cursor-pointer" : ""
              }`}
            >
              {list.name}
            </span>
          )}
          <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-500 shrink-0 select-none">
            {tasks.length}
          </span>
        </div>

        {/* Action button */}
        <div className="flex items-center">
          <button
            onClick={() => onAddTaskClick(list._id)}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-850 rounded-md text-zinc-500 hover:text-zinc-955 dark:hover:text-zinc-55 transition-all cursor-pointer"
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
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData("text/plain", task._id);
                }}
                className="bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 p-3 rounded-lg shadow-sm hover:shadow-md transition-all relative group text-start cursor-grab active:cursor-grabbing overflow-hidden"
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

                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {task.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/35 text-purple-655 dark:text-purple-400 uppercase tracking-wide border border-purple-200/30 dark:border-purple-800/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tags & Assignees */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full select-none capitalize ${getPriorityColor(task.priority)}`}>
                      {t(`priorities.${task.priority}`)}
                    </span>
                    {task.attachments && task.attachments.length > 0 && (
                      <span className="text-[10px] flex items-center gap-0.5 text-zinc-400 font-semibold">
                        <Paperclip className="h-2.5 w-2.5" />
                        {task.attachments.length}
                      </span>
                    )}
                    {task.checklist && task.checklist.length > 0 && (
                      <span className="text-[10px] flex items-center gap-0.5 text-zinc-400 font-semibold select-none">
                        <CheckSquare className="h-2.5 w-2.5" />
                        {task.checklist.filter(c => c.isCompleted).length}/{task.checklist.length}
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
              </div>
            );
          })
        )}
      </div>

      {/* Add Task footer trigger */}
      <button
        onClick={() => onAddTaskClick(list._id)}
        className="m-2 py-2 flex items-center justify-center gap-1.5 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-855/50 transition-all cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{t('kanban.addTask')}</span>
      </button>
    </div>
  );
};
