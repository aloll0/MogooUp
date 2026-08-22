import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  PlusCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Trash,
  Check,
  Activity
} from "lucide-react";
import { taskflowService } from "../services/taskflowService";
import type { Goal, KeyResult } from "../services/taskflowService";
import { useToastStore } from "../stores/useToastStore";
import { useConfirmStore } from "../stores/useConfirmStore";

interface GoalsTabProps {
  workspaceId: string;
  members: any[];
  currentUserRole: string;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ workspaceId, members: _members, currentUserRole }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<"active" | "completed" | "cancelled">("active");
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Add Goal Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newKRs, setNewKRs] = useState<Array<Omit<KeyResult, "_id">>>([]);

  // Key Result form helpers
  const [krTitle, setKrTitle] = useState("");
  const [krType, setKrType] = useState<"percentage" | "number">("percentage");
  const [krStart, setKrStart] = useState("0");
  const [krTarget, setKrTarget] = useState("100");
  const [krUnit, setKrUnit] = useState("%");

  // Load Workspace Goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals", workspaceId],
    queryFn: () => taskflowService.getGoals(workspaceId),
    enabled: !!workspaceId,
  });

  // Goal Mutations
  const createGoalMutation = useMutation({
    mutationFn: (goalData: any) => taskflowService.createGoal(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", workspaceId] });
      setIsAddOpen(false);
      resetGoalForm();
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, updateData }: { goalId: string; updateData: Partial<Goal> }) =>
      taskflowService.updateGoal(goalId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", workspaceId] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => taskflowService.deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", workspaceId] });
    },
  });

  const resetGoalForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setNewKRs([]);
    resetKRFields();
  };

  const resetKRFields = () => {
    setKrTitle("");
    setKrType("percentage");
    setKrStart("0");
    setKrTarget("100");
    setKrUnit("%");
  };

  const handleAddKR = () => {
    if (!krTitle.trim()) return;
    const startVal = Number(krStart);
    const targetVal = Number(krTarget);

    if (isNaN(startVal) || isNaN(targetVal)) {
      useToastStore.getState().addToast("Values must be numbers", "warning");
      return;
    }

    setNewKRs([
      ...newKRs,
      {
        title: krTitle,
        targetType: krType,
        startValue: startVal,
        targetValue: targetVal,
        currentValue: startVal,
        unit: krType === "percentage" ? "%" : krUnit || "units",
      },
    ]);
    resetKRFields();
  };

  const handleRemoveNewKR = (idx: number) => {
    setNewKRs(newKRs.filter((_, i) => i !== idx));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createGoalMutation.mutate({
      workspaceId,
      title,
      description,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      keyResults: newKRs,
    });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!["owner", "admin", "manager"].includes(currentUserRole)) {
      useToastStore.getState().addToast(t("warnings.notAdminSpace"), "warning");
      return;
    }

    const confirmed = await useConfirmStore.getState().show({
      title: t("goalsTab.deleteGoalTitle", { defaultValue: "Delete Strategic Goal" }),
      message: t("goalsTab.confirmDeleteGoal"),
      confirmText: t("common.delete", { defaultValue: "Delete" }),
      cancelText: t("common.cancel", { defaultValue: "Cancel" }),
    });
    if (confirmed) {
      deleteGoalMutation.mutate(goalId);
    }
  };

  const getKRProgress = (kr: KeyResult) => {
    const total = kr.targetValue - kr.startValue;
    if (total === 0) return 0;
    const pct = ((kr.currentValue - kr.startValue) / total) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  };

  const getGoalProgress = (goal: Goal) => {
    if (!goal.keyResults || goal.keyResults.length === 0) {
      return goal.status === "completed" ? 100 : 0;
    }
    const sum = goal.keyResults.reduce((acc, kr) => acc + getKRProgress(kr), 0);
    return Math.round(sum / goal.keyResults.length);
  };

  // Inline update handler for individual key results
  const handleUpdateKRValue = (goal: Goal, krId: string, value: number) => {
    const updatedKRs = goal.keyResults.map((kr) => {
      if (kr._id === krId) {
        return { ...kr, currentValue: value };
      }
      return kr;
    });

    updateGoalMutation.mutate({
      goalId: goal._id,
      updateData: { keyResults: updatedKRs },
    });
  };

  const handleToggleGoalStatus = (goal: Goal) => {
    const nextStatus = goal.status === "active" ? "completed" : "active";
    updateGoalMutation.mutate({
      goalId: goal._id,
      updateData: { status: nextStatus },
    });
  };

  // Filter goals
  const filteredGoals = goals.filter((g) => g.status === activeFilter);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Header and Add Goal trigger */}
      <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5.5 w-5.5 text-purple-500 animate-pulse" />
            <span>{t("goalsTab.goalsTitle")}</span>
          </h2>
          <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
            Align team deliverables and monitor стратегические targets in real time.
          </p>
        </div>

        {["owner", "admin", "manager"].includes(currentUserRole) && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("goalsTab.addGoal")}</span>
          </button>
        )}
      </div>

      {/* Goal status filters */}
      <div className="flex gap-2">
        {(["active", "completed", "cancelled"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${activeFilter === filter
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-zinc-100 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
          >
            {t(`goalsTab.${filter}Goals`)}
          </button>
        ))}
      </div>

      {/* Strategic Goals content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-center border border-dashed dark:border-zinc-800 rounded-2xl p-8 bg-zinc-50/10 dark:bg-zinc-950/5">
          <Trophy className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm font-semibold text-zinc-500">{t("goalsTab.noGoals")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredGoals.map((goal) => {
            const progress = getGoalProgress(goal);
            const isExpanded = expandedGoalId === goal._id;

            return (
              <div
                key={goal._id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm transition-all overflow-hidden flex flex-col hover:shadow-md"
              >
                {/* Goal Header */}
                <div
                  className="p-5 flex items-start gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedGoalId(isExpanded ? null : goal._id)}
                >
                  <div className="flex-1 min-w-0 text-start space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-zinc-850 dark:text-zinc-100 text-base leading-snug truncate">
                        {goal.title}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none ${goal.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : goal.status === "cancelled"
                              ? "bg-red-500/10 text-red-555"
                              : "bg-purple-500/10 text-purple-500"
                          }`}
                      >
                        {goal.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 max-w-2xl">
                      {goal.description || "No description provided."}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-semibold pt-1">
                      {goal.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(goal.endDate).toLocaleDateString()}</span>
                        </span>
                      )}
                      <span>
                        {goal.keyResults?.length || 0} Key Results
                      </span>
                    </div>
                  </div>

                  {/* Goal Progress Ring / Bar */}
                  <div className="shrink-0 flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">
                        {progress}%
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                        {t("goalsTab.progress")}
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full bg-linear-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Goal Details & KR Manager Panel */}
                {isExpanded && (
                  <div className="p-5 bg-zinc-50/50 dark:bg-zinc-950/20 border-t dark:border-zinc-800 space-y-5 animate-fade-in text-start">

                    {/* Actions panel */}
                    <div className="flex justify-between items-center bg-zinc-100/40 dark:bg-zinc-950/30 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleGoalStatus(goal)}
                          className="flex items-center gap-1 bg-white dark:bg-zinc-850 text-[10px] font-bold px-3 py-1.5 rounded-lg border dark:border-zinc-800 shadow-xs cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <Check className={`h-3.5 w-3.5 ${goal.status === "completed" ? "text-green-500" : "text-zinc-400"}`} />
                          <span>{goal.status === "completed" ? "Mark as Active" : "Mark as Completed"}</span>
                        </button>
                      </div>

                      {["owner", "admin", "manager"].includes(currentUserRole) && (
                        <button
                          onClick={() => handleDeleteGoal(goal._id)}
                          className="flex items-center gap-1 text-red-500 dark:text-red-400 hover:bg-red-500/5 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{t("goalsTab.deleteGoal")}</span>
                        </button>
                      )}
                    </div>

                    {/* Key Results list */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-purple-400" />
                        <span>{t("goalsTab.keyResultsTitle")}</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {goal.keyResults?.map((kr) => {
                          const krProgress = getKRProgress(kr);
                          return (
                            <div
                              key={kr._id}
                              className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3 flex flex-col"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 leading-normal">
                                  {kr.title}
                                </span>
                                <span className="text-xs font-black text-purple-500 shrink-0">
                                  {krProgress}%
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${krProgress}%` }}
                                />
                              </div>

                              {/* Target Details / Inputs */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="text-[10px] font-semibold text-zinc-400">
                                  Target: <span className="text-zinc-650 dark:text-zinc-250 font-bold">{kr.startValue}</span> to{" "}
                                  <span className="text-zinc-650 dark:text-zinc-250 font-bold">
                                    {kr.targetValue} {kr.unit}
                                  </span>
                                </div>

                                {/* Manual Incremental Modifier */}
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={kr.currentValue}
                                    onChange={(e) =>
                                      handleUpdateKRValue(goal, kr._id!, Number(e.target.value))
                                    }
                                    className="w-14 text-center text-xs font-bold py-1 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-hidden text-zinc-900 dark:text-zinc-100"
                                  />
                                  <span className="text-[10px] font-bold text-zinc-400 select-none">
                                    {kr.unit}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal Backdrop */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] max-h-[650px] relative">
            {/* Modal Header */}
            <div className="p-4 border-b dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-zinc-850 dark:text-zinc-50 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span>{t("goalsTab.addGoal")}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleCreateGoal} className="flex-1 overflow-y-auto p-6 space-y-5 text-start">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                  {t("goalsTab.goalNameLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("goalsTab.goalNamePlaceholder")}
                  className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                  {t("goalsTab.goalDescLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("goalsTab.goalDescPlaceholder")}
                  className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-3 text-sm h-20 focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 resize-none text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                    {t("goalsTab.startDate")}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                    {t("goalsTab.dueDate")}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Add Key Results Sub Form */}
              <div className="border-t dark:border-zinc-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-555">
                  {t("goalsTab.keyResultsTitle")}
                </h4>

                {/* Added Key Results Badges/Rows */}
                {newKRs.length > 0 && (
                  <div className="space-y-2">
                    {newKRs.map((kr, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-zinc-55 dark:bg-zinc-950 border dark:border-zinc-850 p-2.5 rounded-lg text-xs"
                      >
                        <div className="flex-1 truncate">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{kr.title}</span>
                          <span className="text-zinc-400 font-semibold ms-2">
                            ({kr.startValue} to {kr.targetValue} {kr.unit})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewKR(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fields for building a Key Result */}
                <div className="bg-zinc-55/40 dark:bg-zinc-950/30 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                      {t("goalsTab.krTitleLabel")}
                    </label>
                    <input
                      type="text"
                      value={krTitle}
                      onChange={(e) => setKrTitle(e.target.value)}
                      placeholder={t("goalsTab.krTitlePlaceholder")}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-hidden text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                        {t("goalsTab.krTypeLabel")}
                      </label>
                      <select
                        value={krType}
                        onChange={(e) => {
                          const val = e.target.value as "percentage" | "number";
                          setKrType(val);
                          setKrUnit(val === "percentage" ? "%" : "");
                          if (val === "percentage") {
                            setKrStart("0");
                            setKrTarget("100");
                          }
                        }}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-hidden text-zinc-900 dark:text-zinc-100 cursor-pointer"
                      >
                        <option value="percentage">{t("goalsTab.krTypePercentage")}</option>
                        <option value="number">{t("goalsTab.krTypeNumber")}</option>
                      </select>
                    </div>

                    {krType === "number" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                          {t("goalsTab.krUnit")}
                        </label>
                        <input
                          type="text"
                          value={krUnit}
                          onChange={(e) => setKrUnit(e.target.value)}
                          placeholder="e.g. clients, calls"
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-hidden text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                        {t("goalsTab.krStartValue")}
                      </label>
                      <input
                        type="number"
                        value={krStart}
                        onChange={(e) => setKrStart(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-hidden text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                        {t("goalsTab.krTargetValue")}
                      </label>
                      <input
                        type="number"
                        value={krTarget}
                        onChange={(e) => setKrTarget(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-hidden text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddKR}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-extrabold text-xs cursor-pointer pt-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>{t("goalsTab.addKeyResult")}</span>
                  </button>
                </div>
              </div>

              {/* Form submit/footer actions */}
              <div className="flex gap-3 justify-end pt-3 border-t dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-650 dark:text-zinc-350 rounded-xl transition-all cursor-pointer"
                >
                  {t("timeTracker.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createGoalMutation.isPending}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {createGoalMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{t("goalsTab.createGoalBtn")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
