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

export const LeadService = {
  list: async (status: string, startDate?: string, endDate?: string) => {
    let url = `/leads?status=${status}`;
    if (startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },
  updateStatus: async (id: string, status: string, valor?: number) => {
    const response = await api.patch(`/leads/${id}`, { status, valor_venda: valor });
    return response.data;
  }
};

export const TenantService = {
  list: async () => {
    const response = await api.get('/admin/tenants');
    return response.data;
  },
  create: async (data: { nome_negocio: string; email_contato: string; nicho: string }) => {
    const response = await api.post('/admin/tenants', data);
    return response.data;
  }
};

export default api;
