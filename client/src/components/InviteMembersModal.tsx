import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  currentUserRole: string;
  currentUserId?: string;
  onInvite: (email: string, role: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
  isInvitePending: boolean;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserRole,
  currentUserId,
  onInvite,
  onUpdateRole,
  isInvitePending,
}) => {
  const { t } = useTranslation();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member" | "guest">("member");

  if (!isOpen) return null;

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onInvite(inviteEmail, inviteRole);
    setInviteEmail("");
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col transition-theme">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3 shrink-0">
          <h2 className="text-lg font-bold">{t('workspaceMembersModal.title')}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Split Content: Left Invite Form, Right Members list */}
        <div className="flex flex-col md:flex-row gap-6 overflow-hidden flex-1">
          
          {/* Left Side: Invite Form */}
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold text-zinc-650 dark:text-zinc-350 border-b pb-1 dark:border-zinc-800">
              {t('workspaceMembersModal.inviteTab')}
            </h3>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4 text-start">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('inviteModal.labelEmail')}</label>
                <input
                  type="email"
                  placeholder={t('inviteModal.placeholderEmail')}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-55 dark:bg-zinc-950/20 py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-500">{t('inviteModal.labelRole')}</label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full bg-zinc-55 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-855 rounded-xl py-2 px-3 text-sm outline-hidden focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="admin">{t('roles.admin')}</option>
                  <option value="manager">{t('roles.manager')}</option>
                  <option value="member">{t('roles.member')}</option>
                  <option value="guest">{t('roles.guest')}</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={isInvitePending}
                className="w-full bg-purple-600 hover:bg-purple-700 py-2.5 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isInvitePending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('inviteModal.btnSubmit')}</span>
              </button>
            </form>
          </div>

          {/* Divider vertical for larger screens */}
          <div className="hidden md:block w-px bg-zinc-150 dark:bg-zinc-800" />

          {/* Right Side: Members List with role updater */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-zinc-650 dark:text-zinc-350 border-b pb-1 dark:border-zinc-800 shrink-0 mb-3">
              {t('workspaceMembersModal.membersTab')}
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-start">
              {members.map((m: any) => {
                const isOwner = m.role === "owner";
                const isSelf = m.userId?._id === currentUserId;
                const canEditRole = ["owner", "admin"].includes(currentUserRole) && !isOwner && !isSelf;

                return (
                  <div key={m._id} className="flex items-center justify-between p-2 rounded-xl border border-zinc-150 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={m.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                        alt="avatar"
                        className="h-8 w-8 rounded-full bg-zinc-800 border shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">
                          {m.userId?.fullName} {isSelf && <span className="text-[10px] text-purple-500 font-semibold">(You)</span>}
                        </p>
                        <p className="text-[10px] text-zinc-450 truncate">{m.userId?.email}</p>
                      </div>
                    </div>

                    <div className="shrink-0 ms-2">
                      {canEditRole ? (
                        <select
                          value={m.role}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            if (confirm(t('workspaceMembersModal.confirmRoleChange'))) {
                              onUpdateRole(m.userId?._id, newRole);
                            }
                          }}
                          className="bg-white dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-700 rounded-lg py-1 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-purple-500 cursor-pointer text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="admin">{t('roles.admin')}</option>
                          <option value="manager">{t('roles.manager')}</option>
                          <option value="member">{t('roles.member')}</option>
                          <option value="guest">{t('roles.guest')}</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 capitalize">
                          {t(`roles.${m.role}`)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
