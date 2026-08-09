import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Play, Pause, Square, Clock, ChevronDown, ChevronUp, Loader2, Save, X } from "lucide-react";
import { useTimeTrackerStore } from "../stores/useTimeTrackerStore";
import { taskflowService } from "../services/taskflowService";
import type { Task } from "../services/taskflowService";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";

interface TimeTrackerWidgetProps {
  tasks: Task[];
}

export const TimeTrackerWidget: React.FC<TimeTrackerWidgetProps> = ({ tasks }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    activeTaskId,
    activeTaskTitle,
    startTime,
    elapsedSeconds,
    isPaused,
    start,
    pause,
    resume,
    stop,
    getElapsedSeconds,
  } = useTimeTrackerStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Time logging details
  const [loggedSeconds, setLoggedSeconds] = useState(0);
  const [logHours, setLogHours] = useState("");
  const [logComment, setLogComment] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute formatted time (HH:MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((val) => (val < 10 ? `0${val}` : `${val}`))
      .join(":");
  };

  // Timer Tick Interval
  useEffect(() => {
    if (activeTaskId && !isPaused) {
      intervalRef.current = setInterval(() => {
        setDisplayTime(formatTime(getElapsedSeconds()));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayTime(formatTime(getElapsedSeconds()));
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTaskId, isPaused, startTime, elapsedSeconds, getElapsedSeconds]);

  // Pre-fill task select state
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0]._id);
    }
  }, [tasks, selectedTaskId]);

  const handleStart = () => {
    if (!selectedTaskId) return;
    const task = tasks.find((t) => t._id === selectedTaskId);
    if (task) {
      start(task._id, task.title);
    }
  };

  const handleStop = () => {
    const totalTrackedSeconds = stop();
    setLoggedSeconds(totalTrackedSeconds);

    // Convert seconds to decimal hours (rounded to 2 places)
    const hoursDecimal = Math.max(0.01, Number((totalTrackedSeconds / 3600).toFixed(2)));
    setLogHours(hoursDecimal.toString());
    setIsLogModalOpen(true);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskId && !loggedSeconds) return;

    const hoursVal = Number(logHours);
    if (isNaN(hoursVal) || hoursVal <= 0) {
      alert("Please enter a valid number of hours.");
      return;
    }

    setIsSaving(true);
    try {
      // Find the task we are logging for
      const targetId = activeTaskId || selectedTaskId;
      const task = tasks.find((t) => t._id === targetId);
      if (!task) throw new Error("Task not found");

      const newLog = {
        userId: user!.id,
        hours: hoursVal,
        comment: logComment,
        date: new Date(logDate).toISOString(),
      };

      const existingLogs = task.loggedTime || [];
      await taskflowService.updateTask(task._id, {
        loggedTime: [...existingLogs, newLog],
      });

      // Clear states & close modal
      setIsLogModalOpen(false);
      setLogComment("");
      setLogHours("");
      
      // Invalidate queries so dashboard and boards update hours count
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", task._id] });
    } catch (err) {
      console.error("Failed to log tracked time", err);
      alert("Error saving time log.");
    } finally {
      setIsSaving(false);
    }
  };

  // If no tasks available to track, hide the widget
  if (tasks.length === 0) return null;

  return (
    <>
      {/* Floating Widget Bar */}
      <div
        className={`fixed bottom-6 right-6 z-40 bg-zinc-900 text-zinc-100 rounded-2xl shadow-2xl border border-zinc-800 transition-all duration-300 overflow-hidden ${
          isMinimized ? "w-44" : "w-80"
        }`}
      >
        {/* Header Title / Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2 font-bold text-xs select-none">
            <Clock className={`h-4 w-4 ${activeTaskId && !isPaused ? "text-purple-400 animate-pulse" : "text-zinc-400"}`} />
            <span>{t("timeTracker.timeTracker")}</span>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Contents */}
        <div className="p-4 space-y-3">
          {activeTaskId ? (
            // Timer active status layout
            <div className="space-y-3">
              {!isMinimized && (
                <div className="text-xs">
                  <span className="text-zinc-450 uppercase font-extrabold text-[9px] tracking-wider block mb-1">
                    Currently Tracking
                  </span>
                  <div className="font-bold text-zinc-200 truncate">{activeTaskTitle}</div>
                </div>
              )}

              {/* Digital clock display */}
              <div className="text-center font-mono text-2xl font-black text-purple-400 bg-zinc-950/40 py-2.5 rounded-xl border border-zinc-850">
                {displayTime}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2 justify-center">
                {isPaused ? (
                  <button
                    onClick={resume}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{t("timeTracker.resumeTracking")}</span>
                  </button>
                ) : (
                  <button
                    onClick={pause}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl text-xs font-bold text-zinc-200 transition-all cursor-pointer"
                  >
                    <Pause className="h-3.5 w-3.5 fill-current" />
                    <span>{t("timeTracker.pauseTracking")}</span>
                  </button>
                )}

                <button
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>{t("timeTracker.stopTracking")}</span>
                </button>
              </div>
            </div>
          ) : (
            // Select task and Start layout
            !isMinimized && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                    {t("timeTracker.selectTaskToTrack")}
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl py-2 px-3 focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    {tasks.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleStart}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{t("timeTracker.startTracking")}</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Log tracked hours modal popup */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-purple-500" />
              <span>{t("timeTracker.logTimeTitle")}</span>
            </h3>

            <form onSubmit={handleLogSubmit} className="space-y-4 text-start">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                    {t("timeTracker.hoursSpent")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                    {t("stats.dateLabel")}
                  </label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase">
                  {t("timeTracker.commentLabel")}
                </label>
                <textarea
                  value={logComment}
                  onChange={(e) => setLogComment(e.target.value)}
                  placeholder="What work did you accomplish?"
                  className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-sm h-24 focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 resize-none text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-650 dark:text-zinc-350 rounded-xl transition-all cursor-pointer"
                >
                  {t("timeTracker.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{t("timeTracker.saveLog")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
