"use client";

import { useEffect, useState } from "react";
import { TenantService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Plus, X, Building, Mail, Briefcase, Hash, LayoutGrid, Search, UserPlus, User, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";

// Sub-componente para exibição segura da API Key
function ApiKeyCell({ apiKey }: { apiKey: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <code className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded border min-w-[120px] text-gray-600">
        {visible ? apiKey : "up_••••••••••••••••••••"}
      </code>
      <button 
        onClick={() => setVisible(!visible)} 
        className="text-gray-400 hover:text-primary-600 transition-colors"
        title={visible ? "Ocultar Chave" : "Revelar Chave"}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button 
        onClick={handleCopy} 
        className="text-gray-400 hover:text-green-600 transition-colors"
        title="Copiar para área de transferência"
      >
        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  const [newTenant, setNewTenant] = useState({ 
    nome_negocio: "", 
    nome_admin: "",
    email_contato: "", 
    nicho: "MEDICINA",
    google_ads_customer_id: "",
    use_mcc_auth: true 
  });

  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    tenant_id: ""
  });
  
  const { session, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Aguarda a hidratação e a presença da sessão para decidir o redirecionamento
    if (!session) return; 

    if (session.role !== "GlobalAdmin") {
      router.push("/kanban");
      return;
    }
    loadTenants();
  }, [session, router]);

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
      const payload = { 
        ...newTenant, 
        email_contato: newTenant.email_contato.toLowerCase().trim() 
      };
      await TenantService.create(payload);
      setIsModalOpen(false);
      setNewTenant({ 
        nome_negocio: "", 
        nome_admin: "", 
        email_contato: "", 
        nicho: "MEDICINA", 
        google_ads_customer_id: "", 
        use_mcc_auth: true 
      });
      loadTenants();
    } catch (err) {
      alert("Falha ao criar inquilino");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...newUser, 
        email: newUser.email.toLowerCase().trim() 
      };
      await TenantService.createUser(payload);
      setIsUserModalOpen(false);
      setNewUser({ email: "", name: "", tenant_id: "" });
      alert("Usuário convidado com sucesso! Ele receberá um e-mail para definir a senha.");
    } catch (err) {
      alert("Falha ao criar usuário");
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.nome_negocio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email_contato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Carregando painel administrativo...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <Navbar 
        onNewLead={() => setIsModalOpen(true)}
        newLeadLabel="Cadastrar Inquilino"
      />

      <main className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tight">
              <Building className="text-primary-600" size={28} /> Gestão de Inquilinos
            </h1>
            <p className="text-gray-500 text-sm font-medium">Controle central de instâncias e acessos do sistema.</p>
          </div>
        </div>

        {/* Filtro de Busca */}
        <div className="mb-6 flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <Search className="text-gray-400 mr-3" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome do negócio ou e-mail do administrador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none text-sm text-gray-700 bg-transparent"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600 ml-2">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Negócio</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contato / Ads ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">API Integration</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nicho</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.length > 0 ? (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{t.nome_negocio}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{t.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{t.email_contato}</div>
                      <div className="text-xs font-bold text-primary-600">{t.google_ads_customer_id || "Não configurado"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ApiKeyCell apiKey={t.api_key} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{t.nicho}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => { setNewUser({ ...newUser, tenant_id: t.id }); setIsUserModalOpen(true); }}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors font-bold flex items-center gap-1"
                          title="Adicionar Usuário"
                        >
                          <UserPlus size={14} />
                        </button>
                        <button 
                          onClick={() => router.push(`/kanban?tenant_id=${t.id}`)}
                          className="bg-primary-50 text-primary-700 px-3 py-1 rounded-md hover:bg-primary-100 transition-colors font-bold flex items-center gap-1"
                        >
                          <LayoutGrid size={14} /> Acessar CRM
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm font-medium">
                    Nenhum inquilino encontrado para sua busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Novo Inquilino */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl text-gray-900 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-bold">Cadastrar Novo Inquilino</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Dados da Empresa</h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Building size={14}/> Nome do Negócio</label>
                  <input type="text" required value={newTenant.nome_negocio}
                    onChange={(e) => setNewTenant({...newTenant, nome_negocio: e.target.value})}
                    className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="Ex: Clínica Sorriso" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Briefcase size={14}/> Nicho</label>
                  <select value={newTenant.nicho}
                    onChange={(e) => setNewTenant({...newTenant, nicho: e.target.value})}
                    className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500 bg-white font-bold">
                    <option value="MEDICINA">Medicina / Clínicas</option>
                    <option value="ODONTOLOGIA">Odontologia</option>
                    <option value="ESTETICA">Estética / Saúde</option>
                    <option value="PSICOLOGIA">Psicologia</option>
                    <option value="DIREITO">Direito / Advogados</option>
                    <option value="IMOBILIARIO">Imobiliário / Corretores</option>
                    <option value="FITNESS">Fitness / Academias</option>
                    <option value="EDUCACAO">Educação / Cursos</option>
                    <option value="ENERGIA_SOLAR">Energia Solar</option>
                    <option value="SERVICOS_PROFISSIONAIS">Serviços Profissionais</option>
                    <option value="VAREJO">Varejo / Comércio Local</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Hash size={14}/> ID Google Ads</label>
                  <input type="text" required value={newTenant.google_ads_customer_id}
                    onChange={(e) => setNewTenant({...newTenant, google_ads_customer_id: e.target.value})}
                    className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="000-000-0000" />
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-md border border-primary-100 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary-400 mb-2">Usuário Administrador</h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><User size={14}/> Nome Completo</label>
                  <input type="text" required value={newTenant.nome_admin}
                    onChange={(e) => setNewTenant({...newTenant, nome_admin: e.target.value})}
                    className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="Nome da pessoa" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Mail size={14}/> E-mail de Acesso</label>
                  <input type="email" required value={newTenant.email_contato}
                    onChange={(e) => setNewTenant({...newTenant, email_contato: e.target.value})}
                    className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="email@exemplo.com" />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2 bg-purple-50 p-2 rounded-md">
                <input type="checkbox" id="mcc" checked={newTenant.use_mcc_auth}
                  onChange={(e) => setNewTenant({...newTenant, use_mcc_auth: e.target.checked})} 
                  className="w-4 h-4 text-primary-600 rounded" />
                <label htmlFor="mcc" className="text-xs text-purple-900 font-bold cursor-pointer">Usar minha MCC de Gestor</label>
              </div>
              
              <button type="submit" className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-colors shadow-lg">
                Ativar Inquilino e Criar Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário para Tenant Existente */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl text-gray-900">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-primary-700"><UserPlus size={20} /> Convidar Usuário</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-6">O usuário será vinculado ao tenant <strong>{tenants.find(t => t.id === newUser.tenant_id)?.nome_negocio}</strong>.</p>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><User size={14}/> Nome Completo</label>
                <input type="text" required value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Mail size={14}/> E-mail</label>
                <input type="email" required value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-colors shadow-lg">
                Convidar e Criar Usuário
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
