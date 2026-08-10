import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useConfirmStore } from "../stores/useConfirmStore";

export const ConfirmDialog: React.FC = () => {
  const { isOpen, title, message, confirmText, cancelText, onConfirm, onCancel } = useConfirmStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 space-y-4 text-start transition-theme"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
            </div>
            
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {message}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all cursor-pointer animate-fade-in"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer animate-fade-in"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
