import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; priority: "low" | "medium" | "high" | "urgent" }) => void;
  isPending: boolean;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) => {
  const { t } = useTranslation();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  React.useEffect(() => {
    if (!isOpen) {
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskPriority("medium");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onSubmit({
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
          <h2 className="text-lg font-bold">{t('createTaskModal.title')}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">{t('createTaskModal.labelTitle')}</label>
            <input
              type="text"
              placeholder={t('createTaskModal.placeholderTitle')}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">{t('createTaskModal.labelDesc')}</label>
            <textarea
              placeholder={t('createTaskModal.placeholderDesc')}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 h-20 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">{t('createTaskModal.labelPriority')}</label>
            <select
              value={newTaskPriority}
              onChange={(e: any) => setNewTaskPriority(e.target.value)}
              className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
            >
              <option value="low">{t('priorities.low')}</option>
              <option value="medium">{t('priorities.medium')}</option>
              <option value="high">{t('priorities.high')}</option>
              <option value="urgent">{t('priorities.urgent')}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{t('createTaskModal.btnSubmit')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
