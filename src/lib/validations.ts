import { z } from "zod";

export const emailSchema = z.string().email("E-mail inválido");

export const phoneSchema = z.string().refine((val) => {
  const nums = val.replace(/\D/g, "");
  return nums.length >= 10 && nums.length <= 11;
}, "Telefone deve ter 10 ou 11 dígitos");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

export const tenantSchema = z.object({
  nome_negocio: z.string().min(2, "Nome do negócio deve ter pelo menos 2 caracteres"),
  nome_admin: z.string().min(2, "Nome do administrador deve ter pelo menos 2 caracteres"),
  email_contato: emailSchema,
  nicho: z.string(),
  google_ads_customer_id: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, "Formato inválido (000-000-0000)"),
  use_mcc_auth: z.boolean(),
});

export const leadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: emailSchema.optional().or(z.literal("")),
  telefone: phoneSchema,
  origem: z.string(),
  anotacoes: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  code: z.string().min(6, "Código deve ter pelo menos 6 caracteres"),
  newPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const userInviteSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: emailSchema,
  tenant_id: z.string().min(1, "Tenant é obrigatório"),
});

export const onboardingSchema = z.object({
  nome_negocio: z.string().min(2, "Nome do negócio deve ter pelo menos 2 caracteres"),
  nicho: z.string().min(1, "Nicho é obrigatório"),
  google_ads_customer_id: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, "Formato inválido (000-000-0000)").optional().or(z.literal("")),
});
