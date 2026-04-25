"use client";

import { useState } from "react";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "@/lib/cognito";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userObj, setUserObj] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  const onLoginSuccess = (result: any) => {
    const idToken = result.getIdToken().getJwtToken();
    const decoded: any = jwtDecode(idToken);

    setSession({
      email: decoded.email,
      name: decoded.name || decoded.email,
      tenantId: decoded["custom:tenant_id"],
      role: decoded["cognito:groups"]?.[0] || "USER",
      token: idToken,
    });

    router.push("/kanban");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: onLoginSuccess,
      onFailure: (err) => {
        setError(err.message || "Falha na autenticação");
        setLoading(false);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Desafio de primeiro acesso detectado!
        setUserObj(cognitoUser);
        setIsChangingPassword(true);
        setLoading(false);
      }
    });
  };

  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    userObj.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: onLoginSuccess,
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
          <h1 className="text-2xl font-bold mb-2 text-gray-800 text-center">Bem-vindo(a)!</h1>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-colors disabled:bg-gray-400"
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
        <h1 className="text-3xl font-black mb-8 text-center text-primary-600 tracking-tighter italic">UNUM PEOPLE</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center">{error}</div>}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Acesso</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Usuário ou e-mail"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-700 text-sm font-bold">Senha</label>
              <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline font-medium">Esqueci a senha</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-all shadow-md disabled:bg-gray-400"
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
