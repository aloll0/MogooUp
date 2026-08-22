import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { taskflowService } from "../services/taskflowService";
import { 
  Users, 
  CheckCircle, 
  Loader2, 
  Shield, 
  Search,
  Building,
  RefreshCw,
  Clock,
  Layers,
  Briefcase,
  Activity,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useToastStore } from "../stores/useToastStore";

interface AdminPanelProps {
  activeSubTab?: "dashboard" | "companies" | "users" | "deleted" | "audit";
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ activeSubTab }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const activeTab = activeSubTab || "dashboard";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Queries
  const { data: stats = { totalCompanies: 0, totalEmployees: 0, activeTasks: 0, completedToday: 0, delayedTasks: 0 } } = useQuery({
    queryKey: ["adminGlobalStats"],
    queryFn: taskflowService.getAdminStats,
    enabled: activeTab === "dashboard",
  });

  const { data: performance = [], isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["adminPerformance"],
    queryFn: taskflowService.getAdminPerformance,
    enabled: activeTab === "dashboard",
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: taskflowService.getAdminUsers,
    enabled: activeTab === "users",
  });

  const { data: deletedTasks = [], isLoading: isLoadingDeleted } = useQuery({
    queryKey: ["adminDeletedTasks"],
    queryFn: taskflowService.getAdminDeletedTasks,
    enabled: activeTab === "deleted",
  });

  const { data: globalActivities = [], isLoading: isLoadingAudit } = useQuery({
    queryKey: ["adminGlobalActivities"],
    queryFn: taskflowService.getGlobalActivities,
    enabled: activeTab === "audit",
  });

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["adminCompanies"],
    queryFn: taskflowService.getAdminCompanies,
    enabled: activeTab === "companies" || activeTab === "dashboard",
  });

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: taskflowService.approveUser,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      useToastStore.getState().addToast(
        isAr ? `تمت الموافقة على الموظف ${updatedUser.fullName || ''} بنجاح` : `Approved ${updatedUser.fullName || 'user'} successfully`, 
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to approve user", "error");
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: taskflowService.suspendUser,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      useToastStore.getState().addToast(
        isAr ? `تم تعليق حساب الموظف ${updatedUser.fullName || ''} بنجاح` : `Suspended ${updatedUser.fullName || 'user'} successfully`, 
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to suspend user", "error");
    }
  });

  const restoreTaskMutation = useMutation({
    mutationFn: taskflowService.restoreDeletedTask,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["adminDeletedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalStats"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceTasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      useToastStore.getState().addToast(
        isAr ? `تم استعادة المهمة "${task.title}" بنجاح` : `Restored task "${task.title}" successfully`, 
        "success"
      );
    },
    onError: (err: any) => {
      useToastStore.getState().addToast(err?.response?.data?.error?.message || "Failed to restore task", "error");
    }
  });

  // Filters
  const filteredUsers = users.filter((u: any) => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.owner?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeleted = deletedTasks.filter((t: any) => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.deletedBy?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompanyObj = companies.find((c: any) => c._id === selectedCompanyId);

  return (
    <div className="p-6 space-y-6 text-start">
      
      {/* 1. Header Section */}
      <div className="border-b dark:border-zinc-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Shield className="h-5.5 w-5.5 text-purple-600 dark:text-purple-400" />
            <span>{isAr ? "لوحة تحكم المشرف العام" : "Super Admin Dashboard & Console"}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
            {isAr 
              ? "مراقبة مؤشرات الشركات المتعددة، مراجعة أداء الموظفين، فحص سجل التدقيق، واستعادة المهام المحذوفة."
              : "Monitor multi-company metrics, verify workspace performance sheets, inspect audit histories, and restore deleted records."}
          </p>
        </div>
        
        {/* Tab switchers */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs select-none font-bold border dark:border-zinc-800 shrink-0">
          <button
            onClick={() => { navigate("/admin?sub=dashboard"); setSelectedCompanyId(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "dashboard" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "تحليلات عامة" : "Analytics Overview"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=companies"); setSelectedCompanyId(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "companies" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "تفاصيل الشركات" : "Companies Drill-down"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=users"); setSelectedCompanyId(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "users" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "موافقات التسجيل" : "Approvals"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=deleted"); setSelectedCompanyId(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "deleted" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "سلة المحذوفات" : "Deleted Items"}
          </button>
          <button
            onClick={() => { navigate("/admin?sub=audit"); setSelectedCompanyId(null); setSearchQuery(""); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "audit" ? "bg-purple-600 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isAr ? "سجل النظام" : "System Audit"}
          </button>
        </div>
      </div>

      {/* SEARCH / FILTERS OVERLAY FOR SUBLISTS */}
      {activeTab !== "dashboard" && !selectedCompanyId && (
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder={
              activeTab === "companies" ? (isAr ? "البحث عن الشركات والملاك..." : "Search companies / owners...") :
              activeTab === "users" ? (isAr ? "البحث عن مستخدمي المنصة..." : "Search platform users...") :
              activeTab === "deleted" ? (isAr ? "البحث عن المهام المحذوفة..." : "Search deleted tasks...") : (isAr ? "البحث في السجلات التاريخية..." : "Search log history...")
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
        </div>
      )}

      {/* 2. MAIN PANELS */}

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "إجمالي الشركات" : "Total Companies"}
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white block mt-0.5 tracking-tight">{stats.totalCompanies}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-650 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "الموظفين النشطين" : "Active Employees"}
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white block mt-0.5 tracking-tight">{stats.totalEmployees}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "المهام النشطة" : "Active Tasks"}
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white block mt-0.5 tracking-tight">{stats.activeTasks}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "إنجازات اليوم" : "Completed Today"}
                </span>
                <span className="text-xl font-black text-green-600 dark:text-green-400 block mt-0.5 tracking-tight">{stats.completedToday}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                  {isAr ? "المهام المتأخرة" : "Delayed Tasks"}
                </span>
                <span className="text-xl font-black text-amber-500 block mt-0.5 tracking-tight">{stats.delayedTasks}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Tasks completed per employee */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col min-h-[300px] shadow-xs">
              <h3 className="text-xs font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{isAr ? "مخرجات مهام الموظفين" : "Employee Tasks Output"}</span>
              </h3>
              
              {isLoadingPerformance ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : performance.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">{isAr ? "لا توجد سجلات أداء." : "No performance records."}</div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {performance.map((p: any) => {
                    const total = p.assignedTasks || 1;
                    const compPercent = Math.min(Math.round((p.completed / total) * 100), 100);
                    
                    return (
                      <div key={p.userId} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">{p.fullName}</span>
                          <span className="font-semibold text-zinc-450">
                            {isAr 
                              ? `مكتمل ${p.completed} / إجمالي ${p.assignedTasks}`
                              : `${p.completed} Completed / ${p.assignedTasks} Total`}
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${compPercent}%` }}
                            title="Completed"
                          />
                          <div 
                            className="h-full bg-amber-500"
                            style={{ width: `${Math.min(Math.round((p.delayed / total) * 100), 100)}%` }}
                            title="Delayed"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 2: Average Completion Time per Employee */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col min-h-[300px] shadow-xs">
              <h3 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>{isAr ? "متوسط وقت الإنجاز (ساعات)" : "Average Completion Time (Hours)"}</span>
              </h3>

              {isLoadingPerformance ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {performance.map((p: any) => {
                    const maxHours = Math.max(...performance.map((u: any) => u.avgCompletionHours), 5);
                    const widthPercent = Math.min((p.avgCompletionHours / maxHours) * 100, 100);

                    return (
                      <div key={p.userId} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-zinc-800 dark:text-zinc-200">{p.fullName}</span>
                          <span className="text-purple-600 dark:text-purple-400">{p.avgCompletionHours}h</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 3: Companies Tasks breakdown */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col min-h-[300px] shadow-xs">
              <h3 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2">
                <Building className="h-4 w-4 text-blue-500" />
                <span>{isAr ? "المهام حسب مساحة العمل / الشركة" : "Tasks by Company / Workspace"}</span>
              </h3>

              {isLoadingCompanies ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-650" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {companies.map((c: any) => {
                    const maxTasks = Math.max(...companies.map((x: any) => x.stats?.totalTasks), 1);
                    const percent = Math.min(((c.stats?.totalTasks || 0) / maxTasks) * 100, 100);

                    return (
                      <div key={c._id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">{c.name}</span>
                          <span className="font-semibold text-zinc-450">
                            {isAr ? `${c.stats?.totalTasks || 0} مهمة` : `${c.stats?.totalTasks || 0} Tasks`}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {activeTab === "companies" && (
        <div>
          {!selectedCompanyId ? (
            /* Multi-Company Listing Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingCompanies ? (
                <div className="col-span-3 flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-zinc-500 text-xs">{isAr ? "لا توجد مساحات عمل تطابق البحث." : "No workspaces match your query."}</div>
              ) : (
                filteredCompanies.map((ws: any) => (
                  <div 
                    key={ws._id} 
                    onClick={() => setSelectedCompanyId(ws._id)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3 mb-4 gap-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">{ws.name}</h3>
                          <p className="text-[10px] text-zinc-450 font-mono mt-0.5">slug: {ws.slug}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 max-w-[120px] truncate">
                          {isAr ? "المالك: " : "Owner: "} {ws.owner?.fullName || (isAr ? "غير محدد" : "Unowned")}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-xl border dark:border-zinc-800">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">{isAr ? "المتاجر" : "Clients"}</span>
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{ws.clients?.length || 0}</span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-xl border dark:border-zinc-800">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">{isAr ? "المهام" : "Tasks"}</span>
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{ws.stats?.totalTasks || 0}</span>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-850 p-2 rounded-xl border dark:border-zinc-800">
                          <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wide block">{isAr ? "المتأخرة" : "Delayed"}</span>
                          <span className="text-sm font-black text-amber-500">{ws.stats?.delayedTasks || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t dark:border-zinc-800 pt-3">
                      <span>{isAr ? "تاريخ التسجيل: " : "Registered: "} {new Date(ws.createdAt).toLocaleDateString()}</span>
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Single Workspace inspection Drill-down Panel */
            selectedCompanyObj && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
                
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedCompanyId(null)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">{selectedCompanyObj.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{isAr ? "شاشة فحص وتدقيق الشركة" : "Workspace Inspection Sheet"}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-lg">
                    {isAr ? "المالك: " : "Owner: "} {selectedCompanyObj.owner?.fullName || (isAr ? "غير معروف" : "Unowned")} ({selectedCompanyObj.owner?.email})
                  </span>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Client Projects List */}
                  <div className="md:col-span-1 border-r dark:border-zinc-800 pr-0 md:pr-6 space-y-4">
                    <h4 className="text-xs font-black uppercase text-zinc-455 dark:text-zinc-500 tracking-wider flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{isAr ? `ملفات متاجر العملاء (${selectedCompanyObj.clients?.length || 0})` : `Client Store Profiles (${selectedCompanyObj.clients?.length || 0})`}</span>
                    </h4>
                    
                    {selectedCompanyObj.clients?.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">{isAr ? "لا توجد متاجر مضافة." : "No stores configured."}</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedCompanyObj.clients.map((cli: any) => (
                          <div key={cli._id} className="p-3.5 bg-zinc-50 dark:bg-zinc-850/30 border dark:border-zinc-800 rounded-xl space-y-2">
                            <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 block">{cli.clientName}</span>
                            {cli.description && <p className="text-[11px] text-zinc-500 dark:text-zinc-450">{cli.description}</p>}
                            <div className="text-[10px] text-zinc-400 font-bold border-t dark:border-zinc-800 pt-2 flex justify-between">
                              <span>{isAr ? "الخدمات:" : "Services:"}</span>
                              <span className="text-purple-600">
                                {isAr 
                                  ? `${cli.services?.filter((s: any) => s.isChecked).length || 0} نشط` 
                                  : `${cli.services?.filter((s: any) => s.isChecked).length || 0} active`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Departments & Team members */}
                  <div className="md:col-span-1 border-r dark:border-zinc-800 pr-0 md:pr-6 space-y-4">
                    <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{isAr ? `الأقسام وفريق العمل (${selectedCompanyObj.members?.length || 0})` : `Spaces & Workspace Team (${selectedCompanyObj.members?.length || 0})`}</span>
                    </h4>

                    {/* Spaces allowed */}
                    <div className="space-y-2 mb-4">
                      <label className="text-[10px] font-bold uppercase text-zinc-400">{isAr ? "أقسام مساحة العمل" : "Department Spaces"}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCompanyObj.spaces?.map((sp: any) => (
                          <span key={sp._id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sp.color || "#7c3aed" }} />
                            {sp.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Members */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400">{isAr ? "أعضاء الفريق النشطين" : "Active Collaborators"}</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {selectedCompanyObj.members?.map((m: any) => (
                          <div key={m._id} className="flex items-center gap-2.5 p-2 bg-zinc-50/50 dark:bg-zinc-850/20 rounded-xl border dark:border-zinc-800/80">
                            <img
                              src={m.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                              alt="Avatar"
                              className="h-7 w-7 rounded-full bg-zinc-800 border"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-zinc-800 dark:text-zinc-150 block truncate">{m.userId?.fullName}</span>
                              <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">{m.role} • {m.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Work timing statistics */}
                  <div className="md:col-span-1 space-y-4">
                    <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{isAr ? "ملخص أوقات العمل" : "Timing Summary Sheets"}</span>
                    </h4>

                    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-850/20 p-4 border dark:border-zinc-800 rounded-xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{isAr ? "المهام النشطة المسجلة" : "Active Tasks Logged"}</span>
                        <span className="font-black text-zinc-800 dark:text-zinc-200">{selectedCompanyObj.stats?.totalTasks} {isAr ? "مهمة" : "Tasks"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{isAr ? "المهام المتراكمة قيد العمل" : "Uncompleted backlog"}</span>
                        <span className="font-black text-indigo-500">{selectedCompanyObj.stats?.activeTasks} {isAr ? "معلقة" : "Pending"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{isAr ? "المهام المتجاوزة للمدة" : "Overdue timelines"}</span>
                        <span className="font-black text-amber-500">{selectedCompanyObj.stats?.delayedTasks} {isAr ? "متأخرة" : "Overdue"}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">{isAr ? "لم يتم العثور على موظفين." : "No users found."}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold">
                    <th className="p-4">{isAr ? "الموظف" : "User"}</th>
                    <th className="p-4">{isAr ? "الحالة" : "Status"}</th>
                    <th className="p-4">{isAr ? "التحقق" : "Verification"}</th>
                    <th className="p-4">{isAr ? "تاريخ التسجيل" : "Registered On"}</th>
                    <th className="p-4 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                  {filteredUsers.map((u: any) => (
                    <tr key={u._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/15">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt={u.fullName}
                            className="h-8 w-8 rounded-full border bg-zinc-800"
                          />
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{u.fullName}</p>
                            <p className="text-[10px] text-zinc-455">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200/20">
                            <CheckCircle className="h-3 w-3" />
                            {isAr ? "معتمد" : "Approved"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {isAr ? "بانتظار الموافقة" : "Pending Approval"}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.isVerified ? (
                          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">{isAr ? "متحقق" : "Verified"}</span>
                        ) : (
                          <span className="text-zinc-400">{isAr ? "غير متحقق" : "Unverified"}</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {u.isSystemAdmin ? (
                          <span className="text-[10px] font-bold text-purple-650 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            {isAr ? "مدير النظام" : "Super Admin"}
                          </span>
                        ) : u.isApproved ? (
                          <button
                            onClick={() => suspendUserMutation.mutate(u._id)}
                            disabled={suspendUserMutation.isPending}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200/50 hover:bg-red-500 hover:text-white text-red-500 font-bold transition-all text-[11px] cursor-pointer"
                          >
                            {isAr ? "تعليق الحساب" : "Suspend Access"}
                          </button>
                        ) : (
                          <button
                            onClick={() => approveUserMutation.mutate(u._id)}
                            disabled={approveUserMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-all text-[11px] shadow-sm cursor-pointer"
                          >
                            {isAr ? "تأكيد وتفعيل" : "Approve Account"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "deleted" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          {isLoadingDeleted ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
            </div>
          ) : filteredDeleted.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">{isAr ? "سلة المحذوفات فارغة." : "No soft-deleted tasks found."}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold">
                    <th className="p-4">{isAr ? "اسم المهمة" : "Task Name"}</th>
                    <th className="p-4">{isAr ? "مشروع العميل" : "Client Project"}</th>
                    <th className="p-4">{isAr ? "مساحة العمل" : "Workspace"}</th>
                    <th className="p-4">{isAr ? "حذف بواسطة" : "Deleted By"}</th>
                    <th className="p-4">{isAr ? "تاريخ الحذف" : "Deleted At"}</th>
                    <th className="p-4 text-right">{isAr ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-700 dark:text-zinc-300">
                  {filteredDeleted.map((task: any) => (
                    <tr key={task._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/15">
                      <td className="p-4 font-bold text-zinc-900 dark:text-white">{task.title}</td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400">{task.clientProjectId?.clientName || task.projectName || "-"}</td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400 font-mono">slug: {task.workspaceId?.slug || "-"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={task.deletedBy?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                            alt="deletedBy avatar"
                            className="h-5 w-5 rounded-full border bg-zinc-850 shrink-0"
                          />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{task.deletedBy?.fullName || (isAr ? "النظام" : "System")}</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400 font-medium">
                        {task.deletedAt ? new Date(task.deletedAt).toLocaleString() : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => restoreTaskMutation.mutate(task._id)}
                          disabled={restoreTaskMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3 shrink-0" />
                          <span>{isAr ? "استعادة المهمة" : "Restore Task"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="border-b dark:border-zinc-800 p-4 flex items-center justify-between gap-4">
            <h3 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span>{isAr ? "سجل العمليات والتدقيق في الوقت الفعلي" : "Real-time System Audit Stream"}</span>
            </h3>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-450 bg-zinc-50 dark:bg-zinc-850 px-2.5 py-0.5 rounded-md border dark:border-zinc-800">
              {isAr ? "سجلات غير قابلة للتعديل" : "Immutable Records"}
            </span>
          </div>

          {isLoadingAudit ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
            </div>
          ) : globalActivities.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">{isAr ? "سجل التدقيق فارغ." : "No audit logs logged in the platform."}</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-850 max-h-[500px] overflow-y-auto custom-scrollbar">
              {globalActivities.map((act: any) => {
                const dateStr = new Date(act.createdAt).toLocaleDateString();
                const timeStr = new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                let detailsStr = "";
                if (act.details?.title) {
                  detailsStr = isAr ? `مهمة: "${act.details.title}"` : `Task: "${act.details.title}"`;
                }

                const changes = act.details?.changes || {};
                const changeKeys = Object.keys(changes);
                
                return (
                  <div key={act._id} className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/15 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={act.userId?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                        alt="actor avatar"
                        className="h-7 w-7 rounded-full bg-zinc-850 border shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 space-y-1">
                        <p className="text-zinc-800 dark:text-zinc-200">
                          <strong className="font-bold text-zinc-900 dark:text-white mr-1.5">{act.userId?.fullName || (isAr ? "مدير النظام" : "System Actor")}</strong>
                          <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-semibold text-[10px] capitalize mr-2">
                            {act.action}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                            {act.entityType} ({detailsStr})
                          </span>
                        </p>
                        
                        {/* Change differences list */}
                        {changeKeys.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 dark:border-zinc-800 space-y-1">
                            {changeKeys.map((key) => {
                              const item = changes[key];
                              return (
                                <p key={key} className="text-[10.5px] text-zinc-500 leading-relaxed font-mono">
                                  • <span className="font-bold capitalize">{key}</span> {isAr ? "تغير من:" : "changed from:"} <span className="text-red-500 line-through">"{item.old || "-"}"</span> {isAr ? "إلى:" : "to:"} <span className="text-green-500 font-bold">"{item.new}"</span>
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-zinc-400 font-semibold shrink-0">
                      <p>{dateStr}</p>
                      <p className="mt-0.5">{timeStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
