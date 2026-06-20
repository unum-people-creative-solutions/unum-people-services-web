"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Shield, Building, Trash2, Save, ExternalLink, Bell, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { TenantService } from "@/services/api";

export default function TabMyAccount() {
  const { session } = useAuthStore();
  const { isSubscribed, subscribeUser, unsubscribeUser, loading: pushLoading, permission } = usePushNotifications();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Consider mobile if window is narrow, but for modal let's just use CSS media queries
  // or a simple heuristic if needed. For simplicity, omit complex JS mobile detection 
  // since CSS handles most of it.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const dataToExport = {
        timestamp: new Date().toISOString(),
        user: {
          name: session?.name,
          email: session?.email,
          role: session?.role,
        },
        tenant: {
          id: session?.tenantId,
          name: session?.tenantName || "Unum People Central",
        },
        notice: "Este arquivo contém seus dados pessoais e de vínculo corporativo armazenados em nossa plataforma."
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Ocorreu um erro ao exportar seus dados. Tente novamente mais tarde.");
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        {/* Perfil */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <User size={16} /> Informações Pessoais
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <User size={18} className="text-gray-400" />
                <span className="font-bold text-gray-700">{session?.name || "N/A"}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail de Acesso</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
                <Mail size={18} />
                <span className="font-medium">{session?.email || "N/A"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notificações */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <Bell size={16} /> Notificações Push
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex-1 mr-4">
              <p className="font-bold text-gray-700">Notificações no Navegador</p>
              {permission === 'denied' && (
                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">
                  ⚠️ Notificações bloqueadas no seu navegador. Ative-as nas configurações do site.
                </p>
              )}
            </div>
            
            <button
              onClick={() => isSubscribed ? unsubscribeUser() : subscribeUser()}
              disabled={pushLoading || permission === 'denied'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isSubscribed ? 'bg-primary-600' : 'bg-gray-200'
              } ${pushLoading || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSubscribed ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Tenant Info */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <Building size={16} /> Vínculo Profissional
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div>
                <p className="text-[10px] font-black text-primary-400 uppercase">Nome do Negócio / Empresa</p>
                <p className="font-black text-primary-900 text-lg leading-tight">
                  {session?.tenantName || "Não Identificado"}
                </p>
              </div>
              <Building size={32} className="text-support-grey/50" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Shield size={18} className="text-gray-400" />
              <div>
                <span className="text-xs font-bold text-gray-500 block">Nível de Autoridade</span>
                <span className="font-black text-gray-700 uppercase tracking-tighter">{session?.role || "Usuário"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* LGPD e Documentos */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <Shield size={16} /> LGPD & Transparência
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="md:col-span-2 group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-bold text-gray-700">Exportar Meus Dados</p>
                </div>
              </div>
              {isExporting ? (
                <div className="flex items-center gap-2 text-brand-blue font-bold text-xs">
                  Processando...
                </div>
              ) : (
                <Save size={16} className="text-gray-300" />
              )}
            </button>
          </div>
        </section>

        {/* Perigo */}
        <section className="mt-4 pt-6 border-t border-gray-200">
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-red-800 font-black uppercase tracking-tight text-lg">Zona de Perigo</h3>
              <p className="text-red-600 text-xs font-medium">Ao excluir sua conta, você perderá acesso imediato ao sistema.</p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Solicitar Exclusão
            </button>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(""); }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-md w-full shadow-2xl flex flex-col overflow-hidden p-6"
            >
              <h3 className="text-xl font-black text-red-600 mb-2">Confirmar Exclusão?</h3>
              
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                <p className="text-xs text-red-800 font-bold uppercase mb-1">Atenção Crítica</p>
                <ul className="text-[11px] text-red-700 leading-relaxed list-disc list-inside space-y-1 font-medium">
                  <li>Você perderá acesso imediato ao sistema.</li>
                  <li>Esta ação não pode ser desfeita.</li>
                </ul>
              </div>
              
              <input 
                type="text" 
                value={deleteConfirmationText} 
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Digite excluir"
                className="w-full border-2 border-red-100 p-3 rounded-xl outline-none focus:border-red-500 text-center font-bold mb-4 text-gray-900"
              />

              <div className="flex flex-col gap-2">
                <button 
                  className="w-full bg-red-600 text-white p-4 rounded-xl font-bold disabled:opacity-30"
                  disabled={deleteConfirmationText.toLowerCase() !== "excluir" || isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const res = await TenantService.deleteAccount();
                      alert(res.message || "Sua conta foi desativada e a solicitação de exclusão foi registrada.");
                      useAuthStore.getState().logout();
                      window.location.href = "/login";
                    } catch (error) {
                      console.error(error);
                      alert("Ocorreu um erro");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? "Processando..." : "Sim, excluir permanentemente"}
                </button>
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(""); }}
                  disabled={isDeleting}
                  className="w-full bg-gray-50 text-gray-500 p-4 rounded-xl font-bold"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
