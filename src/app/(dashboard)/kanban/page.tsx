"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api, { LeadService, TenantService, LeadData } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Plus, X, LogOut, Settings, DollarSign, AlertCircle, Calendar, Eye, EyeOff, Users, Edit2, Mail, Phone, User, Building, Search, TrendingUp, RefreshCw, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  { id: "NOVO", title: "Novos Leads", order: 0 },
  { id: "ATENDIMENTO", title: "Em Atendimento", order: 1 },
  { id: "AGENDADO", title: "Agendados", order: 2 },
  { id: "GANHO", title: "Ganho (Conversão)", order: 3 },
  { id: "PERDIDO", title: "Perdido", order: 4 },
];

// Helpers de Formatação
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const maskCurrency = (value: string) => {
  if (!value) return "";
  const cleanValue = value.replace(/\D/g, "");
  const numberValue = (Number(cleanValue) / 100).toFixed(2).replace(".", ",");
  return numberValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const unmaskCurrency = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/\./g, "").replace(",", "."));
};

function KanbanContent() {
  const searchParams = useSearchParams();
  const { session, logout } = useAuthStore();
  const router = useRouter();

  const [boardData, setBoardData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  
  const [showRevenue, setShowRevenue] = useState(false);
  
  const [newLead, setNewLead] = useState<LeadData>({ nome: "", email: "", telefone: "", origem: "Indicação" });
  const [editingLead, setEditingLead] = useState<any>(null);
  const [saleValueMasked, setSaleValueMasked] = useState("");
  const [pendingMove, setPendingMove] = useState<any>(null);

  // Estados para Busca de Nova Venda
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Controle de Tenant
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(searchParams.get("tenant_id") || "");
  const [currentTenantName, setCurrentTenantName] = useState<string>("Carregando conta...");

  // Lógica de Filtro de Mês
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Cálculo de Faturamento Total no Período
  const totalRevenue = Object.values(boardData).flat().reduce((acc: number, lead: any) => {
    const periodSales = lead.sales?.filter((s: any) => {
      const d = new Date(s.data);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }) || [];
    return acc + periodSales.reduce((sum: number, s: any) => sum + s.valor, 0);
  }, 0);

  useEffect(() => { loadAccountData(); }, [session]);

  useEffect(() => {
    if (selectedTenantId) loadLeads();
    if (tenants.length > 0) {
      const found = tenants.find(t => t.id === selectedTenantId);
      if (found) setCurrentTenantName(found.nome_negocio);
    }
  }, [selectedMonth, selectedYear, selectedTenantId, tenants]);

  const loadAccountData = async () => {
    try {
      let data = session?.role === "GlobalAdmin" ? await TenantService.list() : await TenantService.listMyTenants();
      const tenantsData = data || [];
      setTenants(tenantsData);
      if (!selectedTenantId && tenantsData.length > 0) {
        setSelectedTenantId(tenantsData[0].id);
      } else if (!selectedTenantId && session?.tenantId) {
        setSelectedTenantId(session.tenantId);
      }
    } catch (err) { 
      console.error(err);
      setTenants([]);
    }
  };

  const loadLeads = async (silent = false) => {
    if (!selectedTenantId) return;
    if (!silent) setLoading(true);
    try {
      const start = new Date(selectedYear, selectedMonth, 1).toISOString();
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();
      
      const results: any = {};
      await Promise.all(COLUMNS.map(async (col) => {
        const data = await LeadService.list(col.id, start, end, selectedTenantId);
        results[col.id] = data || [];
      }));
      
      setBoardData(results);
    } catch (err) { 
      console.error(err);
      if (!silent) setBoardData({});
    } finally { 
      if (!silent) setLoading(false); 
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await LeadService.create(newLead, selectedTenantId);
      setIsModalOpen(false);
      setNewLead({ nome: "", email: "", telefone: "", origem: "Indicação" });
      loadLeads();
    } catch (err) { alert("Falha ao criar lead"); }
  };

  const handleEditClick = (lead: any) => {
    setEditingLead({ ...lead, sales: lead.sales || [] });
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await LeadService.update(editingLead.id, {
        nome: editingLead.nome,
        email: editingLead.email,
        telefone: editingLead.telefone,
        sales: editingLead.sales,
        status: editingLead.status
      }, selectedTenantId);
      setIsEditModalOpen(false);
      setEditingLead(null);
      loadLeads(true);
    } catch (err) { alert("Falha ao atualizar lead"); }
  };

  const handleSearchCustomers = async (query: string) => {
    setCustomerSearchQuery(query);
    if (query.length < 2) {
      setFoundCustomers([]);
      return;
    }
    try {
      const data = await LeadService.searchCustomers(query, selectedTenantId);
      setFoundCustomers(data || []);
    } catch (err) { 
      console.error(err);
      setFoundCustomers([]);
    }
  };

  const handleAddManualSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const rawValue = unmaskCurrency(saleValueMasked);
      await LeadService.addSale(selectedCustomer.id, rawValue, new Date().toISOString(), selectedTenantId);
      setIsNewSaleModalOpen(false);
      setSelectedCustomer(null);
      setSaleValueMasked("");
      loadLeads(true);
    } catch (err) { alert("Falha ao registrar venda"); }
  };

  const executeMove = async (draggableId: string, destinationId: string, valor = 0) => {
    try {
      await LeadService.updateStatus(draggableId, destinationId, valor, selectedTenantId);
      // Sincroniza com o servidor para pegar dados atualizados
      loadLeads(true);
    } catch (err) { 
      console.error(err);
      alert("Falha ao salvar movimento no servidor. Sincronizando...");
      loadLeads(); 
    }
  };

  const confirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMove) return;
    const rawValue = unmaskCurrency(saleValueMasked);
    await executeMove(pendingMove.draggableId, pendingMove.destinationId, rawValue);
    setIsSaleModalOpen(false);
    setSaleValueMasked("");
    setPendingMove(null);
  };

  const confirmBackwardsMove = async () => {
    if (!pendingMove) return;
    await executeMove(pendingMove.draggableId, pendingMove.destinationId);
    setIsConfirmModalOpen(false);
    setPendingMove(null);
  };

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    
    // Se não mudou de lugar, não faz nada
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    // 1. ATUALIZAÇÃO OTIMISTA IMEDIATA (Evita o card pular de volta)
    const newBoardData = { ...boardData };
    const sourceLeads = Array.from(boardData[source.droppableId] || []);
    const destLeads = Array.from(boardData[destination.droppableId] || []);
    
    const [movedLead] = sourceLeads.splice(source.index, 1);
    if (movedLead) {
      const updatedLead = { ...movedLead, status: destination.droppableId };
      destLeads.splice(destination.index, 0, updatedLead);
      
      newBoardData[source.droppableId] = sourceLeads;
      newBoardData[destination.droppableId] = destLeads;
      setBoardData(newBoardData);
    }

    const sourceColDef = COLUMNS.find(c => c.id === source.droppableId);
    const destColDef = COLUMNS.find(c => c.id === destination.droppableId);

    // 2. LÓGICA DE MODAIS (Mantém o card no destino enquanto aguarda)
    if (destination.droppableId === "GANHO") {
      setPendingMove({ draggableId, sourceId: source.droppableId, destinationId: destination.droppableId, sourceIndex: source.index, destinationIndex: destination.index });
      setIsSaleModalOpen(true);
      return;
    }
    
    if (destColDef && sourceColDef && destColDef.order < sourceColDef.order) {
      setPendingMove({ draggableId, sourceId: source.droppableId, destinationId: destination.droppableId, sourceIndex: source.index, destinationIndex: destination.index });
      setIsConfirmModalOpen(true);
      return;
    }

    // 3. MOVIMENTO NORMAL: Sincroniza com servidor
    await executeMove(draggableId, destination.droppableId);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-6">
          <Image src="/images/logo_simbolo.png" alt="Unum People" width={40} height={40} className="object-contain" priority />
          <div className="flex items-center gap-3 border-l pl-6">
            <div className="flex items-center bg-primary-50 rounded-lg p-1 border border-primary-100">
              <Building size={14} className="text-primary-400 ml-2" />
              <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className="bg-transparent border-none text-xs font-bold text-primary-800 p-2 cursor-pointer max-w-[200px]">
                {tenants.map(t => <option key={t.id} value={t.id}>{t.nome_negocio}</option>)}
              </select>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Calendar size={14} className="text-gray-400 ml-2" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent border-none text-xs font-bold text-gray-700 p-2 cursor-pointer">
                {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent border-none text-xs font-bold text-gray-700 p-2 cursor-pointer">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
              <span className="text-[10px] font-bold text-green-700 uppercase">Faturamento</span>
              <span className="text-sm font-black text-green-700 font-mono">{showRevenue ? formatCurrency(totalRevenue) : "R$ ••••••"}</span>
              <button onClick={() => setShowRevenue(!showRevenue)} className="text-green-600">{showRevenue ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="https://unum-people-creative-solutions.github.io/unum-people-services-docs/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-all font-bold text-xs px-2"
          >
            <HelpCircle size={18} /> Ajuda
          </a>
          <button onClick={() => setIsNewSaleModalOpen(true)} className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 text-xs font-bold transition-all shadow-sm">
            <TrendingUp size={16} /> Nova Venda
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-700 text-sm font-bold shadow-sm">
            <Plus size={18} /> Novo Lead
          </button>
          <div className="flex items-center gap-4 border-l pl-4 ml-2">
            <div className="text-right leading-tight">
              <p className="text-sm font-bold">{session?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">{session?.role}</p>
            </div>
            {session?.role === "GlobalAdmin" && (
              <button 
                onClick={() => router.push("/tenants")}
                className="bg-primary-50 text-primary-600 hover:bg-primary-100 p-2 rounded-lg transition-all border border-primary-100 shadow-sm flex items-center justify-center"
                title="Painel Administrativo"
              >
                <Settings size={18} />
              </button>
            )}
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500" title="Sair"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 min-h-0 relative">
        {/* Overlay de Loading Moderno (Não desmonta a tela) */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[1.5px] transition-all duration-300 text-gray-900">
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="relative flex items-center justify-center">
                <RefreshCw className="animate-spin text-primary-600" size={42} />
                <div className="absolute inset-0 animate-ping rounded-full border-4 border-primary-100 opacity-20"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-gray-800 uppercase tracking-tighter">Sincronizando</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Aguarde um instante</p>
              </div>
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full overflow-x-auto pb-4 custom-scrollbar">
            {COLUMNS.map((col) => (
              <div key={col.id} className="w-72 flex flex-col bg-gray-200/50 rounded-lg p-3 max-h-full flex-shrink-0">
                <h2 className="font-bold text-gray-700 mb-4 px-1 flex justify-between items-center uppercase text-[10px] tracking-widest shrink-0">
                  {col.title} <span className="bg-gray-300 text-[10px] py-0.5 px-2 rounded-full">{boardData[col.id]?.length || 0}</span>
                </h2>
                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                      {boardData[col.id]?.map((lead: any, index: number) => {
                        const monthSales = lead.sales?.filter((s: any) => {
                          const d = new Date(s.data);
                          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                        }) || [];
                        const monthTotal = monthSales.reduce((sum: number, s: any) => sum + s.valor, 0);
                        const totalLtv = lead.sales?.reduce((sum: number, s: any) => sum + s.valor, 0) || 0;
                        
                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white p-4 rounded shadow-sm mb-3 border-l-4 border-primary-500 hover:shadow-md group relative transition-all">
                                <button onClick={() => handleEditClick(lead)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                                <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{lead.nome}</div>
                                <div className="text-xs text-gray-500 mt-1">{lead.telefone}</div>
                                {monthTotal > 0 && (
                                  <div className="text-xs font-black text-green-600 mt-2">
                                    {formatCurrency(monthTotal)}
                                  </div>
                                )}

                                {totalLtv > monthTotal && (
                                  <div className="text-[9px] text-primary-500 font-bold uppercase mt-1">
                                    LTV: {formatCurrency(totalLtv)}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </main>

      {/* Modal Novo Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-primary-700"><Plus size={20}/> Novo Lead Manual</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                <input type="text" required value={newLead.nome} onChange={(e) => setNewLead({...newLead, nome: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nome do cliente" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                <input type="email" value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp</label>
                <input type="text" required value={newLead.telefone} onChange={(e) => setNewLead({...newLead, telefone: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Origem</label>
                <select value={newLead.origem} onChange={(e) => setNewLead({...newLead, origem: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="Indicação">Indicação</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 shadow-lg transition-all mt-4">Criar Lead</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Venda (Busca de Clientes) */}
      {isNewSaleModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm text-gray-900">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-green-700"><TrendingUp size={20}/> Registrar Nova Venda</h2>
              <button onClick={() => {setIsNewSaleModalOpen(false); setSelectedCustomer(null);}}><X size={20} /></button>
            </div>
            {!selectedCustomer ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input type="text" placeholder="Pesquisar cliente por nome..." value={customerSearchQuery} onChange={(e) => handleSearchCustomers(e.target.value)} className="w-full border p-3 pl-10 rounded-md outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                  {foundCustomers.map(c => (
                    <button key={c.id} onClick={() => setSelectedCustomer(c)} className="w-full text-left p-3 hover:bg-green-50 rounded-md border border-transparent hover:border-green-100 flex justify-between items-center group transition-all">
                      <span className="font-medium">{c.nome}</span>
                      <Plus size={14} className="text-green-500 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddManualSale} className="space-y-4">
                <div className="bg-green-50 p-4 rounded-md border border-green-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Cliente selecionado</p>
                    <p className="font-bold text-green-900">{selectedCustomer.nome}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-green-700 hover:underline font-bold">Trocar</button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Valor da Venda</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-2xl font-black text-green-600">R$</span>
                    <input type="text" required autoFocus value={saleValueMasked} onChange={(e) => setSaleValueMasked(maskCurrency(e.target.value))} className="w-full border p-4 pl-14 rounded-md outline-none focus:ring-2 focus:ring-green-500 text-3xl font-black text-gray-800" placeholder="0,00" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-md font-bold hover:bg-green-700 shadow-lg transition-all">Confirmar Venda</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edição (Lista de Vendas) */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-gray-900">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Edit2 size={18} className="text-primary-600" /> Editar Lead</h2>
              <button onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateLead} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                  <input type="text" value={editingLead.nome} onChange={(e) => setEditingLead({...editingLead, nome: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                  <input type="email" value={editingLead.email || ""} onChange={(e) => setEditingLead({...editingLead, email: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label>
                  <input type="text" value={editingLead.telefone} onChange={(e) => setEditingLead({...editingLead, telefone: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" /></div>
              </div>
              
              <div className="mt-8 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-gray-700 uppercase flex items-center gap-2"><DollarSign size={16} className="text-green-600" /> Vendas do mês</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(editingLead);
                      setIsNewSaleModalOpen(true);
                      setIsEditModalOpen(false);
                    }}
                    className="flex items-center gap-1 text-[11px] font-black bg-green-50 text-green-700 px-2.5 py-1 rounded border border-green-200 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                  >
                    $ +
                  </button>
                </div>
                <div className="space-y-2">
                  {editingLead.sales?.length > 0 ? editingLead.sales.map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border">
                      <span className="text-xs font-bold text-gray-400">{new Date(s.data).toLocaleDateString('pt-BR')}</span>
                      <span className="font-black text-green-700">{formatCurrency(s.valor)}</span>
                    </div>
                  )) : <p className="text-center text-xs text-gray-400 py-4 italic">Nenhuma venda registrada.</p>}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 p-3 rounded-md font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary-600 text-white p-3 rounded-md font-bold">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modais de Movimentação (Simplificados) */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 text-gray-900">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm border-t-4 border-green-500 shadow-2xl">
            <h2 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2"><DollarSign size={20} /> Venda Concluída!</h2>
            <form onSubmit={confirmSale} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-4 text-2xl font-black text-green-600">R$</span>
                <input type="text" required autoFocus value={saleValueMasked} onChange={(e) => setSaleValueMasked(maskCurrency(e.target.value))} className="w-full border p-4 pl-14 rounded-md outline-none focus:ring-2 focus:ring-green-500 text-3xl font-black text-gray-800" placeholder="0,00" />
              </div>
              <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-md font-bold hover:bg-green-700 transition-all">Confirmar Valor</button>
              <button type="button" onClick={() => { setIsSaleModalOpen(false); setPendingMove(null); loadLeads(true); }} className="w-full bg-gray-100 p-2 mt-2 rounded font-bold text-gray-500 text-xs">Cancelar movimento</button>
            </form>
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-gray-900">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-gray-900 border-t-4 border-orange-500">
            <h2 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2"><AlertCircle size={20} /> Mover para trás?</h2>
            <p className="text-sm text-gray-600 mb-6 font-medium">Deseja realmente retroceder este lead para uma etapa anterior do funil?</p>
            <div className="flex gap-3">
              <button onClick={confirmBackwardsMove} className="flex-1 bg-orange-600 text-white p-2 rounded font-bold hover:bg-orange-700 transition-all">Sim, mover</button>
              <button onClick={() => { setIsConfirmModalOpen(false); setPendingMove(null); loadLeads(true); }} className="flex-1 bg-gray-100 p-2 rounded font-bold hover:bg-gray-200 transition-all">Não, cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }`}</style>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Carregando interface...</div>}>
      <KanbanContent />
    </Suspense>
  );
}
