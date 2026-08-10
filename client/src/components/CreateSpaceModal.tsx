import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => void;
  isPending: boolean;
}

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) => {
  const { t } = useTranslation();
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState("#aa3bff");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    onSubmit({
      name: newSpaceName,
      description: newSpaceDescription,
      color: newSpaceColor,
    });
    // Reset state
    setNewSpaceName("");
    setNewSpaceDescription("");
    setNewSpaceColor("#aa3bff");
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
          <h2 className="text-lg font-bold">{t('createSpaceModal.title')}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">{t('createSpaceModal.labelName')}</label>
            <input
              type="text"
              placeholder={t('createSpaceModal.placeholderName')}
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">{t('createSpaceModal.labelDesc')}</label>
            <textarea
              placeholder={t('createSpaceModal.placeholderDesc')}
              value={newSpaceDescription}
              onChange={(e) => setNewSpaceDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 h-20 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500 block mb-1">{t('createSpaceModal.labelColor')}</label>
            <div className="flex gap-2">
              {["#aa3bff", "#00f2fe", "#f59e0b", "#10b981", "#ef4444"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewSpaceColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                    newSpaceColor === c ? "border-zinc-950 dark:border-white scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{t('createSpaceModal.btnSubmit')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
