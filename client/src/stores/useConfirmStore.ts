import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  resolve: ((value: boolean) => void) | null;
  show: (options: ConfirmOptions) => Promise<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: "",
  message: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  resolve: null,
  show: ({ title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        resolve,
      });
    });
  },
  onConfirm: () => {
    const { resolve } = get();
    if (resolve) resolve(true);
    set({ isOpen: false, resolve: null });
  },
  onCancel: () => {
    const { resolve } = get();
    if (resolve) resolve(false);
    set({ isOpen: false, resolve: null });
  },
}));
