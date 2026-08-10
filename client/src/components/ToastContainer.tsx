import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useToastStore } from "../stores/useToastStore";

const iconMap = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
  error: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
  info: <Info className="h-5 w-5 text-purple-400 shrink-0" />,
};

const bgMap = {
  success: "border-emerald-500/20 bg-zinc-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
  error: "border-rose-500/20 bg-zinc-900/80 shadow-[0_0_20px_rgba(244,63,94,0.1)]",
  warning: "border-amber-500/20 bg-zinc-900/80 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
  info: "border-purple-500/20 bg-zinc-900/80 shadow-[0_0_20px_rgba(168,85,247,0.1)]",
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 end-6 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto border rounded-xl p-3.5 flex items-start gap-3 backdrop-blur-md transition-all ${bgMap[toast.type]}`}
          >
            {iconMap[toast.type]}
            <div className="flex-1 text-xs font-semibold text-zinc-200 leading-normal select-none">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5 rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
