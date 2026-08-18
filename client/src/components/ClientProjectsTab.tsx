import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Printer, Check, Loader2, Search, PlusCircle, AlertCircle } from "lucide-react";
import { taskflowService } from "../services/taskflowService";
import type { ClientProject, ClientProjectService } from "../services/taskflowService";
import html2pdf from "html2pdf.js";
import { useTranslation } from "react-i18next";

interface ClientProjectsTabProps {
  workspaceId: string;
  currentUserRole: string;
}

export const ClientProjectsTab: React.FC<ClientProjectsTabProps> = ({
  workspaceId,
  currentUserRole,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<ClientProject[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // New Client Form Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Service input state
  const [customServiceName, setCustomServiceName] = useState("");

  const isManager = ["owner", "admin", "manager"].includes(currentUserRole);

  // Fetch clients on mount/workspace change
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await taskflowService.getClientProjects(workspaceId);
      setClients(data);
      if (data.length > 0) {
        setSelectedClient(data[0]);
      } else {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Failed to fetch client projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [workspaceId]);

  // Create Client Project handler
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      setIsSubmitting(true);
      const newClient = await taskflowService.createClientProject(workspaceId, {
        clientName: newClientName.trim(),
        description: newClientDesc.trim(),
        notes: newClientNotes.trim(),
      });
      setClients([newClient, ...clients]);
      setSelectedClient(newClient);
      setIsAddModalOpen(false);
      setNewClientName("");
      setNewClientDesc("");
      setNewClientNotes("");
    } catch (error) {
      console.error("Failed to create client project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle checklist checkbox handler
  const handleToggleService = async (serviceIndex: number) => {
    if (!selectedClient || !isManager) return;

    const updatedServices = [...selectedClient.services];
    updatedServices[serviceIndex] = {
      ...updatedServices[serviceIndex],
      isChecked: !updatedServices[serviceIndex].isChecked,
    };

    const updatedClient = {
      ...selectedClient,
      services: updatedServices,
    };

    // Optimistic update
    setSelectedClient(updatedClient);
    setClients(clients.map((c) => (c._id === selectedClient._id ? updatedClient : c)));

    try {
      await taskflowService.updateClientProject(workspaceId, selectedClient._id, {
        services: updatedServices,
      });
    } catch (error) {
      console.error("Failed to update client services:", error);
    }
  };

  // Add Custom Service handler
  const handleAddCustomService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !customServiceName.trim() || !isManager) return;

    const newService: ClientProjectService = {
      name: customServiceName.trim(),
      isChecked: true, // check automatically on add
    };

    const updatedServices = [...selectedClient.services, newService];
    const updatedClient = {
      ...selectedClient,
      services: updatedServices,
    };

    setSelectedClient(updatedClient);
    setClients(clients.map((c) => (c._id === selectedClient._id ? updatedClient : c)));
    setCustomServiceName("");

    try {
      await taskflowService.updateClientProject(workspaceId, selectedClient._id, {
        services: updatedServices,
      });
    } catch (error) {
      console.error("Failed to add custom service:", error);
    }
  };

  // Update Notes handler
  const handleUpdateNotes = async (notesText: string) => {
    if (!selectedClient || !isManager) return;

    const updatedClient = {
      ...selectedClient,
      notes: notesText,
    };

    setSelectedClient(updatedClient);
    setClients(clients.map((c) => (c._id === selectedClient._id ? updatedClient : c)));

    try {
      await taskflowService.updateClientProject(workspaceId, selectedClient._id, {
        notes: notesText,
      });
    } catch (error) {
      console.error("Failed to update notes:", error);
    }
  };

  // Delete Client Profile
  const handleDeleteClient = async (clientId: string) => {
    const confirmMessage = isAr 
      ? "هل أنت متأكد من رغبتك في حذف ملف تعريف هذا العميل؟ ستفقد جميع قوائم المراجعة والخدمات المرتبطة به."
      : "Are you sure you want to delete this client profile? All checklists will be lost.";
    if (!window.confirm(confirmMessage)) return;

    try {
      await taskflowService.deleteClientProject(workspaceId, clientId);
      const filtered = clients.filter((c) => c._id !== clientId);
      setClients(filtered);
      if (filtered.length > 0) {
        setSelectedClient(filtered[0]);
      } else {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Failed to delete client:", error);
    }
  };

  // Export PDF Report using html2pdf
  const handleExportPDF = () => {
    if (!printContainerRef.current || !selectedClient) return;

    setIsExporting(true);
    const element = printContainerRef.current;

    const opt = {
      margin: 0,
      filename: `service_delivery_report_${selectedClient.clientName.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff"
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        setIsExporting(false);
      })
      .catch((err: any) => {
        console.error("PDF export failure:", err);
        setIsExporting(false);
      });
  };

  // Filter clients by search query
  const filteredClients = clients.filter((c) =>
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-50/50 dark:bg-zinc-950/20 text-start animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#120722]/30 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{isAr ? "مشاريع وخدمات العملاء" : "Client Projects & Services"}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isAr 
              ? "قم بإعداد المتاجر أو العملاء، وإدارة قائمة الخدمات النشطة الخاصة بهم، وإضافة مخرجات مخصصة، وطباعة أوراق ملخص PDF مميزة."
              : "Setup stores or clients, manage their active services checklist, add custom deliverables, and print premium PDF summary sheets."}
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isAr ? "إضافة مشروع عميل" : "Add Client Project"}</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-bold text-zinc-850 dark:text-zinc-200">
            {isAr ? "لم يتم إنشاء مشاريع عملاء بعد" : "No Client Projects Created Yet"}
          </h3>
          <p className="text-xs text-zinc-500 mt-2">
            {isAr 
              ? "يمكن للمديرين إضافة عملاء أو ملفات تعريف المتاجر لإدارة قوائم المراجعة الديناميكية لعقود الخدمات النشطة."
              : "Managers can add clients or store profiles to manage dynamic checklists representing active service contracts."}
          </p>
          {isManager && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 cursor-pointer"
            >
              {isAr ? "إضافة مشروع عميل" : "Add Client Project"}
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* Left panel: Clients list */}
          <div className="w-full lg:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-[#120722]/10 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={isAr ? "البحث عن متجر / عميل..." : "Search store / client..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-250 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredClients.map((client) => {
                const checkedCount = client.services.filter((s) => s.isChecked).length;
                const totalCount = client.services.length;
                const isSelected = selectedClient?._id === client._id;

                return (
                  <button
                    key={client._id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-start p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-purple-600/5 dark:bg-purple-500/5 border-purple-500/40 shadow-xs"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-1">
                        {client.clientName}
                      </span>
                      {isSelected && isManager && (
                        <Trash2
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client._id);
                          }}
                          className="h-3.5 w-3.5 text-red-500 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                        />
                      )}
                    </div>
                    {client.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {client.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 border-t dark:border-zinc-800/50 pt-2">
                      <span>{isAr ? "قائمة الخدمات" : "Services checklist"}</span>
                      <span className={`${checkedCount === totalCount ? "text-green-600 dark:text-green-450" : "text-purple-600 dark:text-purple-400"}`}>
                        {checkedCount}/{totalCount} {isAr ? "مكتمل" : "Completed"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Details & Checklist */}
          {selectedClient ? (
            <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-zinc-900/40 p-6 space-y-6">
              
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-zinc-850 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-zinc-850 dark:text-zinc-200">
                    {selectedClient.clientName}
                  </h3>
                  {selectedClient.description && (
                    <p className="text-xs text-zinc-500 mt-1">{selectedClient.description}</p>
                  )}
                </div>

                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  ) : (
                    <Printer className="h-4 w-4 text-purple-400" />
                  )}
                  <span>{isAr ? "تصدير خدمات العميل PDF" : "Export Service PDF"}</span>
                </button>
              </div>

              {/* Services Checklist Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {isAr ? "الخدمات المقدمة والمخرجات" : "Services Rendered & Deliverables"}
                  </h4>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {!isManager 
                      ? (isAr ? "وضع القراءة فقط" : "Read-Only Mode") 
                      : (isAr ? "حفظ تلقائي فوري" : "Auto-Saves Instantly")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedClient.services.map((service, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleService(idx)}
                      disabled={!isManager}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-start transition-all ${
                        !isManager ? "cursor-default" : "cursor-pointer"
                      } ${
                        service.isChecked
                          ? "bg-green-500/[0.03] dark:bg-green-500/[0.02] border-green-500/30 text-green-700 dark:text-green-450"
                          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-650 dark:text-zinc-300"
                      }`}
                    >
                      <div
                        className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-all ${
                          service.isChecked
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      >
                        {service.isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold">{service.name}</span>
                    </button>
                  ))}
                </div>

                {/* Add Custom Service Input */}
                {isManager && (
                  <form onSubmit={handleAddCustomService} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder={isAr ? "إضافة خدمة مخصصة (مثال: كتابة محتوى، تصميم شعار...)" : "Add custom service (e.g. Content writing, Logo redesign...)"}
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      className="flex-1 px-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200"
                    />
                    <button
                      type="submit"
                      disabled={!customServiceName.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>{isAr ? "إضافة عمل" : "Add Work"}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Remarks Textarea */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {isAr ? "ملاحظات وتفاصيل العمل" : "Additional Notes & Comments"}
                </h4>
                <textarea
                  placeholder={isAr ? "اكتب حالة التسليم أو الملاحظات أو التعليقات المخصصة للعميل هنا..." : "Write delivery status, timeline parameters, or custom feedback remarks for the client..."}
                  value={selectedClient.notes || ""}
                  disabled={!isManager}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  className="w-full h-32 px-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200 resize-y"
                />
                {isManager && (
                  <span className="text-[10px] text-zinc-400 font-semibold block text-right">
                    {isAr ? "تم حفظ المسودة تلقائياً" : "Draft automatically saved"}
                  </span>
                )}
              </div>



            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900/40">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold text-center">
                {isAr 
                  ? "اختر مشروع عميل من القائمة الجانبية لإدارة المهام والمخرجات أو طباعة التقارير."
                  : "Select a client project from the sidebar list to manage active deliverables or export reports."}
              </p>
            </div>
          )}

        </div>
      )}

      {/* --- ADD NEW CLIENT MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-start">
            <h3 className="text-base font-bold text-zinc-850 dark:text-zinc-200 mb-4">
              {isAr ? "إضافة ملف تعريف العميل / المتجر" : "Add Client / Store Profile"}
            </h3>
            
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {isAr ? "اسم العميل أو المتجر *" : "Client / Store Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? "مثال: متجر لوكسيرا، أمازون الإمارات..." : "e.g. Loksira Store, Amazon UAE..."}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {isAr ? "وصف بسيط للمشروع" : "Brief Overview / Description"}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? "مثال: عقد تطوير وتسويق متجر إلكتروني" : "e.g. E-commerce development and marketing contract"}
                  value={newClientDesc}
                  onChange={(e) => setNewClientDesc(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {isAr ? "ملاحظات العمل الأولية" : "Initial Notes"}
                </label>
                <textarea
                  placeholder={isAr ? "اكتب شروط العقد أو مراجع العميل هنا..." : "Type any contract conditions or client references here..."}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full h-24 px-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newClientName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isAr ? "حفظ العميل" : "Save Client"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN CONTAINER EXCLUSIVELY FOR PDF EXPORT PRINTING */}
      {selectedClient && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
          <div 
            ref={printContainerRef}
            id="client-projects-print-content"
            style={{
              padding: "40px",
              color: "#1f2937",
              backgroundColor: "#ffffff",
              width: "210mm",
              minHeight: "297mm",
              display: "flex",
              flexDirection: "column",
              fontFamily: "sans-serif",
              boxSizing: "border-box"
            }}
          >
            {/* PDF Cover Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #7c3aed", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#6d28d9", margin: 0 }}>Arab Pro</h1>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>
                  {isAr ? "تقرير تسليم المنصة الاحترافي" : "Professional Platform Delivery Report"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ padding: "6px 12px", backgroundColor: "#f3e8ff", color: "#6d28d9", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                  {isAr ? "تم التحقق من TaskFlow" : "TaskFlow Verified"}
                </span>
                <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "8px", fontWeight: "600" }}>
                  {isAr ? "تمت الطباعة في: " : "Printed on: "}{new Date().toLocaleDateString(i18n.language)}
                </p>
              </div>
            </div>

            {/* Summary Block */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", backgroundColor: "#f9fafb", marginBottom: "30px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#1f2937", margin: "0 0 12px 0" }}>
                {isAr ? "نظرة عامة على العميل" : "Client Overview"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", display: "block" }}>
                      {isAr ? "اسم العميل / المتجر" : "Client / Store Name"}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#1f2937", marginTop: "2px", display: "block" }}>{selectedClient.clientName}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", display: "block" }}>
                      {isAr ? "حالة التسليم" : "Delivery Status"}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#10b981", marginTop: "2px", display: "block" }}>
                      {isAr ? "عقد نشط" : "Active Contract"}
                    </span>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", display: "block" }}>
                    {isAr ? "وصف المشروع" : "Project Description"}
                  </span>
                  <p style={{ fontSize: "11.5px", color: "#4b5563", margin: "4px 0 0 0", lineHeight: "1.5" }}>
                    {selectedClient.description || (isAr ? "لم يتم تقديم وصف للمشروع." : "No project description provided.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Services List in PDF */}
            <div style={{ marginBottom: "30px" }}>
              <h2 style={{ fontSize: "13px", fontWeight: "800", color: "#374151", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px", marginBottom: "16px" }}>
                {isAr ? "الخدمات المكتملة والمخرجات" : "Completed Services & Deliverables"}
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedClient.services.map((srv, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "12px", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "10px",
                      backgroundColor: srv.isChecked ? "#f0fdf4" : "#f9fafb" 
                    }}
                  >
                    <span style={{ fontSize: "11.5px", fontWeight: "700", color: srv.isChecked ? "#1f2937" : "#9ca3af" }}>
                      {srv.name}
                    </span>
                    <span style={{ 
                      fontSize: "10px", 
                      fontWeight: "800", 
                      padding: "4px 10px", 
                      borderRadius: "6px", 
                      backgroundColor: srv.isChecked ? "#d1fae5" : "#f3f4f6", 
                      color: srv.isChecked ? "#065f46" : "#9ca3af" 
                    }}>
                      {srv.isChecked 
                        ? (isAr ? "✓ مكتمل" : "✓ Completed") 
                        : (isAr ? "غير نشط" : "Not Active")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes / Remarks */}
            {selectedClient.notes && (
              <div style={{ borderLeft: "4px solid #7c3aed", backgroundColor: "#faf5ff", borderRadius: "0 8px 8px 0", padding: "16px", marginBottom: "30px" }}>
                <h2 style={{ fontSize: "11px", fontWeight: "800", color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0" }}>
                  {isAr ? "ملاحظات وتفاصيل العمل" : "Remarks & Project Notes"}
                </h2>
                <p style={{ fontSize: "11.5px", color: "#4b5563", whiteSpace: "pre-wrap", lineHeight: "1.6", margin: 0 }}>{selectedClient.notes}</p>
              </div>
            )}

            {/* PDF Signatures Footer */}
            <div style={{ marginTop: "auto", borderTop: "1px solid #e5e7eb", paddingTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "9px", fontWeight: "800", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                  {isAr ? "مدير Arab Pro" : "Arab Pro Director"}
                </p>
                <div style={{ height: "40px", marginTop: "8px", borderBottom: "1px dashed #d1d5db", width: "160px" }}></div>
                <p style={{ marginTop: "8px", fontSize: "11px", fontWeight: "700", color: "#6b7280", margin: "8px 0 0 0" }}>
                  {isAr ? "توقيع معتمد" : "Authorized Signature"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "9px", fontWeight: "800", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                  {isAr ? "إقرار العميل" : "Client Acknowledgment"}
                </p>
                <div style={{ height: "40px", marginTop: "8px", borderBottom: "1px dashed #d1d5db", width: "160px", marginLeft: "auto" }}></div>
                <p style={{ marginTop: "8px", fontSize: "11px", fontWeight: "700", color: "#6b7280", margin: "8px 0 0 0" }}>
                  {isAr ? "ممثل المتجر" : "Store Representative"}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
