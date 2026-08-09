import { create } from "zustand";
import { taskflowService } from "../services/taskflowService";

interface ScratchpadState {
  content: string;
  isLoading: boolean;
  isSaving: boolean;
  setContent: (content: string) => void;
  fetchScratchpad: () => Promise<void>;
  syncWithBackend: (content: string) => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useScratchpadStore = create<ScratchpadState>((set, get) => ({
  content: "",
  isLoading: false,
  isSaving: false,

  setContent: (content) => {
    set({ content });
    get().syncWithBackend(content);
  },

  fetchScratchpad: async () => {
    set({ isLoading: true });
    try {
      const scratchpad = await taskflowService.getScratchpad();
      set({ content: scratchpad.content, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch scratchpad", err);
      set({ isLoading: false });
    }
  },

  syncWithBackend: (content) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    set({ isSaving: true });

    debounceTimer = setTimeout(async () => {
      try {
        await taskflowService.updateScratchpad(content);
        set({ isSaving: false });
      } catch (err) {
        console.error("Failed to auto-save scratchpad", err);
        set({ isSaving: false });
      }
    }, 1500); // Debounce for 1.5 seconds of inactivity to protect performance
  },
}));
