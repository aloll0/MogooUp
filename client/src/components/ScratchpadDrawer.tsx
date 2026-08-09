import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Edit3, Loader2, Check } from "lucide-react";
import { useScratchpadStore } from "../stores/useScratchpadStore";

interface ScratchpadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadDrawer: React.FC<ScratchpadDrawerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { content, setContent, fetchScratchpad, isLoading, isSaving } = useScratchpadStore();

  useEffect(() => {
    if (isOpen) {
      fetchScratchpad();
    }
  }, [isOpen, fetchScratchpad]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/45 backdrop-blur-xs animate-fade-in">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 border-s border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Edit3 className="h-5 w-5 text-purple-500" />
            <h3 className="font-bold text-base">{t("scratchpad.scratchpadTitle")}</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status Indicators */}
            {isSaving ? (
              <span className="text-[10px] font-bold text-purple-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("scratchpad.scratchpadSaving")}
              </span>
            ) : content ? (
              <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 animate-pulse">
                <Check className="h-3 w-3" />
                {t("scratchpad.scratchpadSaved")}
              </span>
            ) : null}

            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notes Editor Area */}
        <div className="flex-1 p-5 flex flex-col bg-zinc-50/10 dark:bg-zinc-950/5">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
              <span className="text-xs font-semibold">Loading notes...</span>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("scratchpad.scratchpadPlaceholder")}
              className="flex-1 w-full p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm leading-relaxed text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 resize-none font-sans shadow-inner transition-theme"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 text-center bg-zinc-55/30 dark:bg-zinc-950/20 text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">
          Workspace Scratchpad notes are stored privately per account.
        </div>
      </div>
    </div>
  );
};
