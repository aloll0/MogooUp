import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimeTrackerState {
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  startTime: number | null; // Timestamp in ms
  elapsedSeconds: number;
  isPaused: boolean;
  start: (taskId: string, taskTitle: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => number; // Returns total elapsed seconds
  reset: () => void;
  getElapsedSeconds: () => number;
}

export const useTimeTrackerStore = create<TimeTrackerState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      activeTaskTitle: null,
      startTime: null,
      elapsedSeconds: 0,
      isPaused: false,

      start: (taskId, taskTitle) => {
        set({
          activeTaskId: taskId,
          activeTaskTitle: taskTitle,
          startTime: Date.now(),
          elapsedSeconds: 0,
          isPaused: false,
        });
      },

      pause: () => {
        const { startTime, elapsedSeconds } = get();
        if (startTime) {
          const additional = Math.floor((Date.now() - startTime) / 1000);
          set({
            elapsedSeconds: elapsedSeconds + additional,
            startTime: null,
            isPaused: true,
          });
        }
      },

      resume: () => {
        set({
          startTime: Date.now(),
          isPaused: false,
        });
      },

      stop: () => {
        const { startTime, elapsedSeconds } = get();
        let total = elapsedSeconds;
        if (startTime) {
          total += Math.floor((Date.now() - startTime) / 1000);
        }
        set({
          activeTaskId: null,
          activeTaskTitle: null,
          startTime: null,
          elapsedSeconds: 0,
          isPaused: false,
        });
        return total;
      },

      reset: () => {
        set({
          activeTaskId: null,
          activeTaskTitle: null,
          startTime: null,
          elapsedSeconds: 0,
          isPaused: false,
        });
      },

      getElapsedSeconds: () => {
        const { startTime, elapsedSeconds, isPaused } = get();
        if (isPaused || !startTime) {
          return elapsedSeconds;
        }
        return elapsedSeconds + Math.floor((Date.now() - startTime) / 1000);
      },
    }),
    {
      name: "mogoo_time_tracker_state",
    }
  )
);
