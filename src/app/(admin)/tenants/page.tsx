"use client";

import { useEffect, useState } from "react";
import { TenantService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Plus, X, Building, Mail, Briefcase, Hash } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ 
    nome_negocio: "", 
    email_contato: "", 
    nicho: "PSICOLOGIA",
    google_ads_customer_id: "",
    use_mcc_auth: true 
  });
  
  const { session, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (session?.role !== "GlobalAdmin") {
      router.push("/kanban");
      return;
    }
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await TenantService.list();
      setTenants(data);
    } catch (err) {
      console.error("Erro ao carregar tenants", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await TenantService.create(newTenant);
      setIsModalOpen(false);
      setNewTenant({ nome_negocio: "", email_contato: "", nicho: "PSICOLOGIA", google_ads_customer_id: "", use_mcc_auth: true });
      loadTenants();
    } catch (err) {
      alert("Falha ao criar inquilino");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando painel administrativo...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-primary-700 flex items-center gap-2">
          <Building size={24} /> Admin Global - Inquilinos
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} /> Novo Cliente
          </button>
          <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-gray-500 hover:text-red-500 border-l pl-4 font-medium transition-colors">Sair</button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negócio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato / Ads ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nicho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{t.nome_negocio}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{t.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{t.email_contato}</div>
                    <div className="text-xs font-bold text-primary-600">{t.google_ads_customer_id || "Não configurado"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.use_mcc_auth ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                      {t.use_mcc_auth ? 'MCC GESTOR' : 'OAuth DIRETO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{t.nicho}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Novo Inquilino */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-bold">Cadastrar Novo Inquilino</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Building size={14}/> Nome do Negócio</label>
                <input type="text" required value={newTenant.nome_negocio}
                  onChange={(e) => setNewTenant({...newTenant, nome_negocio: e.target.value})}
                  className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Mail size={14}/> E-mail do Administrador</label>
                <input type="email" required value={newTenant.email_contato}
                  onChange={(e) => setNewTenant({...newTenant, email_contato: e.target.value})}
                  className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Hash size={14}/> ID Google Ads (123-456-7890)</label>
                <input type="text" required value={newTenant.google_ads_customer_id}
                  onChange={(e) => setNewTenant({...newTenant, google_ads_customer_id: e.target.value})}
                  className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder="000-000-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Briefcase size={14}/> Nicho de Atuação</label>
                <select value={newTenant.nicho}
                  onChange={(e) => setNewTenant({...newTenant, nicho: e.target.value})}
                  className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="PSICOLOGIA">Psicologia</option>
                  <option value="DIREITO">Direito / Advogados</option>
                  <option value="ESTETICA">Estética / Saúde</option>
                </select>
              </div>
              <div className="flex items-center gap-2 py-2 bg-primary-50 p-2 rounded-md">
                <input type="checkbox" id="mcc" checked={newTenant.use_mcc_auth}
                  onChange={(e) => setNewTenant({...newTenant, use_mcc_auth: e.target.checked})} 
                  className="w-4 h-4 text-primary-600 rounded" />
                <label htmlFor="mcc" className="text-xs text-primary-900 font-bold cursor-pointer">Usar minha MCC (Gestor de Tráfego)</label>
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 pt-3 transition-colors shadow-lg">
                Ativar Inquilino no SaaS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
