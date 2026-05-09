"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TenantService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";

export default function OnboardingPage() {
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [nicho, setNicho] = useState("");
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { session, setSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Se o usuário já tiver tenants no banco, redireciona para o Kanban
    const checkTenants = async () => {
      try {
        const myTenants = await TenantService.listMyTenants();
        if (myTenants && myTenants.length > 0) {
          router.push("/kanban");
        }
      } catch (err) {
        console.error("Erro ao verificar tenants:", err);
      }
    };
    
    if (session) {
      checkTenants();
    } else {
      router.push("/login");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!session) return;

      const tenant = await TenantService.create({
        nome_negocio: nomeNegocio,
        nome_admin: session.name,
        email_contato: session.email,
        nicho: nicho,
        google_ads_customer_id: googleAdsId || undefined,
      });

      // Atualiza a sessão com o novo tenantId
      setSession({
        ...session,
        tenantId: tenant.id,
      });

      router.push("/kanban");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg border-t-4 border-primary-600">
        <div className="flex justify-center mb-6">
          <Image src="/images/logo_texto.png" alt="Unum People" width={200} height={60} className="object-contain" priority />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Configuração da sua Conta</h1>
        <p className="text-gray-500 text-center mb-8">
          Parece que você ainda não configurou seu negócio. Preencha os dados abaixo para começar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do seu Negócio</label>
            <input
              type="text"
              value={nomeNegocio}
              onChange={(e) => setNomeNegocio(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="Ex: Minha Empresa de Tráfego"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nicho / Área de Atuação</label>
            <select
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
              required
            >
              <option value="">Selecione um nicho</option>
              <option value="Serviços Médicos">Serviços Médicos</option>
              <option value="Estética">Estética</option>
              <option value="Imobiliário">Imobiliário</option>
              <option value="Educação">Educação</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Google Ads Customer ID (Opcional)</label>
            <input
              type="text"
              value={googleAdsId}
              onChange={(e) => setGoogleAdsId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="000-000-0000"
            />
            <p className="mt-1 text-xs text-gray-400">Você poderá configurar isso depois nas configurações.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white p-4 rounded-md font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Configurando...
              </span>
            ) : (
              "Finalizar e Acessar Kanban"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
