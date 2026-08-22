import React, { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Search,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { Task } from "../services/taskflowService";

interface GanttTabProps {
  workspaceName?: string;
  tasks: Task[];
  members: any[];
  onTaskClick: (task: Task) => void;
}

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

const getStatusGanttColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "done":
      return "from-green-400 to-emerald-500 shadow-emerald-500/10";
    case "in-progress":
      return "from-blue-400 to-indigo-500 shadow-indigo-500/10";
    default:
      return "from-purple-400 to-fuchsia-500 shadow-fuchsia-500/10";
  }
};

export const GanttTab: React.FC<Omit<GanttTabProps, "members">> = ({
  workspaceName = "Workspace",
  tasks,
  onTaskClick,
}) => {
  const { i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const timelineScrollContainerRef = useRef<HTMLDivElement>(null);

  const isRTL = i18n.language === "ar";
  const cellWidth = 44; // Column width in pixels

  // 1. Get Timeline Bounds dynamically
  const timelineBounds = useMemo(() => {
    const dates = tasks
      .flatMap((t) => [
        t.startDate ? new Date(t.startDate) : null,
        t.dueDate ? new Date(t.dueDate) : null,
      ])
      .filter((d): d is Date => d !== null);

    let start = new Date();
    start.setDate(start.getDate() - 5); // Default today - 5 days
    let end = new Date();
    end.setDate(end.getDate() + 25); // Default today + 25 days

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

      minDate.setDate(minDate.getDate() - 3);
      maxDate.setDate(maxDate.getDate() + 5);

      if (minDate < start) start = minDate;
      if (maxDate > end) end = maxDate;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, [tasks]);

  // 2. Generate Days Array
  const daysList = useMemo(() => {
    const list: Date[] = [];
    const curr = new Date(timelineBounds.start);
    while (curr <= timelineBounds.end) {
      list.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, [timelineBounds]);

  // 3. Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesPriority = priorityFilter === "all" || t.priority.toLowerCase() === priorityFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // 4. Split tasks into Scheduled and Unscheduled
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: Task[] = [];
    const unscheduled: Task[] = [];

    filteredTasks.forEach((t) => {
      if (t.startDate || t.dueDate) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    });

    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [filteredTasks]);

  // 5. Scroll timeline left/right
  const handleScrollTimeline = (direction: "left" | "right") => {
    if (timelineScrollContainerRef.current) {
      const scrollAmt = 200;
      timelineScrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmt : scrollAmt,
        behavior: "smooth",
      });
    }
  };

  // Helper to format date range
  const formatDateRange = (task: Task) => {
    if (!task.startDate && !task.dueDate) return isRTL ? "غير مجدول" : "Unscheduled";
    const startStr = task.startDate ? new Date(task.startDate).toLocaleDateString(i18n.language, { month: "short", day: "numeric" }) : "?";
    const dueStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString(i18n.language, { month: "short", day: "numeric" }) : "?";
    return `${startStr} - ${dueStr}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/20 transition-theme">

      {/* 1. Header Metadata Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{isRTL ? "مخطط جانت التفاعلي" : "Gantt Timeline Chart"}</span>
          </h2>
          <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
            {isRTL
              ? `عرض الجداول الزمنية لتداخل المهام، وتوزيع فتراتها في مساحة العمل "${workspaceName}".`
              : `View project schedules, overlapping tasks, and timeline details in "${workspaceName}".`}
          </p>
        </div>

        {/* Scroll Nav buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleScrollTimeline(isRTL ? "right" : "left")}
            className="p-2 border border-zinc-250 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleScrollTimeline(isRTL ? "left" : "right")}
            className="p-2 border border-zinc-250 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Filter & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm shrink-0 transition-theme">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={isRTL ? "بحث في المهام..." : "Search tasks..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 ps-9 pe-3 text-xs focus:ring-2 focus:ring-purple-500/50 focus:outline-hidden"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 text-xs outline-hidden focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">{isRTL ? "كل الحالات" : "All Statuses"}</option>
              <option value="to-do">{isRTL ? "بانتظار البدء" : "To Do"}</option>
              <option value="in-progress">{isRTL ? "قيد التنفيذ" : "In Progress"}</option>
              <option value="done">{isRTL ? "تم الانتهاء" : "Done"}</option>
            </select>
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 text-xs outline-hidden focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">{isRTL ? "كل الأولويات" : "All Priorities"}</option>
            <option value="low">{isRTL ? "منخفضة" : "Low"}</option>
            <option value="medium">{isRTL ? "متوسطة" : "Medium"}</option>
            <option value="high">{isRTL ? "عالية" : "High"}</option>
            <option value="urgent">{isRTL ? "عاجلة" : "Urgent"}</option>
          </select>
        </div>

        <div className="text-xs font-bold text-zinc-400 dark:text-zinc-550 shrink-0">
          {filteredTasks.length} {isRTL ? "مهمة مُصفّاة" : "filtered tasks"}
        </div>
      </div>

      {/* 3. Gantt Layout Container */}
      <div className="flex-1 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/30 overflow-hidden flex flex-col transition-theme shadow-xs">

        {/* Scheduled Tasks Timeline View */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* A. Left Task List Columns Panel (Sticky/Fixed) */}
          <div className="w-[300px] border-e border-zinc-200 dark:border-zinc-850 shrink-0 bg-white dark:bg-zinc-900/60 z-10 flex flex-col">
            {/* Header column title */}
            <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center px-4 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {isRTL ? "المهام والجدول الزمني" : "Task & Duration"}
            </div>

            {/* List items */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-800/50 scrollbar-none">
              {scheduledTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400 italic">
                  {isRTL ? "لا توجد مهام مجدولة حالياً" : "No scheduled tasks found"}
                </div>
              ) : (
                scheduledTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => onTaskClick(task)}
                    className="h-12 flex flex-col justify-center px-4 cursor-pointer hover:bg-purple-500/5 transition-all text-start"
                  >
                    <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate group-hover:text-purple-600">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono truncate">{formatDateRange(task)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* B. Right Timeline Grid Panel (Horizontal Scrollable) */}
          <div
            ref={timelineScrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col bg-zinc-50/10 dark:bg-zinc-950/5 relative kanban-scrollbar"
          >
            {/* Timeline Header Row (Months & Days) */}
            <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/85 shrink-0 flex flex-col select-none relative bg-zinc-50/50 dark:bg-zinc-950/20" style={{ width: daysList.length * cellWidth }}>

              {/* Day dates */}
              <div className="h-full flex divide-x divide-zinc-200/50 dark:divide-zinc-800/50">
                {daysList.map((day, idx) => {
                  const today = new Date();
                  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();

                  return (
                    <div
                      key={idx}
                      className={`h-full flex flex-col items-center justify-center font-bold text-[10px] font-mono shrink-0 ${isToday ? "bg-purple-600/10 text-purple-600 dark:text-purple-400 border-x border-purple-500/20" : "text-zinc-500"
                        }`}
                      style={{ width: cellWidth }}
                    >
                      <span className="text-[8px] opacity-75">{day.toLocaleDateString(i18n.language, { month: "short" })}</span>
                      <span className="text-xs font-black mt-0.5">{day.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Rows Container */}
            <div className="flex-1 overflow-y-auto scrollbar-none relative" style={{ width: daysList.length * cellWidth }}>
              {/* Vertical grids for days */}
              <div className="absolute inset-0 flex pointer-events-none divide-x divide-zinc-150/40 dark:divide-zinc-850/30">
                {daysList.map((day, idx) => {
                  const today = new Date();
                  const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
                  return (
                    <div
                      key={idx}
                      className={`h-full shrink-0 ${isToday ? "bg-purple-500/5" : ""}`}
                      style={{ width: cellWidth }}
                    />
                  );
                })}
              </div>

              {/* Task timelines rows wrapper */}
              <div className="relative divide-y divide-zinc-150/50 dark:divide-zinc-800/40">
                {scheduledTasks.map((task) => {
                  // Calculate absolute position on the grid
                  const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.dueDate || new Date());
                  const taskDue = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate || new Date());

                  // Clamp dates to timeline bounds
                  const clampedStart = new Date(Math.max(taskStart.getTime(), timelineBounds.start.getTime()));
                  const clampedDue = new Date(Math.min(taskDue.getTime(), timelineBounds.end.getTime()));

                  // Calculate offsets
                  const offsetDays = Math.round((clampedStart.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24));
                  const durationDays = Math.round((clampedDue.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  const barLeft = offsetDays * cellWidth;
                  const barWidth = durationDays * cellWidth;

                  return (
                    <div key={task._id} className="h-12 relative flex items-center">
                      <div
                        onClick={() => onTaskClick(task)}
                        className={`absolute h-7 rounded-xl bg-gradient-to-r ${getStatusGanttColor(task.status)} border border-white/20 hover:border-white/50 text-white shadow-xs p-1.5 flex items-center justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all z-10 overflow-hidden select-none group`}
                        style={{
                          left: isRTL ? undefined : barLeft + 4,
                          right: isRTL ? barLeft + 4 : undefined,
                          width: Math.max(barWidth - 8, 25),
                        }}
                        title={`${task.title} (${formatDateRange(task)})`}
                      >
                        <span className="text-[10px] font-black truncate drop-shadow-sm px-1.5">
                          {task.title}
                        </span>
                        <Clock className="h-3 w-3 opacity-60 group-hover:opacity-100 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* C. Unscheduled Tasks Panel (Sticky Drawer/Footer) */}
        {unscheduledTasks.length > 0 && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 shrink-0 transition-theme text-start">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>{isRTL ? "مهام غير مجدولة (تحتاج لتحديد تواريخ)" : "Unscheduled Tasks (Requires Dates)"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-extrabold select-none">
                {unscheduledTasks.length}
              </span>
            </h4>

            <div className="flex flex-wrap gap-2.5 max-h-24 overflow-y-auto pr-1">
              {unscheduledTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => onTaskClick(task)}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex items-center gap-2 cursor-pointer hover:border-purple-500/50 hover:shadow-xs transition-all shrink-0"
                >
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 max-w-[150px] truncate">
                    {task.title}
                  </span>
                  <Plus className="h-3 w-3 text-zinc-400 hover:text-purple-600" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
