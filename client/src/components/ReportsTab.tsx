import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Download, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Loader2,
  Calendar,
  Layers,
  FileText,
  Briefcase,
  CheckSquare
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { taskflowService } from "../services/taskflowService";
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

  // Report Builder state
  const [reportMode, setReportMode] = useState<"timesheet" | "client">("timesheet");
  const [clientName, setClientName] = useState(workspaceName);
  const [reportTitle, setReportTitle] = useState(`${workspaceName} Project Deliverables Report`);
  const [reportOverview, setReportOverview] = useState(
    "This delivery report summarizes all accomplishments, campaigns, design layouts, and technical features implemented. All milestones have been completed and verified according to specifications."
  );

  // Get workspace ID to fetch spaces
  const workspaceId = tasks[0]?.workspaceId;
  const { data: spacesList = [] } = useQuery({
    queryKey: ["reportsSpaces", workspaceId],
    queryFn: () => taskflowService.getSpaces(workspaceId),
    enabled: !!workspaceId,
  });

  const getSpaceName = (spaceId: string) => {
    const space = spacesList.find((s) => s._id === spaceId);
    return space?.name || "General";
  };

  // Group tasks by space
  const groupedTasks: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    if (!groupedTasks[task.spaceId]) {
      groupedTasks[task.spaceId] = [];
    }
    groupedTasks[task.spaceId].push(task);
  });

  // Helper: Lookup Member details by userId
  const getMemberInfo = (userId: string) => {
    const member = members.find(
      (m) => m.userId?._id === userId || m.userId === userId
    );
    return {
      fullName: member?.userId?.fullName || "Deleted User",
      avatarUrl: member?.userId?.avatarUrl,
    };
  };

  // Aggregate Work Logs Across All Tasks
  const allTimeLogs = tasks
    .flatMap((task) =>
      (task.loggedTime || []).map((log) => ({
        ...log,
        taskId: task._id,
        taskTitle: task.title,
      }))
    )
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());

  // Compute Metrics
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

  const activeMembersForChart = hoursByMember.filter((m) => m.hours > 0);

  // Export PDF Handler
  const handleExportPDF = () => {
    if (!printContainerRef.current) return;
    setIsExporting(true);

    const element = printContainerRef.current;
    const filenamePrefix = reportMode === "client" ? clientName : workspaceName;
    const filenameSuffix = reportMode === "client" ? "project_report" : "timesheet_report";
    
    const opt = {
      margin: 0,
      filename: `${filenamePrefix.toLowerCase().replace(/\s+/g, "_")}_${filenameSuffix}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff"
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
            Build and export professional timesheets or comprehensive project delivery reports for your clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border dark:border-zinc-700 text-xs shrink-0 select-none font-bold">
            <button
              onClick={() => setReportMode("timesheet")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportMode === "timesheet"
                  ? "bg-purple-650 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              Timesheet Analysis
            </button>
            <button
              onClick={() => setReportMode("client")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportMode === "client"
                  ? "bg-purple-650 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              Client Report Builder
            </button>
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
            <span>{t("stats.exportPDF", { defaultValue: "Export PDF" })}</span>
          </button>
        </div>
      </div>

      {reportMode === "client" ? (
        /* CLIENT REPORT BUILDER MODE UI */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Builder Form */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4 text-start transition-theme">
            <h3 className="text-sm font-extrabold text-purple-650 uppercase tracking-wider mb-2">
              Report Settings
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-450 uppercase block">Client / Store Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. loksira Store"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-xs focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-450 uppercase block">Report Document Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. loksira Project Delivery Report"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-xs focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-450 uppercase block">Project Overview Description</label>
              <textarea
                rows={5}
                value={reportOverview}
                onChange={(e) => setReportOverview(e.target.value)}
                placeholder="Describe campaigns, graphics, design layout, development milestones..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-xs focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 outline-none resize-none"
              />
            </div>
            
            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3.5 space-y-2">
              <p className="text-[11px] font-bold text-purple-650 dark:text-purple-400 uppercase">Tip</p>
              <p className="text-[10.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Updating these settings changes the layout of the hidden high-resolution print template. When ready, click <strong>Export PDF</strong> to download.
              </p>
            </div>
          </div>

          {/* Right Column: Live Report Preview */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6 text-start transition-theme overflow-y-auto max-h-[600px]">
            <h3 className="text-sm font-extrabold text-zinc-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-purple-500" />
              <span>Live Report Preview</span>
            </h3>

            {/* Document mockup layout */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border dark:border-zinc-800 shadow-inner font-sans space-y-6 text-zinc-800 dark:text-zinc-200">
              {/* Fake Cover Page Header inside preview */}
              <div className="border-b-2 border-purple-500 pb-4">
                <span className="text-[9px] font-extrabold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Arab Pro Agency</span>
                <h2 className="text-xl font-black mt-2 text-zinc-900 dark:text-white">{reportTitle}</h2>
                <p className="text-xs text-zinc-500 mt-1">Prepared for: <strong>{clientName}</strong> • Date: {new Date().toLocaleDateString()}</p>
              </div>

              {/* Project Intro */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">1. Project Overview</h4>
                <p className="text-xs leading-relaxed italic text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-3 rounded-lg border dark:border-zinc-800">
                  {reportOverview}
                </p>
              </div>

              {/* Deliverables Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">2. Department Deliverables</h4>
                
                {Object.keys(groupedTasks).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No tasks completed in this workspace yet.</p>
                ) : (
                  Object.entries(groupedTasks).map(([spaceId, spaceTasks]) => (
                    <div key={spaceId} className="space-y-2 bg-white dark:bg-zinc-900 p-4 rounded-xl border dark:border-zinc-800 shadow-2xs">
                      <h5 className="text-xs font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>{getSpaceName(spaceId)}</span>
                        <span className="text-[10px] font-normal text-zinc-400 ml-auto">({spaceTasks.length} tasks)</span>
                      </h5>

                      <div className="space-y-2">
                        {spaceTasks.map((t) => (
                          <div key={t._id} className="text-xs border-b dark:border-zinc-800/40 last:border-0 pb-2 last:pb-0 pt-1">
                            <div className="flex justify-between items-center font-bold">
                              <span>{t.title}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                                t.status === "done" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            {t.description && (
                              <p className="text-[11px] text-zinc-500 mt-1">{t.description}</p>
                            )}
                            
                            {/* Checklists */}
                            {t.checklist && t.checklist.length > 0 && (
                              <div className="mt-2 pl-3 space-y-1">
                                {t.checklist.map((c, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-zinc-450">
                                    <CheckSquare className={`h-3 w-3 ${c.isCompleted ? 'text-green-500' : 'text-zinc-400'}`} />
                                    <span className={c.isCompleted ? 'line-through opacity-70' : ''}>{c.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TIMESHEET ANALYTICAL MODE */
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
                  <p className="text-xs text-zinc-455">{t("stats.noTimeLogged")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeMembersForChart.map((m, idx) => {
                    const maxHours = Math.max(...activeMembersForChart.map((mem) => mem.hours), 1);
                    const widthPercent = (m.hours / maxHours) * 100;
                    return (
                      <div key={idx} className="space-y-1.5 text-xs text-start">
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
                          <td className="py-3 px-2 font-bold max-w-[140px] truncate text-start" title={log.taskTitle}>
                            {log.taskTitle}
                          </td>
                          <td className="py-3 px-2 text-start">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={member.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                                alt="Avatar"
                                className="h-4.5 w-4.5 rounded-full border bg-zinc-800"
                              />
                              <span className="truncate max-w-[90px]">{member.fullName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-extrabold text-purple-600 dark:text-purple-400 text-start">
                            {log.hours}h
                          </td>
                          <td className="py-3 px-2 text-zinc-400 text-start">
                            {log.date ? new Date(log.date).toLocaleDateString() : ""}
                          </td>
                          <td className="py-3 px-2 max-w-[120px] truncate text-zinc-455 italic text-start" title={log.comment}>
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
      )}

      {/* HIDDEN CONTAINER FOR BEAUTIFULLY STYLED PDF REPORT PRINTING */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
        <div 
          ref={printContainerRef}
          id="reports-print-content"
          style={{
            padding: "40px",
            color: "#1f2937",
            backgroundColor: "#ffffff",
            width: "210mm",
            minHeight: "297mm",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            boxSizing: "border-box"
          }}
        >
          {reportMode === "client" ? (
            /* PRINT TEMPLATE: CLIENT REPORT LAYOUT */
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {/* Header block with agency metadata */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #7c3aed", paddingBottom: "20px", marginBottom: "30px" }}>
                <div>
                  <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#6d28d9", textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>
                    Arab Pro Digital Agency
                  </h3>
                  <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#111827", margin: "8px 0 4px 0" }}>
                    {reportTitle}
                  </h1>
                  <p style={{ fontSize: "12px", margin: 0, color: "#4b5563" }}>
                    Prepared for: <strong style={{ color: "#111827" }}>{clientName}</strong>
                  </p>
                </div>
                <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
                  <p style={{ margin: 0 }}><strong>Date:</strong> {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
                  <p style={{ margin: "4px 0 0 0" }}>TaskFlow Management System</p>
                </div>
              </div>

              {/* Summary Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "20px", marginBottom: "30px" }}>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", backgroundColor: "#f9fafb" }}>
                  <span style={{ fontSize: "9px", fontWeight: "800", color: "#6b7280", textTransform: "uppercase", display: "block" }}>
                    Tasks Completed
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#10b981" }}>{completedTasksCount} / {totalTasksCount}</span>
                </div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", backgroundColor: "#f9fafb" }}>
                  <span style={{ fontSize: "9px", fontWeight: "800", color: "#6b7280", textTransform: "uppercase", display: "block" }}>
                    Completion Rate
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#7c3aed" }}>{productivityScore}%</span>
                </div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", backgroundColor: "#f9fafb" }}>
                  <span style={{ fontSize: "9px", fontWeight: "800", color: "#6b7280", textTransform: "uppercase", display: "block" }}>
                    Tracked Work Hours
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#3b82f6" }}>{totalLoggedHours} Hours</span>
                </div>
              </div>

              {/* Overview Section */}
              <div style={{ marginBottom: "35px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#374151", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px", marginBottom: "10px" }}>
                  1. Project Overview & Deliverables
                </h4>
                <p style={{ fontSize: "11.5px", lineHeight: "1.6", color: "#4b5563", margin: 0, padding: "12px 16px", backgroundColor: "#f3f4f6", borderLeft: "4px solid #7c3aed", borderRadius: "0 8px 8px 0", fontStyle: "italic" }}>
                  {reportOverview}
                </p>
              </div>

              {/* Department breakdown */}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#374151", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px", marginBottom: "16px" }}>
                  2. Deliverables by Department
                </h4>

                {Object.keys(groupedTasks).length === 0 ? (
                  <p style={{ fontSize: "11px", fontStyle: "italic", color: "#9ca3af" }}>No tasks logged in this project workspace.</p>
                ) : (
                  Object.entries(groupedTasks).map(([spaceId, spaceTasks]) => (
                    <div key={spaceId} style={{ marginBottom: "24px", pageBreakInside: "avoid" as const }}>
                      <h5 style={{ fontSize: "12px", fontWeight: "800", color: "#6d28d9", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px", margin: "0 0 10px 0", display: "flex", justifyContent: "space-between" }}>
                        <span>{getSpaceName(spaceId)}</span>
                        <span style={{ fontWeight: "normal", color: "#9ca3af", fontSize: "10px" }}>{spaceTasks.length} Deliverables</span>
                      </h5>

                      <table style={{ width: "100%", fontSize: "10.5px", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1.5px solid #e5e7eb", color: "#6b7280", fontWeight: "700", textAlign: "left" }}>
                            <th style={{ padding: "6px" }}>Task / Milestone Name</th>
                            <th style={{ padding: "6px" }}>Description</th>
                            <th style={{ padding: "6px", width: "100px", textAlign: "center" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spaceTasks.map((t) => (
                            <tr key={t._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "8px 6px", fontWeight: "750", color: "#111827", verticalAlign: "top" }}>
                                {t.title}
                                {t.checklist && t.checklist.length > 0 && (
                                  <div style={{ marginTop: "4px", paddingLeft: "8px" }}>
                                    {t.checklist.map((c, i) => (
                                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", color: c.isCompleted ? "#10b981" : "#9ca3af", marginTop: "2px" }}>
                                        <span>•</span>
                                        <span style={{ textDecoration: c.isCompleted ? "line-through" : "none" }}>{c.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "8px 6px", color: "#4b5563", verticalAlign: "top" }}>{t.description || "-"}</td>
                              <td style={{ padding: "8px 6px", textAlign: "center", verticalAlign: "top" }}>
                                <span style={{
                                  fontSize: "9px",
                                  fontWeight: "700",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: t.status === "done" ? "#d1fae5" : "#fef3c7",
                                  color: t.status === "done" ? "#065f46" : "#92400e",
                                  textTransform: "uppercase"
                                }}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>

              {/* Print Footer */}
              <div style={{ marginTop: "auto", borderTop: "1px solid #e5e7eb", paddingTop: "14px", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#9ca3af" }}>
                <span>Report generated by Arab Pro Digital Agency via Mogoo TaskFlow.</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          ) : (
            /* PRINT TEMPLATE: TIMESHEET LAYOUT */
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {/* PDF Report Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #7c3aed", paddingBottom: "16px", marginBottom: "32px" }}>
                <div>
                  <h1 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", color: "#6d28d9", letterSpacing: "0.05em", margin: 0 }}>
                    Timesheet & Productivity Report
                  </h1>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#71717a", margin: "4px 0 0 0" }}>
                    Workspace: <span style={{ color: "#000000", fontWeight: "900" }}>{workspaceName}</span>
                  </p>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#a1a1aa" }}>
                  <p style={{ margin: 0 }}>{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
                  <p style={{ margin: "4px 0 0 0" }}>Mogoo Taskflow Timesheet System</p>
                </div>
              </div>

              {/* KPI Dashboard Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "24px", marginBottom: "32px" }}>
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "16px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", display: "block" }}>
                    Total Tracked Hours
                  </span>
                  <span style={{ fontSize: "20px", fontWeight: "900", color: "#7c3aed", display: "block", marginTop: "4px" }}>{totalLoggedHours} Hours</span>
                </div>
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "16px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", display: "block" }}>
                    Productivity Score
                  </span>
                  <span style={{ fontSize: "20px", fontWeight: "900", color: "#10b981", display: "block", marginTop: "4px" }}>{productivityScore}%</span>
                </div>
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "16px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#71717a", textTransform: "uppercase", display: "block" }}>
                    Completion Ratio
                  </span>
                  <span style={{ fontSize: "20px", fontWeight: "900", color: "#3b82f6", display: "block", marginTop: "4px" }}>{completedTasksCount} / {totalTasksCount} Tasks</span>
                </div>
              </div>

              {/* Logged Hours Breakdown list */}
              <div style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "12px", padding: "20px", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "900", color: "#71717a", textTransform: "uppercase", borderBottom: "1px solid #e4e4e7", paddingBottom: "8px", margin: "0 0 12px 0" }}>
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
                <h3 style={{ fontSize: "12px", fontWeight: "900", color: "#71717a", textTransform: "uppercase", borderBottom: "1px solid #e4e4e7", paddingBottom: "8px", margin: "0 0 12px 0" }}>
                  Timesheet & Logs Detail (Top 15 Entries)
                </h3>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e4e4e7", color: "#71717a", fontWeight: "700", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>{t("stats.taskTitle")}</th>
                      <th style={{ padding: "8px" }}>{t("stats.loggedBy")}</th>
                      <th style={{ padding: "8px" }}>{t("stats.loggedHours")}</th>
                      <th style={{ padding: "8px" }}>{t("stats.date")}</th>
                      <th style={{ padding: "8px" }}>{t("stats.notes")}</th>
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
          )}
        </div>
      </div>

    </div>
  );
};
