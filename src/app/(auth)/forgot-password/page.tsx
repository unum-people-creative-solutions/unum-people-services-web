"use client";

import { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "@/lib/cognito";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { z } from "zod";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: Code/Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const getCognitoUser = (userEmail: string) => {
    return new CognitoUser({
      Username: userEmail,
      Pool: userPool,
    });
  };

  const handleRequestCode = (data: ForgotPasswordValues) => {
    setLoading(true);
    setError("");
    setEmail(data.email);

    const cognitoUser = getCognitoUser(data.email);

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

  const handleResetPassword = (data: ResetPasswordValues) => {
    setLoading(true);
    setError("");

    const cognitoUser = getCognitoUser(email);

    cognitoUser.confirmPassword(data.code, data.newPassword, {
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
            <form onSubmit={forgotForm.handleSubmit(handleRequestCode)} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center">{error}</div>}
              <Input
                label="E-mail"
                type="email"
                {...forgotForm.register("email")}
                error={forgotForm.formState.errors.email?.message}
              />
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
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center">{error}</div>}
              <Input
                label="Código de Verificação"
                placeholder="6 dígitos"
                {...resetForm.register("code")}
                error={resetForm.formState.errors.code?.message}
              />
              <Input
                label="Nova Senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...resetForm.register("newPassword")}
                error={resetForm.formState.errors.newPassword?.message}
              />
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
