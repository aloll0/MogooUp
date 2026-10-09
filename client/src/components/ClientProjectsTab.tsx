import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Printer, 
  Check, 
  Loader2, 
  Search, 
  PlusCircle, 
  AlertCircle,
  FileText,
  Upload,
  Download,
  Eye,
  Paperclip,
  X
} from "lucide-react";
import { taskflowService } from "../services/taskflowService";
import type { ClientProject, ClientProjectService, ClientProjectDocument } from "../services/taskflowService";
import html2pdf from "html2pdf.js";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../stores/useConfirmStore";
import { useToastStore } from "../stores/useToastStore";

interface ClientProjectsTabProps {
  workspaceId: string;
  currentUserRole: string;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const ClientProjectsTab: React.FC<ClientProjectsTabProps> = ({
  workspaceId,
  currentUserRole,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const printContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<ClientProject[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // New Client Form Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [newClientDocuments, setNewClientDocuments] = useState<ClientProjectDocument[]>([]);
  const [isModalUploadingDoc, setIsModalUploadingDoc] = useState(false);
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
        documents: newClientDocuments,
      });
      setClients([newClient, ...clients]);
      setSelectedClient(newClient);
      setIsAddModalOpen(false);
      setNewClientName("");
      setNewClientDesc("");
      setNewClientNotes("");
      setNewClientDocuments([]);
      useToastStore.getState().addToast(
        isAr ? "تم إنشاء مشروع العميل بنجاح" : "Client project created successfully",
        "success"
      );
    } catch (error) {
      console.error("Failed to create client project:", error);
      useToastStore.getState().addToast(
        isAr ? "حدث خطأ أثناء إنشاء مشروع العميل" : "Failed to create client project",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload document for selected client
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient || !isManager) return;

    if (file.size > 30 * 1024 * 1024) {
      useToastStore.getState().addToast(
        isAr ? "حجم الملف كبير جداً (الحد الأقصى 30 ميجابايت)" : "File size too large (max 30MB)",
        "error"
      );
      e.target.value = "";
      return;
    }

    try {
      setIsUploadingDocument(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const newDoc: ClientProjectDocument = {
            name: file.name,
            url: base64Data,
            size: file.size,
            fileType: file.type || "application/pdf",
            uploadedAt: new Date().toISOString(),
          };

          const currentDocs = selectedClient.documents || [];
          const updatedDocs = [...currentDocs, newDoc];

          const updatedClient = {
            ...selectedClient,
            documents: updatedDocs,
          };

          setSelectedClient(updatedClient);
          setClients(clients.map((c) => (c._id === selectedClient._id ? updatedClient : c)));

          await taskflowService.updateClientProject(workspaceId, selectedClient._id, {
            documents: updatedDocs,
          });

          useToastStore.getState().addToast(
            isAr ? `تم رفع ملف البريف "${file.name}" بنجاح` : `Brief file "${file.name}" uploaded successfully`,
            "success"
          );
        } catch (err) {
          console.error("Failed to upload document:", err);
          useToastStore.getState().addToast(
            isAr ? "حدث خطأ أثناء رفع الملف" : "Failed to upload document",
            "error"
          );
        } finally {
          setIsUploadingDocument(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingDocument(false);
      console.error(err);
    }
  };

  // Delete document
  const handleDeleteDocument = async (docIndex: number) => {
    if (!selectedClient || !isManager) return;
    const docToDelete = (selectedClient.documents || [])[docIndex];
    if (!docToDelete) return;

    const confirmed = await useConfirmStore.getState().show({
      title: isAr ? `حذف ملف البريف "${docToDelete.name}"` : `Delete Document "${docToDelete.name}"`,
      message: isAr
        ? `هل أنت متأكد من حذف هذا الملف نهائياً من مشروع العميل؟`
        : `Are you sure you want to delete this document from the client project?`,
      confirmText: isAr ? "حذف" : "Delete",
      cancelText: isAr ? "إلغاء" : "Cancel",
    });

    if (!confirmed) return;

    const updatedDocs = (selectedClient.documents || []).filter((_, idx) => idx !== docIndex);
    const updatedClient = {
      ...selectedClient,
      documents: updatedDocs,
    };

    setSelectedClient(updatedClient);
    setClients(clients.map((c) => (c._id === selectedClient._id ? updatedClient : c)));

    try {
      await taskflowService.updateClientProject(workspaceId, selectedClient._id, {
        documents: updatedDocs,
      });
      useToastStore.getState().addToast(
        isAr ? "تم حذف الملف بنجاح" : "Document deleted successfully",
        "success"
      );
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  // Download document
  const handleDownloadDocument = (doc: ClientProjectDocument) => {
    const link = document.createElement("a");
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview document in new window
  const handlePreviewDocument = (doc: ClientProjectDocument) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<html><head><title>${doc.name}</title></head><body style="margin:0;background:#1e1e24;"><iframe src="${doc.url}" style="border:none;width:100vw;height:100vh;"></iframe></body></html>`
      );
    } else {
      handleDownloadDocument(doc);
    }
  };

  // Handle document upload inside modal
  const handleModalUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      useToastStore.getState().addToast(
        isAr ? "حجم الملف كبير جداً (الحد الأقصى 30 ميجابايت)" : "File size too large (max 30MB)",
        "error"
      );
      e.target.value = "";
      return;
    }

    setIsModalUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const newDoc: ClientProjectDocument = {
        name: file.name,
        url: base64Data,
        size: file.size,
        fileType: file.type || "application/pdf",
        uploadedAt: new Date().toISOString(),
      };
      setNewClientDocuments((prev) => [...prev, newDoc]);
      setIsModalUploadingDoc(false);
      if (modalFileInputRef.current) modalFileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveModalDocument = (index: number) => {
    setNewClientDocuments((prev) => prev.filter((_, idx) => idx !== index));
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
      note: "",
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

  // Update service note handler
  const handleUpdateServiceNote = async (serviceIndex: number, noteText: string) => {
    if (!selectedClient || !isManager) return;

    const updatedServices = [...selectedClient.services];
    updatedServices[serviceIndex] = {
      ...updatedServices[serviceIndex],
      note: noteText,
    };

    const updatedClient = {
      ...selectedClient,
      services: updatedServices,
    };

    setSelectedClient(updatedClient);
    setClients(clients.map((c) => (c._id === selectedClient._id ? updatedClient : c)));

    try {
      await taskflowService.updateClientProject(workspaceId, selectedClient._id, {
        services: updatedServices,
      });
    } catch (error) {
      console.error("Failed to update service note:", error);
    }
  };

  // Delete service deliverable handler
  const handleDeleteService = async (serviceIndex: number) => {
    if (!selectedClient || !isManager) return;

    const confirmed = await useConfirmStore.getState().show({
      title: isAr ? "حذف الخدمة" : "Delete Service",
      message: isAr 
        ? `هل أنت متأكد من رغبتك في حذف خدمة "${selectedClient.services[serviceIndex].name}"؟`
        : `Are you sure you want to delete the service "${selectedClient.services[serviceIndex].name}"?`,
      confirmText: isAr ? "حذف" : "Delete",
      cancelText: isAr ? "إلغاء" : "Cancel",
    });

    if (!confirmed) return;

    const updatedServices = selectedClient.services.filter((_, idx) => idx !== serviceIndex);

    const updatedClient = {
      ...selectedClient,
      services: updatedServices,
    };

    setSelectedClient(updatedClient);
    setClients(clients.map((c) => (c._id === selectedClient._id ? updatedClient : c)));

    try {
      await taskflowService.updateClientProject(workspaceId, selectedClient._id, {
        services: updatedServices,
      });
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };


  // Delete Client Profile
  const handleDeleteClient = async (clientId: string) => {
    const targetClient = clients.find((c) => c._id === clientId);
    const clientName = targetClient ? targetClient.clientName : "";

    const confirmed = await useConfirmStore.getState().show({
      title: isAr ? "حذف ملف تعريف العميل" : "Delete Client Profile",
      message: isAr 
        ? `هل أنت متأكد من رغبتك في حذف ملف تعريف العميل "${clientName}"؟ ستفقد جميع قوائم المراجعة والخدمات المرتبطة به.`
        : `Are you sure you want to delete the client profile "${clientName}"? All checklists will be lost.`,
      confirmText: isAr ? "حذف" : "Delete",
      cancelText: isAr ? "إلغاء" : "Cancel",
    });

    if (!confirmed) return;

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
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-[#120722]/10 max-h-56 lg:max-h-none shrink-0 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
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
                    <div
                      key={idx}
                      className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-all ${
                        service.isChecked
                          ? "bg-green-500/3 dark:bg-green-500/2 border-green-500/30"
                          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {/* Header containing checkable title and delete button */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Checkable title container */}
                        <div
                          onClick={() => handleToggleService(idx)}
                          className={`flex items-center gap-3 min-w-0 ${
                            !isManager ? "cursor-default" : "cursor-pointer select-none"
                          }`}
                        >
                          <div
                            className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              service.isChecked
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {service.isChecked && <Check className="h-3 w-3 stroke-3" />}
                          </div>
                          <span className={`text-xs font-bold truncate ${service.isChecked ? "text-green-700 dark:text-green-450" : "text-zinc-650 dark:text-zinc-300"}`}>
                            {service.name}
                          </span>
                        </div>

                        {/* Delete Button */}
                        {isManager && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(idx);
                            }}
                            className="p-1 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-md transition-all cursor-pointer shrink-0"
                            title={isAr ? "حذف الخدمة" : "Delete Service"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Note text input */}
                      <div className="mt-1">
                        <input
                          type="text"
                          placeholder={isAr ? "أضف ملاحظة أو تفصيل للخدمة..." : "Add note or service detail..."}
                          value={service.note || ""}
                          disabled={!isManager}
                          onChange={(e) => handleUpdateServiceNote(idx, e.target.value)}
                          className="w-full px-3 py-1.5 text-[11px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200 transition-theme"
                        />
                      </div>
                    </div>
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

              {/* PDF & Brief Documents Section */}
              <div className="space-y-3 pt-3 border-t dark:border-zinc-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>{isAr ? "أوراق ومستندات البريف (PDF & Documents)" : "Brief Documents & PDF Attachments"}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {selectedClient.documents?.length || 0}
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {isAr 
                        ? "ارفع ملفات البريف، المواصفات، أو أي أوراق ومستندات PDF خاصة بالعميل للرجوع إليها في أي وقت."
                        : "Upload client brief files, PDF documents, or contract specifications for easy reference."}
                    </p>
                  </div>

                  {isManager && (
                    <div className="shrink-0">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUploadDocument}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingDocument}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingDocument ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{isAr ? "رفع ملف / بريف PDF" : "Upload Brief PDF"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Uploaded Documents List / Grid */}
                {selectedClient.documents && selectedClient.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedClient.documents.map((doc, idx) => {
                      const isPdf = doc.name.toLowerCase().endsWith(".pdf") || doc.fileType?.includes("pdf");
                      return (
                        <div
                          key={doc._id || idx}
                          className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/40 hover:border-purple-500/30 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg shrink-0 ${isPdf ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-purple-500/10 text-purple-500 border border-purple-500/20"}`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-zinc-850 dark:text-zinc-200 truncate" title={doc.name}>
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                                <span className="font-semibold uppercase">{isPdf ? "PDF" : "DOC"}</span>
                                <span>•</span>
                                <span>{formatFileSize(doc.size)}</span>
                                {doc.uploadedAt && (
                                  <>
                                    <span>•</span>
                                    <span>{new Date(doc.uploadedAt).toLocaleDateString(i18n.language)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePreviewDocument(doc)}
                              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                              title={isAr ? "معاينة الملف" : "Preview"}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(doc)}
                              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                              title={isAr ? "تحميل الملف" : "Download"}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            {isManager && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(idx)}
                                className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                title={isAr ? "حذف الملف" : "Delete"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    onClick={() => isManager && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 text-center space-y-2 transition-all ${
                      isManager ? "hover:border-purple-500/40 hover:bg-purple-500/2 cursor-pointer" : ""
                    }`}
                  >
                    <div className="h-10 w-10 mx-auto rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Paperclip className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {isAr ? "لا توجد أوراق أو ملفات بريف مرفوعة بعد" : "No brief documents uploaded yet"}
                    </p>
                    <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                      {isAr
                        ? "يمكنك رفع ملف البريف الخاص بالمشروع بصيغة PDF أو أي مستند للرجوع لشروط ومخرجات العميل بسهولة."
                        : "Upload project brief PDF or documentation to review deliverables anytime."}
                    </p>
                    {isManager && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline">
                        + {isAr ? "انقر هنا لاختيار ملف ورفعه" : "Click here to choose and upload a file"}
                      </span>
                    )}
                  </div>
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-start max-h-[90vh] overflow-y-auto custom-scrollbar">
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

              {/* Attach Brief Document in Modal */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center justify-between">
                  <span>{isAr ? "أوراق وملف البريف (PDF / مستندات)" : "Brief Documents (PDF / Docs)"}</span>
                  {newClientDocuments.length > 0 && (
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      {newClientDocuments.length} {isAr ? "ملف" : "files"}
                    </span>
                  )}
                </label>
                
                <input
                  type="file"
                  ref={modalFileInputRef}
                  onChange={handleModalUploadDocument}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                  className="hidden"
                />

                <div
                  onClick={() => modalFileInputRef.current?.click()}
                  className="p-3 border border-dashed border-zinc-250 dark:border-zinc-750 hover:border-purple-500 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-center cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {isModalUploadingDoc ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  ) : (
                    <Upload className="h-4 w-4 text-purple-500" />
                  )}
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {isAr ? "انقر لرفع ملف بريف PDF مع العميل" : "Click to attach a brief PDF file"}
                  </span>
                </div>

                {/* List attached documents in modal */}
                {newClientDocuments.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto">
                    {newClientDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">{doc.name}</span>
                          <span className="text-[10px] text-zinc-400 shrink-0">({formatFileSize(doc.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveModalDocument(idx)}
                          className="p-1 hover:bg-red-500/10 text-red-500 rounded-md cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {isAr ? "ملاحظات العمل الأولية" : "Initial Notes"}
                </label>
                <textarea
                  placeholder={isAr ? "اكتب شروط العقد أو مراجع العميل هنا..." : "Type any contract conditions or client references here..."}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full h-20 px-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-zinc-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewClientDocuments([]);
                  }}
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
              minHeight: "280mm",
              display: "flex",
              flexDirection: "column",
              fontFamily: isAr ? "'Cairo', 'Segoe UI', Tahoma, Geneva, sans-serif" : "'Inter', sans-serif",
              direction: isAr ? "rtl" : "ltr",
              textAlign: isAr ? "right" : "left",
              boxSizing: "border-box"
            }}
          >
            {/* PDF Cover Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #7c3aed", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#6d28d9", margin: 0 }}>Arab Pro</h1>
                <p style={{ 
                  fontSize: "11px", 
                  fontWeight: "700", 
                  color: "#6b7280", 
                  textTransform: isAr ? "none" : "uppercase", 
                  letterSpacing: isAr ? "normal" : "0.05em", 
                  marginTop: "4px" 
                }}>
                  {isAr ? "تقرير تسليم المنصة الاحترافي" : "Professional Platform Delivery Report"}
                </p>
              </div>
              <div style={{ textAlign: isAr ? "left" : "right" }}>
                <span style={{ padding: "6px 12px", backgroundColor: "#f3e8ff", color: "#6d28d9", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                  {isAr ? "تم التحقق من عرب برو" : "Arab Pro Verified"}
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
                  <div style={{ textAlign: isAr ? "left" : "right" }}>
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
                      flexDirection: "column",
                      gap: "8px", 
                      padding: "12px", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "10px",
                      backgroundColor: srv.isChecked ? "#f0fdf4" : "#f9fafb" 
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                    {srv.note && (
                      <div style={{ 
                        fontSize: "10.5px", 
                        color: "#4b5563", 
                        paddingTop: "6px", 
                        borderTop: "1px dashed #e5e7eb",
                        fontStyle: "italic",
                        lineHeight: "1.4"
                      }}>
                        {isAr ? `ملاحظة: ${srv.note}` : `Note: ${srv.note}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes / Remarks */}
            {selectedClient.notes && (
              <div style={{ 
                borderLeft: isAr ? "none" : "4px solid #7c3aed", 
                borderRight: isAr ? "4px solid #7c3aed" : "none", 
                backgroundColor: "#faf5ff", 
                borderRadius: isAr ? "8px 0 0 8px" : "0 8px 8px 0", 
                padding: "16px", 
                marginBottom: "30px" 
              }}>
                <h2 style={{ 
                  fontSize: "11px", 
                  fontWeight: "800", 
                  color: "#7c3aed", 
                  textTransform: isAr ? "none" : "uppercase", 
                  letterSpacing: isAr ? "normal" : "0.05em", 
                  margin: "0 0 6px 0" 
                }}>
                  {isAr ? "ملاحظات وتفاصيل العمل" : "Remarks & Project Notes"}
                </h2>
                <p style={{ fontSize: "11.5px", color: "#4b5563", whiteSpace: "pre-wrap", lineHeight: "1.6", margin: 0 }}>{selectedClient.notes}</p>
              </div>
            )}

            {/* Attached Documents in PDF */}
            {selectedClient.documents && selectedClient.documents.length > 0 && (
              <div style={{ marginBottom: "30px" }}>
                <h2 style={{ fontSize: "13px", fontWeight: "800", color: "#374151", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px", marginBottom: "16px" }}>
                  {isAr ? "أوراق ومستندات البريف المرفقة" : "Attached Brief & Reference Documents"}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedClient.documents.map((doc, idx) => (
                    <div key={idx} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                      <span style={{ fontWeight: "700", color: "#1f2937" }}>📄 {doc.name}</span>
                      <span style={{ color: "#6b7280", fontWeight: "600" }}>{formatFileSize(doc.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Signatures Footer */}
            <div style={{ marginTop: "auto", borderTop: "1px solid #e5e7eb", paddingTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ 
                  fontSize: "9px", 
                  fontWeight: "800", 
                  color: "#9ca3af", 
                  textTransform: isAr ? "none" : "uppercase", 
                  letterSpacing: isAr ? "normal" : "0.05em", 
                  margin: 0 
                }}>
                  {isAr ? "مدير Arab Pro" : "Arab Pro Director"}
                </p>
                <div style={{ height: "40px", marginTop: "8px", borderBottom: "1px dashed #d1d5db", width: "160px" }}></div>
                <p style={{ marginTop: "8px", fontSize: "11px", fontWeight: "700", color: "#6b7280", margin: "8px 0 0 0" }}>
                  {isAr ? "توقيع معتمد" : "Authorized Signature"}
                </p>
              </div>
              <div style={{ textAlign: isAr ? "left" : "right" }}>
                <p style={{ 
                  fontSize: "9px", 
                  fontWeight: "800", 
                  color: "#9ca3af", 
                  textTransform: isAr ? "none" : "uppercase", 
                  letterSpacing: isAr ? "normal" : "0.05em", 
                  margin: 0 
                }}>
                  {isAr ? "إقرار العميل" : "Client Acknowledgment"}
                </p>
                <div style={{ 
                  height: "40px", 
                  marginTop: "8px", 
                  borderBottom: "1px dashed #d1d5db", 
                  width: "160px", 
                  marginLeft: isAr ? "0" : "auto",
                  marginRight: isAr ? "auto" : "0"
                }}></div>
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
