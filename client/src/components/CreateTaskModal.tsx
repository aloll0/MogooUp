import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { taskflowService } from "../services/taskflowService";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    clientProjectId: string;
    projectName: string;
    assignees: string[];
    dueDate: string;
    notes?: string;
  }) => void;
  isPending: boolean;
  workspaceId: string;
  workspaceMembers: any[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  workspaceId,
  workspaceMembers = [],
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  // New Required Fields States
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [isCustomProject, setIsCustomProject] = useState(false);
  const [customProjectName, setCustomProjectName] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [dueDateStr, setDueDateStr] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  // Query to fetch workspace ClientProjects
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clientProjects", workspaceId],
    queryFn: () => taskflowService.getClientProjects(workspaceId),
    enabled: !!workspaceId && isOpen,
  });

  const selectedClientObj = clients.find((c) => c._id === selectedCompanyId);
  const activeServices = selectedClientObj
    ? selectedClientObj.services.filter((s) => s.isChecked).map((s) => s.name)
    : [];

  useEffect(() => {
    if (!isOpen) {
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskPriority("medium");
      setSelectedCompanyId("");
      setSelectedProject("");
      setIsCustomProject(false);
      setCustomProjectName("");
      setSelectedAssignee("");
      setDueDateStr("");
      setTaskNotes("");
    }
  }, [isOpen]);

  // Sync project select when client changes
  useEffect(() => {
    if (activeServices.length > 0) {
      setSelectedProject(activeServices[0]);
      setIsCustomProject(false);
    } else {
      setSelectedProject("");
      setIsCustomProject(true);
    }
  }, [selectedCompanyId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (!selectedCompanyId) return;
    
    const finalProjectName = isCustomProject ? customProjectName.trim() : selectedProject;
    if (!finalProjectName) return;

    if (!selectedAssignee) return;
    if (!dueDateStr) return;

    onSubmit({
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      priority: newTaskPriority,
      clientProjectId: selectedCompanyId,
      projectName: finalProjectName,
      assignees: [selectedAssignee],
      dueDate: new Date(dueDateStr).toISOString(),
      notes: taskNotes.trim() || undefined,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {isAr ? "إنشاء مهمة جديدة" : t("createTaskModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-start max-h-[70vh] overflow-y-auto pr-1">
          {/* Company / Client (Required) */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
              {isAr ? "الشركة / العميل *" : "Company / Client *"}
            </label>
            {isLoadingClients ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400 py-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading Client Profiles...</span>
              </div>
            ) : (
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                required
              >
                <option value="">{isAr ? "اختر عميل / متجر..." : "Select Client / Store..."}</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Project (Required) */}
          {selectedCompanyId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
                  {isAr ? "المشروع / الخدمة *" : "Project / Service *"}
                </label>
                {activeServices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomProject(!isCustomProject);
                      setCustomProjectName("");
                    }}
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {isCustomProject
                      ? (isAr ? "اختر من الخدمات النشطة" : "Select from active services")
                      : (isAr ? "إدخال اسم مشروع مخصص" : "Enter custom project name")}
                  </button>
                )}
              </div>

              {!isCustomProject && activeServices.length > 0 ? (
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                  required
                >
                  {activeServices.map((srv, idx) => (
                    <option key={idx} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={isAr ? "مثال: تصميم بانر رمضان، برمجة الصفحة الرئيسية..." : "e.g. Ramadan Banner design, Homepage coding..."}
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                  required
                />
              )}
            </div>
          )}

          {/* Task Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
              {t("createTaskModal.labelTitle")} *
            </label>
            <input
              type="text"
              placeholder={t("createTaskModal.placeholderTitle")}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
              {t("createTaskModal.labelDesc")}
            </label>
            <textarea
              placeholder={t("createTaskModal.placeholderDesc")}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 h-16 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Assignee (Mandatory) & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
                {isAr ? "الموظف المسؤول *" : "Assigned Employee *"}
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                required
              >
                <option value="">{isAr ? "اختر موظف..." : "Select Employee..."}</option>
                {workspaceMembers.map((m: any) => {
                  const u = m.userId;
                  if (!u) return null;
                  return (
                    <option key={u._id} value={u._id}>
                      {u.fullName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
                {t("createTaskModal.labelPriority")}
              </label>
              <select
                value={newTaskPriority}
                onChange={(e: any) => setNewTaskPriority(e.target.value)}
                className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
              >
                <option value="low">{t("priorities.low")}</option>
                <option value="medium">{t("priorities.medium")}</option>
                <option value="high">{t("priorities.high")}</option>
                <option value="urgent">{t("priorities.urgent")}</option>
              </select>
            </div>
          </div>

          {/* Due Date & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
                {isAr ? "تاريخ الاستحقاق (Deadline) *" : "Due Date (Deadline) *"}
              </label>
              <input
                type="datetime-local"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-855 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-450 dark:text-zinc-550 block">
                {isAr ? "ملاحظات إضافية" : "Additional Notes"}
              </label>
              <input
                type="text"
                placeholder={isAr ? "ملاحظة أولية للتاسك..." : "Initial task comments..."}
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-855 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !selectedCompanyId || !selectedAssignee || !dueDateStr || !newTaskTitle.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isAr ? "إنشاء المهمة" : t("createTaskModal.btnSubmit")}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
