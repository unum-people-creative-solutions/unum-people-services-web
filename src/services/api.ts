import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.token;
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Não autorizado. Limpando sessão...");
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface LeadData {
  nome: string;
  email?: string;
  telefone: string;
  origem: string;
}

export const LeadService = {
  list: async (status: string, startDate?: string, endDate?: string, tenantId?: string) => {
    const params = new URLSearchParams({ status });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (tenantId) params.append('tenant_id', tenantId);
    
    const response = await api.get(`/leads?${params.toString()}`);
    return response.data;
  },
  create: async (data: LeadData, tenantId?: string) => {
    let url = `/leads`;
    if (tenantId) {
      url += `?tenant_id=${tenantId}`;
    }
    const response = await api.post(url, data);
    return response.data;
  },
  updateStatus: async (id: string, status: string, valor?: number, dataVenda?: string, tenantId?: string) => {
    let url = `/leads/${id}`;
    if (tenantId) {
      url += `?tenant_id=${tenantId}`;
    }
    const response = await api.put(url, { status, valor_venda: valor, data_venda: dataVenda });
    return response.data;
  },
  update: async (id: string, data: { nome: string; email?: string; telefone: string; origem?: string; sales?: any[]; status?: string }, tenantId?: string) => {
    let url = `/leads/${id}`;
    if (tenantId) {
      url += `?tenant_id=${tenantId}`;
    }
    const response = await api.patch(url, data);
    return response.data;
  },
  searchCustomers: async (query: string, tenantId?: string) => {
    let url = `/leads/search?q=${query}`;
    if (tenantId) {
      url += `&tenant_id=${tenantId}`;
    }
    const response = await api.get(url);
    return response.data;
  },
  addSale: async (leadId: string, valor: number, data: string, tenantId?: string) => {
    let url = `/leads/${leadId}/sales`;
    if (tenantId) {
      url += `?tenant_id=${tenantId}`;
    }
    const response = await api.post(url, { valor, data });
    return response.data;
  }
};

export const TenantService = {
  list: async () => {
    const response = await api.get('/admin/tenants');
    return response.data;
  },
  listMyTenants: async () => {
    const response = await api.get('/me/tenants');
    return response.data;
  },
  create: async (data: { nome_negocio: string; nome_admin: string; email_contato: string; nicho: string; google_ads_customer_id?: string; use_mcc_auth?: boolean }) => {
    const response = await api.post('/admin/tenants', data);
    return response.data;
  },
  createUser: async (data: { email: string; name: string; tenant_id: string }) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  }
};

export default api;
