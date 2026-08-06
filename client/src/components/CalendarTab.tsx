import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
} from "lucide-react";
import type { Task } from "../services/taskflowService";

interface CalendarTabProps {
  workspaceName?: string;
  tasks: Task[];
  members: any[];
  onTaskClick: (task: Task) => void;
}

const getPriorityDotColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-500";
    case "high":
      return "bg-amber-500";
    case "medium":
      return "bg-purple-500";
    default:
      return "bg-zinc-500";
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "done":
      return "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400";
    case "in-progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400";
    default:
      return "bg-zinc-150 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
  }
};

export const CalendarTab: React.FC<Omit<CalendarTabProps, "members">> = ({
  workspaceName = "Workspace",
  tasks,
  onTaskClick,
}) => {
  const { i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);

  const isRTL = i18n.language === "ar";

  // --- Date Calculation Helpers ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get weekday names
  const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdaysAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const weekdays = isRTL ? weekdaysAr : weekdaysEn;

  // Month names
  const monthsEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthsAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  const monthName = isRTL ? monthsAr[month] : monthsEn[month];

  // Helper to filter tasks scheduled/due on a specific date
  const getTasksForDay = (date: Date) => {
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return tasks.filter((task) => {
      if (!task.startDate && !task.dueDate) return false;

      const start = task.startDate ? new Date(task.startDate) : null;
      const due = task.dueDate ? new Date(task.dueDate) : null;

      const startTime = start
        ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
        : null;
      const dueTime = due
        ? new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
        : null;

      if (startTime && dueTime) {
        return targetTime >= startTime && targetTime <= dueTime;
      } else if (startTime) {
        return targetTime === startTime;
      } else if (dueTime) {
        return targetTime === dueTime;
      }
      return false;
    });
  };

  // Navigations
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // --- Render Month View Grid ---
  const renderMonthView = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: React.ReactNode[] = [];

    // Prepend padding from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      const dayTasks = getTasksForDay(prevDate);
      cells.push(
        <div
          key={`prev-${i}`}
          className="min-h-[110px] p-2 border border-zinc-100 dark:border-zinc-800/40 bg-zinc-55/40 dark:bg-zinc-950/5 text-zinc-400 dark:text-zinc-650 opacity-60 flex flex-col justify-between"
        >
          <span className="text-xs font-bold font-mono">{prevDate.getDate()}</span>
          <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none max-h-[80px]">
            {dayTasks.slice(0, 3).map((t) => (
              <div
                key={t._id}
                onClick={() => onTaskClick(t)}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-800/40 truncate cursor-pointer hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-semibold flex items-center gap-1"
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getPriorityDotColor(t.priority)}`} />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-[9px] text-zinc-400 font-bold text-center">
                +{dayTasks.length - 3} {isRTL ? "مهام أخرى" : "more"}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Days of current month
    const today = new Date();
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayTasks = getTasksForDay(date);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      cells.push(
        <div
          key={`day-${d}`}
          onClick={() => {
            if (dayTasks.length > 0) setSelectedDayTasks(dayTasks);
          }}
          className={`min-h-[110px] p-2 border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/30 flex flex-col justify-between transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 cursor-pointer ${
            isToday
              ? "ring-2 ring-purple-600/50 dark:ring-purple-500/50 border-purple-500 shadow-xs"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-black font-mono h-6 w-6 rounded-full flex items-center justify-center ${
                isToday
                  ? "bg-purple-600 text-white dark:bg-purple-500"
                  : "text-zinc-800 dark:text-zinc-200"
              }`}
            >
              {d}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-[9px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                {dayTasks.length} {dayTasks.length === 1 ? (isRTL ? "مهمة" : "task") : (isRTL ? "مهام" : "tasks")}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 mt-1.5 scrollbar-none max-h-[75px]">
            {dayTasks.slice(0, 3).map((t) => (
              <div
                key={t._id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(t);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 truncate cursor-pointer hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-semibold flex items-center gap-1"
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getPriorityDotColor(t.priority)}`} />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold text-center mt-0.5">
                +{dayTasks.length - 3} {isRTL ? "أخرى" : "more"}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Append padding from next month
    const totalCells = cells.length;
    const nextMonthPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= nextMonthPadding; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dayTasks = getTasksForDay(nextDate);
      cells.push(
        <div
          key={`next-${i}`}
          className="min-h-[110px] p-2 border border-zinc-100 dark:border-zinc-800/40 bg-zinc-55/40 dark:bg-zinc-950/5 text-zinc-400 dark:text-zinc-650 opacity-60 flex flex-col justify-between"
        >
          <span className="text-xs font-bold font-mono">{nextDate.getDate()}</span>
          <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none max-h-[80px]">
            {dayTasks.slice(0, 3).map((t) => (
              <div
                key={t._id}
                onClick={() => onTaskClick(t)}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-800/40 truncate cursor-pointer hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-semibold flex items-center gap-1"
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getPriorityDotColor(t.priority)}`} />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-[9px] text-zinc-400 font-bold text-center">
                +{dayTasks.length - 3} {isRTL ? "أخرى" : "more"}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-xs border dark:border-zinc-800/70">
        {cells}
      </div>
    );
  };

  // --- Render Week View ---
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOffset = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOffset); // Sunday

    const columns: React.ReactNode[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      const dayTasks = getTasksForDay(date);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      columns.push(
        <div
          key={`week-day-${i}`}
          className={`flex-1 min-h-[300px] bg-white dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800/70 p-3 flex flex-col rounded-xl shadow-xs transition-theme ${
            isToday ? "ring-2 ring-purple-500/30 dark:ring-purple-500/20 border-purple-500" : ""
          }`}
        >
          <div className="text-center pb-2 border-b dark:border-zinc-800 shrink-0">
            <p className="text-[11px] uppercase tracking-wider font-bold text-zinc-455 dark:text-zinc-500">
              {weekdays[i]}
            </p>
            <p
              className={`text-lg font-black font-mono inline-block h-8 w-8 rounded-full leading-8 text-center mt-1 transition-all ${
                isToday
                  ? "bg-purple-600 text-white dark:bg-purple-500"
                  : "text-zinc-800 dark:text-zinc-250"
              }`}
            >
              {date.getDate()}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-0.5 custom-scrollbar">
            {dayTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                <Sparkles className="h-5 w-5 text-zinc-400 mb-1" />
                <span className="text-[10px] text-zinc-400">{isRTL ? "لا مهام" : "Clear Day"}</span>
              </div>
            ) : (
              dayTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => onTaskClick(t)}
                  className="bg-zinc-50/50 dark:bg-zinc-850/20 border border-zinc-150 dark:border-zinc-800/50 hover:border-purple-500/40 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-start cursor-pointer group"
                >
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                    {t.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2.5">
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize ${getStatusBadgeStyle(
                        t.status
                      )}`}
                    >
                      {t.status}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${getPriorityDotColor(t.priority)}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return <div className="flex flex-col md:flex-row gap-3">{columns}</div>;
  };

  // --- Render Day View ---
  const renderDayView = () => {
    const dayTasks = getTasksForDay(currentDate);
    const todayStr = currentDate.toLocaleDateString(i18n.language, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-theme text-start max-w-2xl mx-auto">
        <div className="flex items-center gap-2 border-b dark:border-zinc-850 pb-4 mb-4">
          <CalendarIcon className="h-5 w-5 text-purple-500" />
          <h3 className="font-extrabold text-base text-zinc-855 dark:text-zinc-100">{todayStr}</h3>
        </div>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {dayTasks.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-10 w-10 text-zinc-300 dark:text-zinc-700 animate-pulse" />
              <p className="text-sm font-semibold">{isRTL ? "لا توجد مهام مجدولة لهذا اليوم" : "No tasks scheduled for this day."}</p>
            </div>
          ) : (
            dayTasks.map((t) => (
              <div
                key={t._id}
                onClick={() => onTaskClick(t)}
                className="group flex items-center justify-between p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 hover:border-purple-500/50 hover:bg-white dark:hover:bg-zinc-850/40 transition-all cursor-pointer shadow-xs"
              >
                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className="text-xs text-zinc-550 truncate max-w-md">{t.description}</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-3 ms-4">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none capitalize ${getPriorityDotColor(
                      t.priority
                    )} text-white`}
                  >
                    {t.priority}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md capitalize ${getStatusBadgeStyle(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/20 transition-theme">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{isRTL ? "التقويم التفاعلي" : "Interactive Calendar"}</span>
          </h2>
          <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
            {isRTL
              ? `إدارة وجدولة مهام مساحة العمل "${workspaceName}" حسب تواريخ استحقاقها.`
              : `Manage and schedule tasks for "${workspaceName}" workspace according to their timelines.`}
          </p>
        </div>

        {/* View Mode Selectors */}
        <div className="bg-zinc-150 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-1 rounded-xl flex gap-1 self-start sm:self-auto shrink-0 select-none">
          {(["month", "week", "day"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setSelectedDayTasks(null);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                viewMode === mode
                  ? "bg-purple-600 text-white dark:bg-purple-500 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
              }`}
            >
              {mode === "month" ? (isRTL ? "شهري" : "month") : mode === "week" ? (isRTL ? "أسبوعي" : "week") : (isRTL ? "يومي" : "day")}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Calendar Toolbar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm shrink-0 transition-theme">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 border border-zinc-250 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <button
            onClick={handleToday}
            className="text-xs font-bold px-3 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isRTL ? "اليوم" : "Today"}
          </button>

          <button
            onClick={handleNext}
            className="p-2 border border-zinc-250 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-black tracking-tight text-zinc-800 dark:text-zinc-150 capitalize">
            {monthName} {year}
          </h2>
        </div>
      </div>

      {/* 3. Weekday Columns Header (Only Month view) */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 text-center font-bold text-xs text-zinc-450 dark:text-zinc-555 uppercase tracking-wider bg-zinc-100/50 dark:bg-zinc-900/10 py-2.5 rounded-lg border dark:border-zinc-850 shrink-0 select-none">
          {weekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
      )}

      {/* 4. Calendar Dynamic Body */}
      <div className="flex-1 min-h-[350px]">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>

      {/* 5. Modal showing tasks for a selected day in Month View */}
      <AnimatePresence>
        {selectedDayTasks && (
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40"
            onClick={() => setSelectedDayTasks(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col text-start"
            >
              <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3 shrink-0">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-purple-500" />
                  <span>{isRTL ? "مهام هذا اليوم" : "Scheduled Day Tasks"}</span>
                </h3>
                <button
                  onClick={() => setSelectedDayTasks(null)}
                  className="text-xs font-bold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  {isRTL ? "إغلاق" : "Close"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                {selectedDayTasks.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => {
                      setSelectedDayTasks(null);
                      onTaskClick(t);
                    }}
                    className="p-3 bg-zinc-50 dark:bg-zinc-950/20 hover:bg-purple-500/5 border dark:border-zinc-800/80 rounded-xl cursor-pointer hover:border-purple-500/40 transition-all"
                  >
                    <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">{t.title}</h4>
                    {t.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${getStatusBadgeStyle(t.status)}`}>
                        {t.status}
                      </span>
                      <span className={`h-2 w-2 rounded-full ${getPriorityDotColor(t.priority)}`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
