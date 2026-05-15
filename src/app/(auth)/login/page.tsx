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
    const role = isGlobalAdmin ? "GlobalAdmin" : "USER";

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
      const myTenants = await TenantService.listMyTenants();
      console.log("[Login] Meus tenants encontrados:", myTenants);
      
      if (!myTenants || myTenants.length === 0) {
        console.log("[Login] Redirecionando para Onboarding (sem registros na base)");
        router.push("/onboarding");
      } else {
        if (isGlobalAdmin) {
          console.log("[Login] Redirecionando GlobalAdmin para /tenants");
          router.push("/tenants");
        } else {
          console.log("[Login] Redirecionando Usuário para /kanban");
          router.push("/kanban");
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-primary-600">
          <div className="flex justify-center mb-6">
            <Image src="/images/logo_texto.png" alt="Unum People" width={200} height={60} className="object-contain" priority />
          </div>
          <h1 className="text-xl font-bold mb-2 text-gray-800 text-center">Bem-vindo(a)!</h1>
          <p className="text-gray-500 text-sm text-center mb-8">Este é seu primeiro acesso. Por favor, defina uma senha definitiva.</p>
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center">{error}</div>}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
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
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer leading-tight">
                Eu li e concordo com os <Link href="/terms" target="_blank" className="text-primary-600 hover:underline">Termos de Uso</Link> e a <Link href="/privacy" target="_blank" className="text-primary-600 hover:underline">Política de Privacidade</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Confirmar e Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-primary-600">
        <div className="flex justify-center mb-10">
          <Image 
            src="/images/logo_texto.png" 
            alt="Unum People" 
            width={240} 
            height={80} 
            className="object-contain drop-shadow-sm"
            priority 
          />
        </div>
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center">{error}</div>}
          <Input
            label="E-mail ou Usuário"
            type="text"
            placeholder="Digite seu e-mail"
            {...register("email")}
            error={errors.email?.message}
          />
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-700 text-sm font-bold">Senha</label>
              <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">Esqueci a senha</Link>
            </div>
            <input
              type="password"
              {...register("password")}
              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none ${
                errors.password ? "border-red-500" : ""
              }`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-all shadow-md disabled:bg-gray-400"
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center space-x-4 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
          <Link href="/terms" className="hover:text-primary-600 transition-colors">Termos</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacidade</Link>
        </div>
      </div>
    </div>
  );
}
