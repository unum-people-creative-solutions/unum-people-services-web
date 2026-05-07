"use client";

import { useAuthStore } from "@/store/authStore";
import { User, Shield, Download, Trash2, Mail, Briefcase, Fingerprint } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const { session } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar selectedTenantId={session.tenantId} />

      <main className="p-6 max-w-4xl mx-auto space-y-8 w-full">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações e Privacidade</h1>
          <p className="text-gray-500">Gerencie seus dados e preferências de acordo com a LGPD.</p>
        </div>

        {/* Perfil do Usuário */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-800">Seus Dados Pessoais</h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                <User className="w-3 h-3" /> Nome Completo
              </label>
              <p className="text-gray-900 font-medium">{session.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                <Mail className="w-3 h-3" /> E-mail
              </label>
              <p className="text-gray-900 font-medium">{session.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                <Fingerprint className="w-3 h-3" /> Tenant ID
              </label>
              <p className="text-gray-600 font-mono text-sm">{session.tenantId}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Cargo / Função
              </label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {session.role}
              </span>
            </div>
          </div>
        </div>

        {/* Direitos do Titular */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-800">Gestão de Dados (Direitos LGPD)</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-blue-50 bg-blue-50/30 rounded-lg">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" /> Portabilidade de Dados
                </h3>
                <p className="text-sm text-gray-600">Baixe uma cópia de todos os seus leads e dados vinculados ao seu tenant em formato CSV.</p>
              </div>
              <button 
                className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shrink-0"
                onClick={() => alert("Funcionalidade de exportação em desenvolvimento.")}
              >
                Exportar CSV
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-red-50 bg-red-50/30 rounded-lg">
              <div>
                <h3 className="font-bold text-red-900 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-600" /> Exclusão de Dados
                </h3>
                <p className="text-sm text-gray-600">Solicite a exclusão permanente de sua conta e de todos os dados associados a ela.</p>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shrink-0 shadow-sm"
              >
                Excluir Minha Conta
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Confirmar Exclusão?</h3>
            </div>
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md"
                onClick={() => alert("Solicitação de exclusão enviada ao administrador.")}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
