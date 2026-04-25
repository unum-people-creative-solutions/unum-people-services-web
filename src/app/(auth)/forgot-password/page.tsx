"use client";

import { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "@/lib/cognito";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: Code/Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const getCognitoUser = () => {
    return new CognitoUser({
      Username: email,
      Pool: userPool,
    });
  };

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cognitoUser = getCognitoUser();

    cognitoUser.forgotPassword({
      onSuccess: () => {
        setStep(2);
        setLoading(false);
      },
      onFailure: (err) => {
        setError(err.message || "Erro ao solicitar código");
        setLoading(false);
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cognitoUser = getCognitoUser();

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        alert("Senha redefinida com sucesso!");
        router.push("/login");
      },
      onFailure: (err) => {
        setError(err.message || "Erro ao redefinir senha");
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-primary-600">
        <Link href="/login" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar ao Login
        </Link>
        
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Recuperar Senha</h1>
        
        {step === 1 ? (
          <>
            <p className="text-gray-500 text-sm mb-6">Insira seu e-mail para receber um código de verificação.</p>
            <form onSubmit={handleRequestCode} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center">{error}</div>}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white p-3 rounded-md font-bold hover:bg-primary-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? "Enviando..." : "Enviar Código"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">Insira o código enviado para <b>{email}</b> e sua nova senha.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center">{error}</div>}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Código de Verificação</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="6 dígitos"
                  required
                />
              </div>
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
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
