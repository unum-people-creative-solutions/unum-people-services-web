"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, X, Shield, Mail, User } from "lucide-react";
import { TenantService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function TabTeam() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "user" });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await TenantService.listUsers();
      setUsers(res || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      alert("Falha ao carregar a lista de usuários.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviting(true);
      await TenantService.addUser(inviteForm);
      setShowInviteModal(false);
      setInviteForm({ name: "", email: "", role: "user" });
      await fetchUsers();
    } catch (error) {
      console.error("Erro ao convidar:", error);
      alert("Ocorreu um erro ao convidar o usuário.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    try {
      await TenantService.removeUser(email);
      await fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Erro ao remover usuário.");
    }
  };

  const handleToggleRole = async (email: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await TenantService.updateUserRole(email, newRole);
      await fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar nível.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Users size={16} /> Equipe
          </h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 text-sm shadow-md"
          >
            <UserPlus size={16} /> Convidar Usuário
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando equipe...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 px-2 font-black">Usuário</th>
                  <th className="pb-3 px-2 font-black">Nível</th>
                  <th className="pb-3 px-2 font-black text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-sm text-gray-500">Nenhum usuário encontrado.</td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={u.id || idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 text-primary-700 p-2 rounded-full">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleToggleRole(u.email, u.role)} className="text-gray-400 hover:text-brand-blue transition-colors text-sm font-semibold">
                            Alterar Cargo
                          </button>
                          <button onClick={() => handleRemove(u.email)} className="text-gray-400 hover:text-red-600 transition-colors text-sm font-semibold">
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Convite */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-label="Convidar Usuário"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                  <UserPlus size={20} className="text-brand-blue" />
                  Convidar Usuário
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label htmlFor="invite-name" className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-brand-blue transition-colors">
                    <User size={18} className="text-gray-400" />
                    <input
                      id="invite-name"
                      required
                      type="text"
                      placeholder="Nome completo"
                      className="bg-transparent outline-none w-full text-sm font-medium text-gray-800"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="invite-email" className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-brand-blue transition-colors">
                    <Mail size={18} className="text-gray-400" />
                    <input
                      id="invite-email"
                      required
                      type="email"
                      placeholder="exemplo@empresa.com"
                      className="bg-transparent outline-none w-full text-sm font-medium text-gray-800"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="invite-role" className="block text-xs font-bold text-gray-500 uppercase mb-1">Nível</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-brand-blue transition-colors">
                    <Shield size={18} className="text-gray-400" />
                    <select
                      id="invite-role"
                      className="bg-transparent outline-none w-full text-sm font-medium text-gray-800 cursor-pointer"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 px-4 py-3 bg-brand-blue text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {inviting ? "Enviando..." : "Enviar Convite"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
