"use client";

import { useState } from "react";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "@/lib/cognito";
import { useAuthStore } from "@/store/authStore";
import { TenantService } from "@/services/api";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userObj, setUserObj] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onLoginSuccess = async (result: any) => {
    const idToken = result.getIdToken().getJwtToken();
    const decoded: any = jwtDecode(idToken);
    const groups = decoded["cognito:groups"] || [];
    const isGlobalAdmin = groups.includes("GlobalAdmin");
    const isTenantAdmin = groups.includes("TenantAdmin");
    
    let role = "USER";
    if (isGlobalAdmin) role = "GlobalAdmin";
    else if (isTenantAdmin) role = "TenantAdmin";

    const sessionData = {
      email: decoded.email,
      name: decoded.name || decoded.email,
      tenantId: decoded["custom:tenant_id"],
      role: role,
      token: idToken,
    };

    setSession(sessionData);

    console.log("[Login] Sessão iniciada:", {
      email: sessionData.email,
      role: sessionData.role,
      isGlobalAdmin
    });

    try {
      setLoading(true);
      console.log("[Login] Verificando se o usuário possui configuração no banco de dados...");
      
      // Busca todos os tenants vinculados ao usuário para saber se ele é um usuário válido
      const allMyTenants = await TenantService.listMyTenants();
      
      if (!allMyTenants || allMyTenants.length === 0) {
        console.log("[Login] Redirecionando para Onboarding (sem registros na base)");
        router.push("/onboarding");
        return;
      }

      // Agora busca filtrando os que possuem acesso ao CRM para este frontend
      const myTenants = await TenantService.listMyTenants("crm");
      console.log("[Login] Meus tenants compatíveis com CRM encontrados:", myTenants);

      if ((!myTenants || myTenants.length === 0) && !isGlobalAdmin) {
         setError("Este produto não faz parte do seu plano atual.");
         setSession(null);
         setLoading(false);
         return;
      }

      // Sincroniza o nome do inquilino primário na sessão (usamos o primeiro compatível, ou o primeiro total se for GlobalAdmin sem tenants de crm)
      const primaryTenant = myTenants.length > 0 ? myTenants[0] : allMyTenants[0];

      setSession({
        ...sessionData,
        tenantId: primaryTenant.id,
        tenantName: primaryTenant.nome_negocio,
      });

      if (isGlobalAdmin) {
        console.log("[Login] Redirecionando GlobalAdmin para /tenants");
        router.push("/tenants");
      } else {
        console.log("[Login] Redirecionando Usuário para /kanban");
        router.push("/kanban");
      }
    } catch (err) {
      console.error("Erro ao validar conta:", err);
      if (isGlobalAdmin) router.push("/tenants");
      else router.push("/kanban");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (data: LoginFormValues) => {
    setLoading(true);
    setError("");

    const normalizedEmail = data.email.toLowerCase().trim();

    const authDetails = new AuthenticationDetails({
      Username: normalizedEmail,
      Password: data.password,
    });

    const cognitoUser = new CognitoUser({
      Username: normalizedEmail,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: onLoginSuccess,
      onFailure: (err) => {
        setError(err.message || "Falha na autenticação");
        setLoading(false);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        setUserObj(cognitoUser);
        setIsChangingPassword(true);
        setLoading(false);
      }
    });
  };

  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError("Você deve aceitar os Termos de Uso e Política de Privacidade para continuar.");
      return;
    }

    setLoading(true);
    
    userObj.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: (result: any) => {
        const email = userObj.getUsername();
        localStorage.setItem(`terms-accepted-${email}`, new Date().toISOString());
        onLoginSuccess(result);
      },
      onFailure: (err: any) => {
        setError(err.message || "Erro ao definir nova senha");
        setLoading(false);
      }
    });
  };

  if (isChangingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-brand-blue">
          <div className="flex justify-center mb-6">
            <Image src="/images/logo_texto.webp" alt="Unum People" width={200} height={60} className="object-contain" priority />
          </div>
          <h1 className="text-xl font-bold mb-2 text-brand-blue text-center">Bem-vindo(a)!</h1>
          <p className="text-support-grey text-sm text-center mb-8">Este é seu primeiro acesso. Por favor, defina uma senha definitiva.</p>
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-brand-orange text-xs rounded-md text-center">{error}</div>}
            <div>
              <label className="block text-brand-blue text-sm font-bold mb-2">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-support-grey/30 rounded-md focus:ring-2 focus:ring-brand-blue outline-none"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div className="flex items-start space-x-2 py-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-orange focus:ring-brand-orange border-support-grey/30 rounded cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-support-grey cursor-pointer leading-tight">
                Eu li e concordo com os <Link href="/terms" target="_blank" className="text-brand-orange font-bold hover:underline">Termos de Uso</Link> e a <Link href="/privacy" target="_blank" className="text-brand-orange font-bold hover:underline">Política de Privacidade</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full bg-brand-orange text-white p-3 rounded-md font-bold hover:brightness-110 transition-colors disabled:bg-support-grey/50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Confirmar e Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-brand-blue">
        <div className="flex flex-col items-center mb-10 text-center">
          <Image 
            src="/images/logo_simbolo.webp" 
            alt="Unum People" 
            width={60} 
            height={60} 
            className="object-contain mb-4"
            priority 
          />
          <h1 className="text-3xl font-black text-brand-blue uppercase tracking-tighter">
            Unum People <span className="text-brand-blue font-black">CRM</span>
          </h1>
          <p className="text-support-grey text-xs font-bold uppercase tracking-widest mt-2 opacity-60">
            Inteligência em Vendas
          </p>
        </div>
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
          {error && <div className="p-3 bg-red-50 text-brand-orange text-xs rounded-md text-center">{error}</div>}
          <Input
            label="E-mail ou Usuário"
            type="text"
            placeholder="Digite seu e-mail"
            {...register("email")}
            error={errors.email?.message}
          />
          <div className="relative">
            <Link 
              href="/forgot-password" 
              className="absolute right-0 top-0 text-xs text-support-grey font-semibold hover:text-brand-orange transition-colors z-10"
            >
              Esqueceu a senha?
            </Link>
            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              {...register("password")}
              error={errors.password?.message}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange text-white p-3 rounded-md font-bold hover:brightness-110 transition-all shadow-md disabled:bg-support-grey/50"
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-support-grey/20 flex justify-center space-x-4 text-[10px] text-support-grey uppercase tracking-widest font-semibold">
          <Link href="/terms" className="hover:text-brand-orange transition-colors">Termos</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-brand-orange transition-colors">Privacidade</Link>
        </div>
      </div>
    </div>
  );
}
