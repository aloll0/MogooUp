import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, X, Check, Trash2, Plus, Building } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WorkspaceDropdownProps {
  workspaces: any[];
  activeWorkspace: any;
  user: any;
  onSelect: (workspace: any) => void;
  onOpenCreateModal: () => void;
  onDeleteWorkspace: (workspaceId: string, name: string, e: React.MouseEvent) => void;
}

export const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  workspaces,
  activeWorkspace,
  user,
  onSelect,
  onOpenCreateModal,
  onDeleteWorkspace,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    const q = searchQuery.toLowerCase().trim();
    return workspaces.filter((ws) => ws.name?.toLowerCase().includes(q));
  }, [workspaces, searchQuery]);

  const canDelete = (ws: any) => {
    if (user?.isSystemAdmin) return true;
    const ownerId = ws.ownerId?._id || ws.ownerId?.id || ws.ownerId;
    const currentUserId = user?.id || (user as any)?._id;
    return Boolean(ownerId && currentUserId && ownerId.toString() === currentUserId.toString());
  };

  const getInitials = (name: string) => {
    if (!name) return "W";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div ref={dropdownRef} className="relative w-full z-30">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#0e071c] dark:hover:bg-[#160a2b] border border-zinc-200/90 dark:border-[#261540] hover:border-[#843ec0]/50 dark:hover:border-[#b57ede]/50 rounded-xl py-2 px-2.5 flex items-center justify-between transition-all group shadow-xs cursor-pointer text-start"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-7 w-7 rounded-lg bg-linear-to-tr from-[#843ec0] to-[#b57ede] text-white flex items-center justify-center font-bold text-[11px] shadow-xs shrink-0 select-none">
            {activeWorkspace ? getInitials(activeWorkspace.name) : <Building className="h-3.5 w-3.5" />}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {activeWorkspace?.name || (isAr ? "اختر شركة" : "Select Company")}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
              {workspaces.length} {isAr ? "شركات مسجلة" : "companies"}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0 ms-1 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#843ec0] dark:text-[#b57ede]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full inset-s-0 inset-e-0 mt-2 z-50 bg-white dark:bg-[#120824] border border-zinc-200 dark:border-[#2d184d] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 backdrop-blur-xl"
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute inset-s-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "بحث عن شركة..." : "Search companies..."}
                className="w-full bg-zinc-100 dark:bg-[#1b0d36] border border-zinc-200 dark:border-[#351b58] rounded-lg py-1.5 ps-8 pe-7 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:border-[#b57ede] dark:focus:border-[#b57ede] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-e-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  title={isAr ? "مسح البحث" : "Clear search"}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Workspaces List */}
            <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar pe-1">
              {filteredWorkspaces.length === 0 ? (
                <div className="py-5 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-1.5">
                  <Building className="h-5 w-5 text-zinc-400/40" />
                  <span>{isAr ? "لا توجد نتائج مطابقة للبحث" : "No companies found"}</span>
                </div>
              ) : (
                filteredWorkspaces.map((ws) => {
                  const isSelected = activeWorkspace?._id === ws._id;
                  const userCanDelete = canDelete(ws);

                  return (
                    <div
                      key={ws._id}
                      onClick={() => {
                        onSelect(ws);
                        setIsOpen(false);
                      }}
                      className={`group/item flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#843ec0]/15 dark:bg-[#b57ede]/15 text-[#843ec0] dark:text-white font-bold"
                          : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 select-none uppercase ${
                            isSelected
                              ? "bg-linear-to-tr from-[#843ec0] to-[#b57ede] text-white shadow-xs"
                              : "bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300"
                          }`}
                        >
                          {getInitials(ws.name)}
                        </div>
                        <span className="text-xs truncate flex-1 text-start">
                          {ws.name}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#843ec0] dark:text-[#b57ede] shrink-0" />
                        )}
                      </div>

                      {userCanDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWorkspace(ws._id, ws.name, e);
                          }}
                          title={isAr ? `حذف شركة "${ws.name}"` : `Delete company "${ws.name}"`}
                          className="opacity-0 group-hover/item:opacity-100 p-1 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-md transition-all cursor-pointer shrink-0 ms-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: Create Workspace */}
            <div className="border-t border-zinc-200 dark:border-[#22103d] pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateModal();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#843ec0] dark:text-[#b57ede] hover:bg-[#843ec0]/10 dark:hover:bg-[#b57ede]/10 rounded-lg font-bold transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('sidebar.createWorkspace', { defaultValue: "Create Workspace" })}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
