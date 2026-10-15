import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Lock,
  Users,
  Send,
  Plus,
  Search,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  UserPlus,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { chatService } from "../services/chatService";
import type {
  Conversation,
  ChatMessage,
  ChatUser,
} from "../services/chatService";
import { socketService } from "../services/socketService";
import { useToastStore } from "../stores/useToastStore";

export const CommunityTab: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isAr = i18n.language === "ar";
  const { addToast } = useToastStore();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ [convId: string]: string[] }>({});

  // Mobile layout view toggle
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New Group Form
  const [groupTitle, setGroupTitle] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect socket and listen to events
  useEffect(() => {
    if (!user?.id) return;

    socketService.connect();
    socketService.joinUser(user.id);

    const handleNewMessage = (newMsg: ChatMessage) => {
      // Append if message belongs to active conversation
      setActiveConversation((currentActive) => {
        if (currentActive && currentActive._id === newMsg.conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
        }
        return currentActive;
      });

      // Update conversations list last message
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversationId
            ? { ...c, lastMessage: newMsg, updatedAt: new Date().toISOString() }
            : c
        )
      );
    };

    const handleUserTyping = (data: {
      conversationId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      if (data.userId === user.id) return;
      setTypingUsers((prev) => {
        const currentList = prev[data.conversationId] || [];
        if (data.isTyping) {
          if (!currentList.includes(data.userName)) {
            return { ...prev, [data.conversationId]: [...currentList, data.userName] };
          }
        } else {
          return {
            ...prev,
            [data.conversationId]: currentList.filter((name) => name !== data.userName),
          };
        }
        return prev;
      });
    };

    socketService.onNewChatMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.offNewChatMessage(handleNewMessage);
      socketService.offUserTyping(handleUserTyping);
      socketService.leaveUser(user.id);
    };
  }, [user?.id]);

  // Load conversations on mount
  const loadConversations = async (autoSelectFirst = true) => {
    try {
      setIsLoadingConversations(true);
      const list = await chatService.getConversations();
      setConversations(list);

      if (autoSelectFirst && list.length > 0 && !activeConversation) {
        // Prefer General chat or first item
        const general = list.find((c) => c.type === "GENERAL") || list[0];
        selectConversation(general);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      addToast(isAr ? "تعذر تحميل المحادثات" : "Failed to load conversations", "error");
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // When active conversation changes, join room & fetch message history
  const selectConversation = async (conv: Conversation) => {
    if (activeConversation) {
      socketService.leaveConversation(activeConversation._id);
    }

    setActiveConversation(conv);
    setMobileView("chat");
    socketService.joinConversation(conv._id);

    try {
      setIsLoadingMessages(true);
      const res = await chatService.getMessages(conv._id, 1, 50);
      setMessages(res.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Open User directory for DMs or Group creation
  const openUsersModal = async (type: "dm" | "group") => {
    try {
      setIsLoadingUsers(true);
      if (type === "group") {
        setIsGroupModalOpen(true);
      } else {
        setIsDmModalOpen(true);
      }
      const users = await chatService.getChatUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Start direct conversation with selected user
  const handleStartDirectChat = async (targetUser: ChatUser) => {
    try {
      const conv = await chatService.getOrCreateDirectChat(targetUser._id);
      setIsDmModalOpen(false);

      // Check if already in list
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === conv._id);
        if (exists) return prev;
        return [conv, ...prev];
      });

      selectConversation(conv);
    } catch (error: any) {
      addToast(error?.response?.data?.message || "تعذر بدء المحادثة", "error");
    }
  };

  // Create new group chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) {
      addToast(isAr ? "يرجى كتابة اسم المجموعة" : "Group name is required", "error");
      return;
    }

    try {
      setIsCreatingGroup(true);
      const newGroup = await chatService.createGroup({
        title: groupTitle.trim(),
        description: groupDescription.trim(),
        memberIds: selectedMemberIds,
      });

      setConversations((prev) => [newGroup, ...prev]);
      setIsGroupModalOpen(false);
      setGroupTitle("");
      setGroupDescription("");
      setSelectedMemberIds([]);
      selectConversation(newGroup);
      addToast(isAr ? "تم إنشاء المجموعة بنجاح" : "Group created successfully", "success");
    } catch (error: any) {
      addToast(error?.response?.data?.message || "تعذر إنشاء المجموعة", "error");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || !inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText("");

    // Emit stop typing
    if (user?.id) {
      socketService.emitTyping(activeConversation._id, user.id, user.fullName || "User", false);
    }

    try {
      setIsSending(true);
      await chatService.sendMessage(activeConversation._id, content);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      addToast(isAr ? "تعذر إرسال الرسالة" : "Failed to send message", "error");
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!activeConversation || !user?.id) return;

    socketService.emitTyping(activeConversation._id, user.id, user.fullName || "User", true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping(activeConversation._id, user.id, user.fullName || "User", false);
    }, 2000);
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      if (c.title && c.title.toLowerCase().includes(q)) return true;
      if (c.type === "DIRECT") {
        const otherParticipant = c.participants.find((p) => p.user._id !== user?.id);
        if (otherParticipant?.user.fullName.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [conversations, searchQuery, user?.id]);

  const generalConversations = filteredConversations.filter((c) => c.type === "GENERAL");
  const groupConversations = filteredConversations.filter((c) => c.type === "GROUP");
  const directConversations = filteredConversations.filter((c) => c.type === "DIRECT");

  // Get conversation display details
  const getConversationDetails = (conv: Conversation) => {
    if (conv.type === "GENERAL") {
      return {
        title: conv.title || (isAr ? "المحادثة العامة" : "General Chat"),
        subtitle: conv.description || (isAr ? "غرفة مفتوحة لجميع أعضاء الفريق" : "Open to all team members"),
        avatarIcon: <Globe className="w-5 h-5 text-indigo-500" />,
      };
    }
    if (conv.type === "GROUP") {
      return {
        title: conv.title || (isAr ? "مجموعة دردشة" : "Group Chat"),
        subtitle: `${conv.participants?.length || 0} ${isAr ? "أعضاء" : "members"}`,
        avatarIcon: <Users className="w-5 h-5 text-purple-500" />,
      };
    }
    // DIRECT
    const other = conv.participants?.find((p) => p.user?._id !== user?.id);
    return {
      title: other?.user?.fullName || (isAr ? "محادثة خاصة" : "Direct Message"),
      subtitle: other?.user?.email || "",
      avatarIcon: (
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
          {other?.user?.fullName?.[0]?.toUpperCase() || "U"}
        </div>
      ),
    };
  };

  const currentTypingList = activeConversation
    ? typingUsers[activeConversation._id] || []
    : [];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden dark:bg-zinc-900/90 dark:border-zinc-800">
      {/* ────────────────────────────────────────────────────────── */}
      {/* SIDEBAR: Channels & Conversations List                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          mobileView === "list" ? "flex" : "hidden md:flex"
        } w-full md:w-80 lg:w-96 border-e border-zinc-200/80 bg-zinc-50/70 dark:bg-zinc-950/40 dark:border-zinc-800 flex-col shrink-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/70 dark:border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-900 dark:text-white text-base">
                  {isAr ? "مجتمع الدردشة" : "Community & Chat"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isAr ? "التواصل اللحظي مع الفريق" : "Real-time team communication"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => openUsersModal("dm")}
                title={isAr ? "محادثة خاصة جديدة" : "New Direct Message"}
                className="p-2 text-zinc-600 hover:text-indigo-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => openUsersModal("group")}
                title={isAr ? "إنشاء مجموعة جديدة" : "New Group"}
                className="p-2 text-zinc-600 hover:text-indigo-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className={`w-4 h-4 absolute top-2.5 text-zinc-400 ${isAr ? "right-3" : "left-3"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "بحث في المحادثات..." : "Search conversations..."}
              className={`w-full py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-800 dark:text-zinc-200 ${
                isAr ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
            />
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* SECTION 1: General Chat */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3">
                  {isAr ? "المحادثة العامة" : "General"}
                </span>
                <div className="mt-1 space-y-1">
                  {generalConversations.map((conv) => {
                    const isSelected = activeConversation?._id === conv._id;
                    const details = getConversationDetails(conv);
                    return (
                      <button
                        key={conv._id}
                        onClick={() => selectConversation(conv)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
                            : "text-zinc-700 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{details.title}</p>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? "text-indigo-100" : "text-zinc-400"
                            }`}
                          >
                            {conv.lastMessage?.content || details.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Groups */}
              <div>
                <div className="flex items-center justify-between px-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {isAr ? "المجموعات" : "Groups"}
                  </span>
                  <button
                    onClick={() => openUsersModal("group")}
                    className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                  >
                    +{isAr ? "مجموعة" : "New"}
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {groupConversations.length === 0 ? (
                    <p className="text-xs text-zinc-400 px-3 py-2 italic">
                      {isAr ? "لا توجد مجموعات حتى الآن" : "No groups yet"}
                    </p>
                  ) : (
                    groupConversations.map((conv) => {
                      const isSelected = activeConversation?._id === conv._id;
                      const details = getConversationDetails(conv);
                      return (
                        <button
                          key={conv._id}
                          onClick={() => selectConversation(conv)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
                              : "text-zinc-700 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">{details.title}</p>
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected ? "text-indigo-100" : "text-zinc-400"
                              }`}
                            >
                              {conv.lastMessage?.content || details.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECTION 3: Direct Messages */}
              <div>
                <div className="flex items-center justify-between px-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {isAr ? "الرسائل المباشرة" : "Direct Messages"}
                  </span>
                  <button
                    onClick={() => openUsersModal("dm")}
                    className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                  >
                    +{isAr ? "محادثة" : "New"}
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {directConversations.length === 0 ? (
                    <p className="text-xs text-zinc-400 px-3 py-2 italic">
                      {isAr ? "لا توجد رسائل خاصة" : "No direct messages yet"}
                    </p>
                  ) : (
                    directConversations.map((conv) => {
                      const isSelected = activeConversation?._id === conv._id;
                      const details = getConversationDetails(conv);
                      return (
                        <button
                          key={conv._id}
                          onClick={() => selectConversation(conv)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
                              : "text-zinc-700 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center justify-center">
                              {details.title[0]?.toUpperCase()}
                            </div>
                            <span className="absolute bottom-0 end-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">{details.title}</p>
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected ? "text-indigo-100" : "text-zinc-400"
                              }`}
                            >
                              {conv.lastMessage?.content || details.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────── */}
      {/* CHAT AREA: Feed, Messages & Input                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <main
        className={`${
          mobileView === "chat" ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-white dark:bg-zinc-900 min-w-0`}
      >
        {activeConversation ? (
          <>
            {/* Top Bar */}
            <div className="h-16 px-4 md:px-6 border-b border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                {/* Back to list on mobile */}
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </button>

                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  {activeConversation.type === "GENERAL" ? (
                    <Globe className="w-5 h-5" />
                  ) : activeConversation.type === "GROUP" ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm md:text-base text-zinc-900 dark:text-white truncate">
                    {getConversationDetails(activeConversation).title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {activeConversation.type === "GENERAL"
                      ? isAr
                        ? "المجتمع العام للمنصة"
                        : "Global Workspace Channel"
                      : activeConversation.type === "GROUP"
                      ? `${activeConversation.participants?.length || 0} ${isAr ? "أعضاء" : "members"}`
                      : isAr
                      ? "محادثة خاصة مشفرة ولحظية"
                      : "Direct real-time conversation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-zinc-50/20 dark:bg-zinc-950/20">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500 mb-3">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                    {isAr ? "لا توجد رسائل سابقة" : "No messages yet"}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    {isAr
                      ? "كن أول من يبدأ المحادثة وأرسل رسالة ترحيبية لأعضاء الفريق!"
                      : "Start the conversation by sending a warm greeting to your team!"}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === user?.id;
                  const senderName = msg.sender?.fullName || (isMe ? (isAr ? "أنت" : "You") : "User");

                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm ${
                          isMe
                            ? "bg-gradient-to-tr from-indigo-600 to-indigo-500"
                            : "bg-gradient-to-tr from-zinc-600 to-zinc-500"
                        }`}
                      >
                        {senderName[0]?.toUpperCase() || "U"}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                            {senderName}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm break-words ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-br-xs"
                              : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 rounded-bl-xs"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Typing indicator */}
              {currentTypingList.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-indigo-500 italic px-2 animate-pulse">
                  <span>
                    {currentTypingList.join(", ")} {isAr ? "يكتب الآن..." : "is typing..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 border-t border-zinc-200/70 bg-white dark:bg-zinc-900 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 bg-zinc-100/80 dark:bg-zinc-800/70 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={isAr ? "اكتب رسالتك هنا... (اضغط Enter للإرسال)" : "Type your message... (Enter to send)"}
                  className="flex-1 bg-transparent px-3 py-1 text-xs md:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">
              {isAr ? "اختر محادثة للبدء" : "Select a conversation to start"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              {isAr
                ? "يمكنك الدردشة في الغرفة العامة أو التواصل في المجموعات أو على الخاص."
                : "You can chat in the General Room, join teams in Groups, or talk privately in DMs."}
            </p>
          </div>
        )}
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: New Group Creation                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {isAr ? "إنشاء مجموعة دردشة جديدة" : "Create New Group Chat"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsGroupModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {isAr ? "اسم المجموعة" : "Group Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder={isAr ? "مثال: فريق التسويق أو الإدارة" : "e.g. Marketing Team"}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {isAr ? "وصف المجموعة (اختياري)" : "Description (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder={isAr ? "مناقشة أهداف الحملات الإعلانية" : "Discuss campaign objectives"}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Member selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {isAr ? "اختر الأعضاء للمجموعة" : "Select Group Members"}
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700/80 rounded-xl p-2 space-y-1 bg-zinc-50/50 dark:bg-zinc-800/40">
                    {isLoadingUsers ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-3">
                        {isAr ? "لا يوجد مستخدمون متاحون" : "No other users available"}
                      </p>
                    ) : (
                      availableUsers.map((u) => {
                        const isSelected = selectedMemberIds.includes(u._id);
                        return (
                          <button
                            type="button"
                            key={u._id}
                            onClick={() => {
                              setSelectedMemberIds((prev) =>
                                isSelected ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                              );
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-start text-xs transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 font-bold text-[10px] flex items-center justify-center">
                                {u.fullName[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold">{u.fullName}</p>
                                <p className="text-[10px] text-zinc-400">{u.email}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingGroup || !groupTitle.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCreatingGroup && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isAr ? "إنشاء المجموعة" : "Create Group"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: Direct Message Select User Directory                */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {isAr ? "بدء محادثة خاصة" : "Start Direct Message"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDmModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Users List */}
              <div className="max-h-64 overflow-y-auto space-y-1 p-1">
                {isLoadingUsers ? (
                  <div className="flex justify-center p-6">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">
                    {isAr ? "لا يوجد مستخدمون متاحون" : "No users found"}
                  </p>
                ) : (
                  availableUsers.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => handleStartDirectChat(u)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-start text-xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center justify-center">
                          {u.fullName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{u.fullName}</p>
                          <p className="text-[11px] text-zinc-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {isAr ? "محادثة" : "Chat"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
