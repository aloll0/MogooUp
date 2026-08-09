import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, Reorder } from "framer-motion";
import { 
  GripVertical, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  PieChart, 
  Loader2,
  Clock 
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { useDashboardOrderStore } from "../stores/useDashboardOrderStore";
import type { Task } from "../services/taskflowService";

interface DashboardTabProps {
  workspaceName?: string;
  tasks: Task[];
  members: any[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  workspaceName = "Workspace",
  tasks,
  members,
}) => {
  const { t } = useTranslation();
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load drag-and-drop widget order from state store
  const { widgetOrder, updateOrder } = useDashboardOrderStore();

  // --- 1. Compute Stats ---
  const completedTasks = tasks.filter((t) => t.status === "done");
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Overdue: Due date is in the past AND status is not 'done'
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  );

  // Priority Stats
  const prioritiesCount = {
    low: tasks.filter((t) => t.priority === "low").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    high: tasks.filter((t) => t.priority === "high").length,
    urgent: tasks.filter((t) => t.priority === "urgent").length,
  };

  // Member workloads
  const memberWorkloads = members.map((m) => {
    const assignedCount = tasks.filter((t) =>
      t.assignees?.some((a) => a._id === m.userId?._id || (a as any) === m.userId?._id)
    ).length;

    const completedCount = tasks.filter(
      (t) =>
        t.status === "done" &&
        t.assignees?.some((a) => a._id === m.userId?._id || (a as any) === m.userId?._id)
    ).length;

    return {
      fullName: m.userId?.fullName || "Deleted User",
      avatarUrl: m.userId?.avatarUrl,
      role: m.role,
      total: assignedCount,
      completed: completedCount,
    };
  }).sort((a, b) => b.total - a.total);

  // --- 2. SVG Donut Math for Priority Chart ---
  const totalPriorityCount =
    prioritiesCount.low + prioritiesCount.medium + prioritiesCount.high + prioritiesCount.urgent;

  const getDonutSegments = () => {
    if (totalPriorityCount === 0) return [];
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // ~314.159
    let accumulatedOffset = 0;

    const colors = {
      urgent: "#ef4444",
      high: "#f59e0b",
      medium: "#a855f7",
      low: "#9ca3af",
    };

    return (Object.keys(prioritiesCount) as Array<keyof typeof prioritiesCount>).map((key) => {
      const count = prioritiesCount[key];
      const percentage = (count / totalPriorityCount) * 100;
      const strokeLength = (count / totalPriorityCount) * circumference;
      const strokeOffset = circumference - strokeLength + accumulatedOffset;
      accumulatedOffset -= strokeLength;

      return {
        key,
        count,
        percentage: Math.round(percentage),
        strokeLength,
        strokeOffset,
        color: colors[key],
        circumference,
      };
    });
  };

  const donutSegments = getDonutSegments();

  // --- 3. Export PDF Handler ---
  const handleExportPDF = () => {
    if (!printContainerRef.current) return;
    setIsExporting(true);

    const element = printContainerRef.current;
    const opt = {
      margin: 0,
      filename: `${workspaceName.toLowerCase().replace(/\s+/g, "_")}_dashboard.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#f4f4f5"
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
    };

    // Use html2pdf promise flow
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        setIsExporting(false);
      })
      .catch((err: any) => {
        console.error("PDF Export error:", err);
        setIsExporting(false);
      });
  };

  // --- 4. Render Individual Widget Contents ---
  const renderWidget = (id: string) => {
    switch (id) {
      case "completed-tasks":
        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-full transition-theme">
            <h3 className="text-sm font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 self-start">
              {t("stats.widgetCompletionTitle", { defaultValue: "Task Completion" })}
            </h3>
            
            {/* Animated Circular Progress */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  className="text-zinc-100 dark:text-zinc-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                {/* Foreground Progress */}
                <motion.circle
                  className="text-purple-600 dark:text-purple-500"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 40) - (completionPercentage / 100) * (2 * Math.PI * 40) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  {completionPercentage}%
                </span>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {completedTasks.length} / {totalTasks} {t("tasksCount")}
                </span>
              </div>
            </div>
            
            <div className="mt-5 flex items-center gap-2 text-green-500 bg-green-500/5 px-3 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {t("stats.completionRate", { defaultValue: "Completion Rate" })}
              </span>
            </div>
          </div>
        );

      case "overdue-tasks":
        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-full text-start transition-theme">
            <h3 className="text-sm font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4">
              {t("stats.widgetOverdueTitle", { defaultValue: "Overdue Tasks Status" })}
            </h3>

            <div className="flex-1 flex flex-col justify-center min-h-[140px]">
              {overdueTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 max-w-[200px] mx-auto font-medium">
                    {t("stats.noOverdueTasks", { defaultValue: "Great job! No overdue tasks in this workspace." })}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5 text-red-500 bg-red-500/5 px-3 py-2 rounded-xl text-sm font-bold">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>
                      {overdueTasks.length} {t("stats.overdue", { defaultValue: "Overdue" })} {t("tasksCount")}
                    </span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {overdueTasks.slice(0, 3).map((task) => (
                      <div key={task._id} className="flex justify-between items-center text-xs p-2 bg-zinc-50 dark:bg-zinc-950/20 rounded-lg border dark:border-zinc-800">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[140px]">
                          {task.title}
                        </span>
                        <span className="text-[10px] font-bold text-red-500">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ""}
                        </span>
                      </div>
                    ))}
                    {overdueTasks.length > 3 && (
                      <p className="text-[10px] text-zinc-400 font-semibold text-center mt-1">
                        + {overdueTasks.length - 3} more overdue tasks
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "member-dist":
        // Maximum count to scale bars dynamically
        const maxVal = Math.max(...memberWorkloads.map((m) => m.total), 1);

        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-full text-start transition-theme">
            <h3 className="text-sm font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{t("stats.widgetMembersTitle", { defaultValue: "Work Distribution" })}</span>
              <Users className="h-4 w-4 text-purple-500" />
            </h3>

            <div className="flex-1 space-y-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar justify-center flex flex-col">
              {memberWorkloads.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">No workspace members assigned.</p>
              ) : (
                memberWorkloads.slice(0, 4).map((member, idx) => {
                  const percentage = (member.total / maxVal) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={member.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt={member.fullName}
                            className="h-5 w-5 rounded-full border bg-zinc-850 dark:border-zinc-800"
                          />
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                            {member.fullName}
                          </span>
                        </div>
                        <span className="font-bold text-zinc-500 dark:text-zinc-400">
                          {member.completed} / {member.total} tasks
                        </span>
                      </div>
                      
                      {/* Responsive Custom SVG/CSS Bar */}
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                        <motion.div
                          className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case "priority-dist":
        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-full text-start transition-theme">
            <h3 className="text-sm font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{t("stats.widgetPriorityTitle", { defaultValue: "Task Priorities" })}</span>
              <PieChart className="h-4 w-4 text-purple-500" />
            </h3>

            <div className="flex-1 flex flex-row items-center justify-around min-h-[140px]">
              {totalPriorityCount === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6 w-full">No task data available.</p>
              ) : (
                <>
                  {/* SVG Donut */}
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {donutSegments.map((seg, idx) => (
                        <circle
                          key={idx}
                          stroke={seg.color}
                          strokeWidth="10"
                          strokeDasharray={seg.circumference}
                          strokeDashoffset={seg.strokeOffset}
                          fill="transparent"
                          r="50"
                          cx="60"
                          cy="60"
                          className="transition-all duration-500 hover:stroke-[12] cursor-pointer"
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                        {totalTasks}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Tasks
                      </span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-semibold shrink-0">
                    {(Object.keys(prioritiesCount) as Array<keyof typeof prioritiesCount>).map((key) => {
                      const count = prioritiesCount[key];
                      const colors = {
                        urgent: "bg-red-500",
                        high: "bg-amber-500",
                        medium: "bg-purple-500",
                        low: "bg-zinc-400",
                      };

                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colors[key]}`} />
                          <span className="capitalize w-14">{t(`priorities.${key}`)}</span>
                          <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "time-tracking-summary":
        const totalLoggedHours = tasks.reduce((sum, task) => {
          const taskLogged = task.loggedTime?.reduce((tSum, entry) => tSum + entry.hours, 0) || 0;
          return sum + taskLogged;
        }, 0);

        return (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-full text-start transition-theme">
            <h3 className="text-sm font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{t("timeTracker.timeTrackerWidgetTitle", { defaultValue: "Active Time Tracking" })}</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </h3>

            <div className="flex-1 flex flex-col justify-center min-h-[140px] space-y-4">
              <div className="flex items-center gap-4 bg-zinc-55/40 dark:bg-zinc-950/20 p-4 rounded-xl border dark:border-zinc-800">
                <Clock className="h-10 w-10 text-purple-500 shrink-0" />
                <div>
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    {totalLoggedHours.toFixed(1)} {t("timeTracker.hours", { defaultValue: "hours" })}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 block uppercase tracking-wider mt-0.5">
                    {t("timeTracker.totalHoursTracked", { defaultValue: "Total Logged Workspace Hours" })}
                  </span>
                </div>
              </div>

              {/* Show top tasks with logged work */}
              <div className="space-y-2 text-start">
                <span className="text-[10px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">
                  Top Task Time Logs
                </span>
                <div className="max-h-24 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
                  {tasks
                    .filter((t) => t.loggedTime && t.loggedTime.length > 0)
                    .map((t) => {
                      const sum = t.loggedTime!.reduce((s, e) => s + e.hours, 0);
                      return { title: t.title, id: t._id, hours: sum };
                    })
                    .sort((a, b) => b.hours - a.hours)
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-zinc-55/30 dark:bg-zinc-950/10 rounded-lg border dark:border-zinc-850">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[170px]">
                          {item.title}
                        </span>
                        <span className="font-extrabold text-purple-500">
                          {item.hours.toFixed(1)}h
                        </span>
                      </div>
                    ))}
                  {tasks.filter((t) => t.loggedTime && t.loggedTime.length > 0).length === 0 && (
                    <p className="text-zinc-400 text-center py-2 italic">No task hours logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{t("stats.widgetsHeader", { defaultValue: "Interactive Widgets Dashboard" })}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1">
            {t("stats.widgetDragTip", { defaultValue: "Drag widget cards to customize the layout. Your preferences are saved automatically." })}
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{t("stats.exportPDF", { defaultValue: "Export PDF Report" })}</span>
        </button>
      </div>

      {/* DRAGGABLE REORDER CONTAINER */}
      <div className="flex-1">
        <Reorder.Group
          axis="y"
          values={widgetOrder}
          onReorder={updateOrder}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {widgetOrder.map((widgetId) => (
            <Reorder.Item
              key={widgetId}
              value={widgetId}
              className="relative group cursor-grab active:cursor-grabbing list-none"
            >
              {/* Drag Handle floating overlay */}
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-zinc-150 dark:bg-zinc-800 rounded-md text-zinc-500 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </div>
              
              {renderWidget(widgetId)}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* HIDDEN CONTAINER EXCLUSIVELY FOR PDF EXPORT PRINTING (LANDSCAPE FRIENDLY A4) */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
        <div 
          ref={printContainerRef}
          id="dashboard-print-content"
          style={{
            padding: "32px",
            color: "#18181b",
            backgroundColor: "#f4f4f5",
            width: "297mm",
            minHeight: "210mm",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            boxSizing: "border-box"
          }}
        >
          {/* Print Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #7c3aed", paddingBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", color: "#6d28d9", letterSpacing: "0.05em" }}>
                {t("stats.productivityReport", { defaultValue: "Productivity Report" })}
              </h1>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#71717a" }}>
                {t("sidebar.currentWorkspace")}: <span style={{ color: "#000000", fontWeight: "900" }}>{workspaceName}</span>
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#a1a1aa" }}>
              <p>{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
              <p>Mogoo Taskflow Analytics</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px", marginTop: "24px", flex: 1 }}>
            {/* Widget 1 */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", marginBottom: "12px", width: "100%", textAlign: "left", borderBottom: "1px solid #e4e4e7", paddingBottom: "4px" }}>
                {t("stats.widgetCompletionTitle")}
              </h3>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "36px", fontWeight: "900", color: "#7c3aed" }}>{completionPercentage}%</p>
                <p style={{ fontSize: "12px", color: "#71717a", fontWeight: "700", marginTop: "4px" }}>
                  {completedTasks.length} / {totalTasks} {t("tasksCount")} Completed
                </p>
              </div>
            </div>

            {/* Widget 2 */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", marginBottom: "12px", width: "100%", textAlign: "left", borderBottom: "1px solid #e4e4e7", paddingBottom: "4px" }}>
                {t("stats.widgetOverdueTitle")}
              </h3>
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#ef4444", marginBottom: "8px" }}>
                {overdueTasks.length} {t("stats.overdue")} Tasks Outstanding
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                {overdueTasks.slice(0, 3).map((task) => (
                  <div key={task._id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "600", color: "#3f3f46", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "180px" }}>{task.title}</span>
                    <span style={{ color: "#ef4444", fontWeight: "800" }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3 */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", marginBottom: "12px", width: "100%", textAlign: "left", borderBottom: "1px solid #e4e4e7", paddingBottom: "4px" }}>
                {t("stats.widgetMembersTitle")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                {memberWorkloads.slice(0, 3).map((m, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "700", color: "#3f3f46" }}>{m.fullName}</span>
                    <span style={{ fontWeight: "700", color: "#71717a" }}>{m.completed} / {m.total} tasks</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 4 */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", marginBottom: "12px", width: "100%", textAlign: "left", borderBottom: "1px solid #e4e4e7", paddingBottom: "4px" }}>
                {t("stats.widgetPriorityTitle")}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", fontSize: "12px", fontWeight: "600" }}>
                {(Object.keys(prioritiesCount) as Array<keyof typeof prioritiesCount>).map((key) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px", backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: "8px" }}>
                    <span style={{ textTransform: "capitalize", color: "#71717a" }}>{t(`priorities.${key}`)}</span>
                    <span style={{ fontWeight: "700", color: "#27272a" }}>{prioritiesCount[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
