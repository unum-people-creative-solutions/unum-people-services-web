"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Shield, Building, Trash2, Save, X, FileText, ExternalLink, Bell, BellOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function SettingsPage() {
  const { session } = useAuthStore();
  const { isSubscribed, subscribeUser, unsubscribeUser, loading: pushLoading, permission } = usePushNotifications();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        notice: "Este arquivo contém seus dados pessoais e de vínculo corporativo armazenados em nossa plataforma, conforme garantido pela LGPD."
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meus-dados-unum-people-${new Date().toISOString().split('T')[0]}.json`;
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
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <Navbar />

      <main className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <Shield className="text-primary-600" size={28} /> Configurações e LGPD
          </h1>
          <p className="text-gray-500 text-sm font-medium">Gerencie suas informações pessoais, preferências e documentos legais.</p>
        </header>

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
                <p className="text-[10px] text-gray-400 mt-1 italic">* O e-mail não pode ser alterado manualmente.</p>
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
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Receba alertas instantâneos de novos leads e atualizações.
                </p>
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
                <Building size={32} className="text-primary-200" />
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
              <Link 
                href="/terms" 
                className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-primary-100 transition-colors">
                    <FileText size={20} className="text-gray-500 group-hover:text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 group-hover:text-primary-900">Termos de Uso</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Contrato de serviço</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-300 group-hover:text-primary-400" />
              </Link>

              <Link 
                href="/privacy" 
                className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-primary-100 transition-colors">
                    <Shield size={20} className="text-gray-500 group-hover:text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 group-hover:text-primary-900">Privacidade</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Tratamento de dados</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-300 group-hover:text-primary-400" />
              </Link>

              <button 
                onClick={handleExportData}
                disabled={isExporting}
                className="md:col-span-2 group flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-primary-100 transition-colors">
                    <Save size={20} className={`text-gray-500 group-hover:text-primary-600 ${isExporting ? 'animate-bounce' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-700 group-hover:text-primary-900">Exportar Meus Dados</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Download em formato JSON (Portabilidade)</p>
                  </div>
                </div>
                {isExporting ? (
                  <div className="flex items-center gap-2 text-primary-600 font-bold text-xs">
                    Processando...
                  </div>
                ) : (
                  <Save size={16} className="text-gray-300 group-hover:text-primary-400" />
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
                className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Solicitar Exclusão
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
              transition={isMobile ? { type: "spring", damping: 25, stiffness: 300 } : { duration: 0.2 }}
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (isMobile && info.offset.y > 150) {
                  setShowDeleteModal(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[32px] md:rounded-xl max-w-md w-full shadow-2xl max-h-[95vh] flex flex-col overflow-hidden"
            >
              <div className="shrink-0 px-6 pt-6">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Confirmar Exclusão?</h3>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-6 pb-6 custom-scrollbar">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Esta ação é irreversível. Seus dados de acesso serão removidos e você perderá o vínculo com seu tenant. Se você for o único administrador, os dados do tenant também poderão ser afetados.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-md"
                    onClick={() => alert("Solicitação de exclusão enviada ao administrador.")}
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
