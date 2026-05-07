"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Menu, X, LogOut, Settings, LayoutGrid, Building, 
  ExternalLink, ChevronDown, Plus, TrendingUp, HelpCircle, 
  RefreshCw
} from "lucide-react";
import { getGoogleAdsAuthUrl } from "@/lib/google-ads";

interface NavbarProps {
  selectedTenantId?: string;
  onRefresh?: () => void;
  onNewLead?: () => void;
  newLeadLabel?: string;
  onNewSale?: () => void;
  newSaleLabel?: string;
  children?: React.ReactNode; 
}

export default function Navbar({ 
  selectedTenantId, 
  onRefresh, 
  onNewLead, 
  newLeadLabel = "Novo Lead Manual",
  onNewSale,
  newSaleLabel = "Registrar Nova Venda",
  children 
}: NavbarProps) {
  const { session, logout } = useAuthStore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const adsUrl = getGoogleAdsAuthUrl(session?.role === "GlobalAdmin" ? "MASTER" : (selectedTenantId || ""));

  return (
    <nav className="bg-white border-b shadow-sm z-50 sticky top-0">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex justify-between h-16 items-center gap-4">
          
          {/* Lado Esquerdo: Logo e Filtros */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link href="/kanban" className="flex-shrink-0">
              <Image 
                src="/images/logo_simbolo.png" 
                alt="Unum People" 
                width={36} 
                height={32} 
                className="object-contain"
              />
            </Link>
            
            {/* Espaço para Filtros/Seletores */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              {children}
            </div>
          </div>

          {/* Lado Direito: Ações e Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            
            {/* Botão de Refresh Rápido */}
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="hidden md:flex p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-all"
                title="Atualizar"
              >
                <RefreshCw size={20} />
              </button>
            )}

            {/* Menu Expansível Principal */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 bg-primary-600 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-black hover:bg-primary-700 transition-all shadow-md group"
              >
                {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Menu Principal</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-20 overflow-hidden py-3 animate-in fade-in zoom-in-95 duration-150 text-gray-900">
                    
                    {/* Seção: Ações de Vendas/Leads */}
                    {(onNewLead || onNewSale) && (
                      <div className="px-4 py-2 space-y-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Plus size={10} /> Operação
                        </div>
                        {onNewLead && (
                          <button onClick={() => { onNewLead(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-primary-700 bg-primary-50/50 hover:bg-primary-100 rounded-xl transition-all">
                            <Plus className="text-primary-600" size={20} /> {newLeadLabel}
                          </button>
                        )}
                        {onNewSale && (
                          <button onClick={() => { onNewSale(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-green-700 bg-green-50/50 hover:bg-green-100 rounded-xl transition-all">
                            <TrendingUp className="text-green-600" size={20} /> {newSaleLabel}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="mx-4 my-2 border-t border-gray-50"></div>

                    {/* Seção: Navegação do Sistema */}
                    <div className="px-4 py-2 space-y-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <LayoutGrid size={10} /> Navegação
                      </div>
                      <Link href="/kanban" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <LayoutGrid size={18} className="text-gray-400" /> CRM Kanban
                      </Link>
                      {session?.role === "GlobalAdmin" && (
                        <Link href="/tenants" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                          <Building size={18} className="text-gray-400" /> Gestão de Inquilinos
                        </Link>
                      )}
                      <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <Settings size={18} className="text-gray-400" /> Configurações e LGPD
                      </Link>
                    </div>

                    <div className="mx-4 my-2 border-t border-gray-50"></div>

                    {/* Seção: Suporte e Integração */}
                    <div className="px-4 py-2 space-y-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <ExternalLink size={10} /> Externo
                      </div>
                      <a href={adsUrl} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <ExternalLink size={18} /> {session?.role === "GlobalAdmin" ? "Conectar MCC Agência" : "Conectar Google Ads"}
                      </a>
                      <a href="http://docs.unumpeople.com.br/crm/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <HelpCircle size={18} className="text-gray-400" /> Central de Ajuda
                      </a>
                    </div>

                    <div className="mx-4 my-2 border-t border-gray-50"></div>

                    {/* Usuário e Sair */}
                    <div className="px-4 py-2">
                      <div className="px-4 py-3 bg-gray-50 rounded-xl mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                            {session?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate">{session?.name}</p>
                            <p className="text-[9px] text-gray-500 uppercase font-bold">{session?.role}</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <LogOut size={18} /> Sair do Sistema
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
