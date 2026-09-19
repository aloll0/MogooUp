import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Calendar, Sparkles, LayoutList, AlignLeft } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    listId?: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: string;
  }) => void;
  isPending: boolean;
  lists?: any[];
  defaultListId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  lists = [],
  defaultListId,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDateStr, setDueDateStr] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedListId(defaultListId || lists[0]?._id || "");
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskPriority("medium");
      setDueDateStr("");
    }
  }, [isOpen, defaultListId, lists]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onSubmit({
      listId: selectedListId || defaultListId || lists[0]?._id,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      priority: newTaskPriority,
      dueDate: dueDateStr ? new Date(dueDateStr).toISOString() : undefined,
    });
  };

  const priorityOptions: Array<{
    id: "low" | "medium" | "high" | "urgent";
    label: string;
    color: string;
    activeBg: string;
    activeBorder: string;
  }> = [
    {
      id: "low",
      label: isAr ? "منخفضة" : "Low",
      color: "text-emerald-400",
      activeBg: "bg-emerald-500/15",
      activeBorder: "border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]",
    },
    {
      id: "medium",
      label: isAr ? "متوسطة" : "Medium",
      color: "text-amber-400",
      activeBg: "bg-amber-500/15",
      activeBorder: "border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    },
    {
      id: "high",
      label: isAr ? "عالية" : "High",
      color: "text-orange-400",
      activeBg: "bg-orange-500/15",
      activeBorder: "border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.3)]",
    },
    {
      id: "urgent",
      label: isAr ? "عاجلة" : "Urgent",
      color: "text-rose-400",
      activeBg: "bg-rose-500/15",
      activeBorder: "border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#0b0614] border border-[#2d184a] text-white w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(181,126,222,0.15)] space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#211238] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#b57ede]/15 text-[#b57ede] border border-[#b57ede]/30 shadow-[0_0_15px_rgba(181,126,222,0.25)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {isAr ? "إنشاء مهمة جديدة" : t("createTaskModal.title")}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isAr ? "أدخل تفاصيل المهمة لإضافتها مباشرة إلى لوحة العمل" : "Enter task details to add it to your project board"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5 text-start">
          
          {/* Column / List Picker (If multiple lists exist) */}
          {lists.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <LayoutList className="h-3.5 w-3.5 text-[#b57ede]" />
                <span>{isAr ? "العمود / القائمة" : "Target Column"}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {lists.map((list) => {
                  const isSelected = selectedListId === list._id;
                  return (
                    <button
                      key={list._id}
                      type="button"
                      onClick={() => setSelectedListId(list._id)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all truncate cursor-pointer text-center ${
                        isSelected
                          ? "bg-[#b57ede]/20 border-[#b57ede] text-white shadow-[0_0_10px_rgba(181,126,222,0.3)]"
                          : "bg-black/40 border-[#261540] text-zinc-400 hover:border-[#b57ede]/40 hover:text-zinc-200"
                      }`}
                    >
                      {list.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task Title (Required) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#b57ede] flex items-center justify-between">
              <span>{t("createTaskModal.labelTitle")} *</span>
              <span className="text-[10px] text-zinc-500 font-normal lowercase">{isAr ? "مطلوب" : "required"}</span>
            </label>
            <input
              type="text"
              placeholder={isAr ? "مثال: مراجعة التصميم، برمجة الصفحة الرئيسية..." : t("createTaskModal.placeholderTitle")}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full rounded-xl border border-[#2d184a] bg-black/60 py-3 px-4 text-sm text-white focus:outline-hidden focus:border-[#b57ede] focus:ring-2 focus:ring-[#b57ede]/30 placeholder:text-zinc-600 transition-all font-medium"
              required
              autoFocus
            />
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <AlignLeft className="h-3.5 w-3.5 text-[#b57ede]" />
              <span>{t("createTaskModal.labelDesc")}</span>
            </label>
            <textarea
              placeholder={isAr ? "أضف تفاصيل إضافية أو روابط أو ملاحظات للمهمة (اختياري)..." : t("createTaskModal.placeholderDesc")}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="w-full rounded-xl border border-[#2d184a] bg-black/60 py-2.5 px-4 text-sm text-white focus:outline-hidden focus:border-[#b57ede] focus:ring-2 focus:ring-[#b57ede]/30 placeholder:text-zinc-600 h-24 transition-all resize-none font-normal leading-relaxed"
            />
          </div>

          {/* Priority Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              {t("createTaskModal.labelPriority")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {priorityOptions.map((opt) => {
                const isActive = newTaskPriority === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewTaskPriority(opt.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? `${opt.activeBg} ${opt.activeBorder} ${opt.color}`
                        : "bg-black/40 border-[#261540] text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.color.replace('text-', 'bg-')}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#b57ede]" />
              <span>{isAr ? "تاريخ الاستحقاق (اختياري)" : "Due Date (Optional)"}</span>
            </label>
            <input
              type="datetime-local"
              value={dueDateStr}
              onChange={(e) => setDueDateStr(e.target.value)}
              className="w-full bg-black/60 border border-[#2d184a] rounded-xl py-2.5 px-4 text-sm text-white outline-hidden focus:border-[#b57ede] focus:ring-2 focus:ring-[#b57ede]/30 [color-scheme:dark] transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 rounded-xl border border-[#2d184a] bg-black/40 hover:bg-white/5 text-zinc-300 hover:text-white font-bold text-sm transition-all cursor-pointer text-center"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>

            <button
              type="submit"
              disabled={isPending || !newTaskTitle.trim()}
              className="w-2/3 bg-[#b57ede] hover:bg-[#a668d2] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none py-3 px-4 text-black font-black text-sm rounded-xl transition-all shadow-[0_0_25px_rgba(181,126,222,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>{isAr ? "جاري الإنشاء..." : "Creating..."}</span>
                </>
              ) : (
                <span>{isAr ? "إنشاء المهمة" : t("createTaskModal.btnSubmit")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
