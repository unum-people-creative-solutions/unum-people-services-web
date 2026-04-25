"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api, { LeadService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Plus, X, LogOut, Settings, DollarSign, AlertCircle, Calendar, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COLUMNS = [
  { id: "NOVO", title: "Novos Leads", order: 0 },
  { id: "ATENDIMENTO", title: "Em Atendimento", order: 1 },
  { id: "AGENDADO", title: "Agendados", order: 2 },
  { id: "GANHO", title: "Ganho (Conversão)", order: 3 },
  { id: "PERDIDO", title: "Perdido", order: 4 },
];

export default function KanbanPage() {
  const [boardData, setBoardData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  
  const [newLead, setNewLead] = useState({ nome: "", email: "", telefone: "", origem: "Indicação" });
  const [saleValue, setSaleValue] = useState("");
  const [pendingMove, setPendingMove] = useState<any>(null);

  // Lógica de Filtro de Mês
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const totalRevenue = boardData["GANHO"]?.reduce((acc: number, lead: any) => acc + (lead.valor_venda || 0), 0) || 0;
  
  const { session, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadLeads();
  }, [selectedMonth, selectedYear]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const start = new Date(selectedYear, selectedMonth, 1).toISOString();
      const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();

      const results: any = {};
      for (const col of COLUMNS) {
        const response = await LeadService.list(col.id, start, end);
        results[col.id] = response;
      }
      setBoardData(results);
    } catch (err) {
      console.error("Erro ao carregar leads", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/leads", { ...newLead, tenant_id: session?.tenantId });
      setIsModalOpen(false);
      setNewLead({ nome: "", email: "", telefone: "", origem: "Indicação" });
      loadLeads();
    } catch (err) {
      alert("Falha ao criar lead");
    }
  };

  const executeMove = async (draggableId: string, sourceId: string, destinationId: string, sourceIndex: number, destinationIndex: number, valor = 0) => {
    const sourceCol = [...boardData[sourceId]];
    const destCol = [...boardData[destinationId]];
    const [movedLead] = sourceCol.splice(sourceIndex, 1);
    destCol.splice(destinationIndex, 0, movedLead);

    setBoardData({
      ...boardData,
      [sourceId]: sourceCol,
      [destinationId]: destCol,
    });

    try {
      await LeadService.updateStatus(draggableId, destinationId, valor);
    } catch (err) {
      loadLeads();
    }
  };

  const confirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMove) return;
    await executeMove(pendingMove.draggableId, pendingMove.sourceId, pendingMove.destinationId, pendingMove.sourceIndex, pendingMove.destinationIndex, parseFloat(saleValue));
    setIsSaleModalOpen(false);
    setSaleValue("");
    setPendingMove(null);
  };

  const confirmBackwardsMove = async () => {
    if (!pendingMove) return;
    await executeMove(pendingMove.draggableId, pendingMove.sourceId, pendingMove.destinationId, pendingMove.sourceIndex, pendingMove.destinationIndex);
    setIsConfirmModalOpen(false);
    setPendingMove(null);
  };

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const sourceColDef = COLUMNS.find(c => c.id === source.droppableId);
    const destColDef = COLUMNS.find(c => c.id === destination.droppableId);

    const moveData = {
      draggableId,
      destinationId: destination.droppableId,
      sourceId: source.droppableId,
      sourceIndex: source.index,
      destinationIndex: destination.index
    };

    if (destination.droppableId === "GANHO") {
      setPendingMove(moveData);
      setIsSaleModalOpen(true);
      return;
    }

    if (destColDef && sourceColDef && destColDef.order < sourceColDef.order) {
      setPendingMove(moveData);
      setIsConfirmModalOpen(true);
      return;
    }

    await executeMove(draggableId, source.droppableId, destination.droppableId, source.index, destination.index);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Pipeline</h1>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Calendar size={14} className="text-gray-400 ml-2" />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none p-2 cursor-pointer"
              >
                {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none p-2 cursor-pointer"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
              <span className="text-[10px] font-bold text-green-700 uppercase">Faturamento</span>
              <div className="flex items-center gap-2 min-w-[120px] justify-end">
                <span className="text-sm font-black text-green-700 font-mono">
                  {showRevenue 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)
                    : "R$ ••••••"}
                </span>
                <button onClick={() => setShowRevenue(!showRevenue)} className="text-green-600 hover:text-green-800 transition-colors">
                  {showRevenue ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session?.role === "GlobalAdmin" && (
            <Link href="/tenants" className="flex items-center gap-2 text-sm font-semibold text-primary-700 bg-primary-50 px-3 py-2 rounded-md hover:bg-primary-100 transition-colors mr-2 border border-primary-100">
              <Settings size={16} /> Painel Admin
            </Link>
          )}

          <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm">
            <Plus size={18} /> Novo Lead
          </button>

          <div className="flex items-center gap-4 border-l pl-6 ml-2">
            <div className="text-right hidden sm:block leading-tight">
              <p className="text-sm font-bold text-gray-900">{session?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{session?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Sair do sistema">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 font-medium">Sincronizando Leads...</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 min-w-max h-full">
              {COLUMNS.map((col) => (
                <div key={col.id} className="w-72 flex flex-col bg-gray-200/50 rounded-lg p-3">
                  <h2 className="font-semibold text-gray-700 mb-4 px-1 flex justify-between items-center">
                    {col.title}
                    <span className="bg-gray-300 text-[10px] py-0.5 px-2 rounded-full font-bold">
                      {boardData[col.id]?.length || 0}
                    </span>
                  </h2>

                  <Droppable droppableId={col.id}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 min-h-[100px]">
                        {boardData[col.id]?.map((lead: any, index: number) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white p-4 rounded shadow-sm mb-3 border-l-4 border-primary-500 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                              >
                                <div className="font-bold text-gray-900">{lead.nome}</div>
                                <div className="text-sm text-gray-500 mt-1">{lead.telefone}</div>
                                {lead.valor_venda > 0 && (
                                  <div className="text-xs font-bold text-green-600 mt-1 flex items-center gap-1">
                                    <DollarSign size={12} /> R$ {lead.valor_venda.toLocaleString('pt-BR')}
                                  </div>
                                )}
                                <div className="flex justify-between items-center mt-3">
                                  {lead.gclid ? (
                                    <span className="text-[10px] bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full font-bold uppercase truncate max-w-[150px]" title={lead.utm_campaign}>
                                      Ads: {lead.utm_campaign || 'Google'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                      {lead.origem || "Manual"}
                                    </span>
                                  )}
                                  <time className="text-[10px] text-gray-400 font-medium">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                  </time>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Modais de Criação, Venda e Confirmação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 text-gray-900">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-bold">Cadastrar Novo Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Nome Completo</label>
                <input type="text" required value={newLead.nome} onChange={(e) => setNewLead({...newLead, nome: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1 font-bold">E-mail</label>
                <input type="email" value={newLead.email} onChange={(e) => setNewLead({...newLead, email: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Telefone (WhatsApp)</label>
                <input type="text" required value={newLead.telefone} onChange={(e) => setNewLead({...newLead, telefone: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500" placeholder="+55..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Origem do Lead</label>
                <select value={newLead.origem} onChange={(e) => setNewLead({...newLead, origem: e.target.value})} className="w-full border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="Indicação">Indicação</option>
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Outros">Outros</option>
                </select></div>
              <button type="submit" className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-colors shadow-lg">Criar Lead</button>
            </form>
          </div>
        </div>
      )}

      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200 border-t-4 border-green-500 text-gray-900">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-green-700 flex items-center gap-2"><DollarSign size={20} /> Venda Realizada!</h2>
              <button onClick={() => { setIsSaleModalOpen(false); setPendingMove(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-gray-600 text-sm mb-6">Parabéns! Informe o valor da venda para registrar no sistema.</p>
            <form onSubmit={confirmSale} className="space-y-4">
              <div className="relative">
                <input type="number" step="1" required autoFocus value={saleValue} onChange={(e) => setSaleValue(e.target.value)} className="w-full border p-4 rounded-md outline-none focus:ring-2 focus:ring-green-500 text-2xl font-black text-gray-800 pr-12" placeholder="0" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">BRL</div>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-md font-bold hover:bg-green-700 transition-colors shadow-lg text-lg">Confirmar</button>
            </form>
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200 border-t-4 border-orange-500 text-gray-900">
            <div className="flex items-center gap-3 mb-4 text-orange-600"><AlertCircle size={24} /><h2 className="text-lg font-bold">Mover para trás?</h2></div>
            <p className="text-gray-600 text-sm mb-6">Deseja retroceder este lead para uma etapa anterior?</p>
            <div className="flex gap-3">
              <button onClick={confirmBackwardsMove} className="flex-1 bg-orange-600 text-white p-3 rounded-md font-bold hover:bg-orange-700 transition-colors">Sim</button>
              <button onClick={() => { setIsConfirmModalOpen(false); setPendingMove(null); loadLeads(); }} className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-md font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
