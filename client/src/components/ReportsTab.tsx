import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Download, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Loader2,
  Calendar,
  Layers
} from "lucide-react";
import html2pdf from "html2pdf.js";
import type { Task } from "../services/taskflowService";

interface ReportsTabProps {
  workspaceName?: string;
  tasks: Task[];
  members: any[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  workspaceName = "Workspace",
  tasks,
  members,
}) => {
  const { t } = useTranslation();
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- 1. Helper: Lookup Member details by userId ---
  const getMemberInfo = (userId: string) => {
    const member = members.find(
      (m) => m.userId?._id === userId || m.userId === userId
    );
    return {
      fullName: member?.userId?.fullName || "Deleted User",
      avatarUrl: member?.userId?.avatarUrl,
    };
  };

  // --- 2. Aggregate Work Logs Across All Tasks ---
  const allTimeLogs = tasks
    .flatMap((task) =>
      (task.loggedTime || []).map((log) => ({
        ...log,
        taskId: task._id,
        taskTitle: task.title,
      }))
    )
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());

  // --- 3. Compute Metrics ---
  const totalLoggedHours = allTimeLogs.reduce((sum, log) => sum + log.hours, 0);
  
  const completedTasksCount = tasks.filter((t) => t.status === "done").length;
  const totalTasksCount = tasks.length;
  const productivityScore =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Logged hours by member
  const hoursByMember = members.map((m) => {
    const userId = m.userId?._id;
    const memberLogs = allTimeLogs.filter((log) => log.userId === userId);
    const hours = memberLogs.reduce((sum, log) => sum + log.hours, 0);
    return {
      fullName: m.userId?.fullName || "Deleted User",
      avatarUrl: m.userId?.avatarUrl,
      hours,
    };
  }).sort((a, b) => b.hours - a.hours);

  // Filter members with hours > 0 for chart display
  const activeMembersForChart = hoursByMember.filter((m) => m.hours > 0);

  // --- 4. Export PDF Handler ---
  const handleExportPDF = () => {
    if (!printContainerRef.current) return;
    setIsExporting(true);

    const element = printContainerRef.current;
    const opt = {
      margin: 0,
      filename: `${workspaceName.toLowerCase().replace(/\s+/g, "_")}_timesheet_report.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#f4f4f5"
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

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

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{t("sidebar.reports", { defaultValue: "Reports & Analytics" })}</span>
          </h2>
          <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
            Analyze team efficiency, total work hours logged, and active timesheets.
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

      {/* Main Container of Reports View (Will be replicated in the PDF layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Cards Panel */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Logged Hours */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-theme">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                {t("stats.totalLoggedHours", { defaultValue: "Total Tracked Hours" })}
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                {totalLoggedHours}h
              </span>
            </div>
          </div>

          {/* Card 2: Productivity Score */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-theme">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                {t("stats.productivityScore", { defaultValue: "Productivity Score" })}
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                {productivityScore}%
              </span>
            </div>
          </div>

          {/* Card 3: Completion Ratio */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-theme">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                {t("stats.completionRate", { defaultValue: "Completion Ratio" })}
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                {completedTasksCount} / {totalTasksCount} {t("tasksCount")}
              </span>
            </div>
          </div>
        </div>

        {/* Left Side: SVG Workload hours Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-theme">
          <div>
            <h3 className="text-sm font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-purple-500" />
              <span>Logged Hours by Member</span>
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center min-h-[220px]">
            {activeMembersForChart.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-xs text-zinc-450">{t("stats.noTimeLogged")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMembersForChart.map((m, idx) => {
                  const maxHours = Math.max(...activeMembersForChart.map((mem) => mem.hours), 1);
                  const widthPercent = (m.hours / maxHours) * 100;
                  return (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-semibold">
                        <div className="flex items-center gap-2">
                          <img
                            src={m.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt={m.fullName}
                            className="h-5 w-5 rounded-full border bg-zinc-800 dark:border-zinc-800"
                          />
                          <span className="truncate max-w-[120px] text-zinc-700 dark:text-zinc-300">{m.fullName}</span>
                        </div>
                        <span className="font-extrabold text-purple-650 dark:text-purple-400">{m.hours}h</span>
                      </div>
                      
                      <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Timesheet Table */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col transition-theme">
          <h3 className="text-sm font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-purple-500" />
            <span>{t("stats.timesheetTitle", { defaultValue: "Timesheet & Work Logs" })}</span>
          </h3>

          <div className="flex-1 overflow-x-auto min-h-[220px] max-h-[300px] overflow-y-auto custom-scrollbar">
            {allTimeLogs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-xs text-zinc-400">{t("stats.noTimeLogged")}</p>
              </div>
            ) : (
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold">
                    <th className="py-2.5 text-start px-2">{t("stats.taskTitle")}</th>
                    <th className="py-2.5 text-start px-2">{t("stats.loggedBy")}</th>
                    <th className="py-2.5 text-start px-2">{t("stats.loggedHours")}</th>
                    <th className="py-2.5 text-start px-2">{t("stats.date")}</th>
                    <th className="py-2.5 text-start px-2">{t("stats.notes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                  {allTimeLogs.map((log, idx) => {
                    const member = getMemberInfo(log.userId);
                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                        <td className="py-3 px-2 font-bold max-w-[140px] truncate" title={log.taskTitle}>
                          {log.taskTitle}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={member.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                              alt="Avatar"
                              className="h-4.5 w-4.5 rounded-full border bg-zinc-800"
                            />
                            <span className="truncate max-w-[90px]">{member.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-extrabold text-purple-600 dark:text-purple-400">
                          {log.hours}h
                        </td>
                        <td className="py-3 px-2 text-zinc-400">
                          {log.date ? new Date(log.date).toLocaleDateString() : ""}
                        </td>
                        <td className="py-3 px-2 max-w-[120px] truncate text-zinc-450 italic" title={log.comment}>
                          {log.comment || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* HIDDEN CONTAINER FOR BEAUTIFULLY STYLED PDF REPORT PRINTING (PORTRAIT FRIENDLY A4) */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
        <div 
          ref={printContainerRef}
          id="reports-print-content"
          style={{
            padding: "40px",
            color: "#18181b",
            backgroundColor: "#f4f4f5",
            width: "210mm",
            minHeight: "297mm",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            boxSizing: "border-box"
          }}
        >
          {/* PDF Report Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #7c3aed", paddingBottom: "16px", marginBottom: "32px" }}>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", color: "#6d28d9", letterSpacing: "0.05em" }}>
                {t("stats.productivityReport", { defaultValue: "Productivity & Work Tracking Report" })}
              </h1>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#71717a" }}>
                {t("sidebar.currentWorkspace")}: <span style={{ color: "#000000", fontWeight: "900" }}>{workspaceName}</span>
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#a1a1aa" }}>
              <p>{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
              <p>Mogoo Taskflow Timesheet System</p>
            </div>
          </div>

          {/* KPI Dashboard Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px", marginBottom: "32px" }}>
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", display: "block" }}>
                {t("stats.totalLoggedHours")}
              </span>
              <span style={{ fontSize: "20px", fontWeight: "900", color: "#7c3aed" }}>{totalLoggedHours} Hours</span>
            </div>
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", display: "block" }}>
                {t("stats.productivityScore")}
              </span>
              <span style={{ fontSize: "20px", fontWeight: "900", color: "#10b981" }}>{productivityScore}%</span>
            </div>
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", display: "block" }}>
                {t("stats.completionRate")}
              </span>
              <span style={{ fontSize: "20px", fontWeight: "900", color: "#3b82f6" }}>{completedTasksCount} / {totalTasksCount} Tasks</span>
            </div>
          </div>

          {/* Logged Hours Breakdown list */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "900", color: "#71717a", textTransform: "uppercase", borderBottom: "1px solid #e4e4e7", paddingBottom: "8px", marginBottom: "12px" }}>
              Workload & Work Hours by Member
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {hoursByMember.map((m, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", padding: "4px 0" }}>
                  <span style={{ color: "#3f3f46" }}>{m.fullName}</span>
                  <span style={{ color: "#7c3aed", fontWeight: "900" }}>{m.hours} Hours Logged</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Timesheet Logs Table */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", flex: 1 }}>
            <h3 style={{ fontSize: "12px", fontWeight: "900", color: "#71717a", textTransform: "uppercase", borderBottom: "1px solid #e4e4e7", paddingBottom: "8px", marginBottom: "12px" }}>
              Timesheet & Logs Detail
            </h3>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e4e4e7", color: "#71717a", fontWeight: "700" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>{t("stats.taskTitle")}</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>{t("stats.loggedBy")}</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>{t("stats.loggedHours")}</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>{t("stats.date")}</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>{t("stats.notes")}</th>
                </tr>
              </thead>
              <tbody style={{ color: "#27272a" }}>
                {allTimeLogs.slice(0, 15).map((log, idx) => {
                  const member = getMemberInfo(log.userId);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f4f4f5" }}>
                      <td style={{ padding: "8px", fontWeight: "700", maxWidth: "120px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{log.taskTitle}</td>
                      <td style={{ padding: "8px" }}>{member.fullName}</td>
                      <td style={{ padding: "8px", fontWeight: "900", color: "#7c3aed" }}>{log.hours}h</td>
                      <td style={{ padding: "8px", color: "#a1a1aa" }}>{log.date ? new Date(log.date).toLocaleDateString() : ""}</td>
                      <td style={{ padding: "8px", maxWidth: "140px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontStyle: "italic", color: "#71717a" }}>{log.comment || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
