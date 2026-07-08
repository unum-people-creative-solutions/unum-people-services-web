"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ServiceAgreementWaiting() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleBackToLogin = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Aguardando aceite do Termo de Contratação</h2>
        <p className="text-sm text-gray-600">
          O administrador da sua conta ainda não aceitou o Termo de Contratação de Serviço. Assim que isso
          acontecer, você poderá continuar normalmente.
        </p>
        <button
          onClick={handleBackToLogin}
          className="mt-6 text-sm font-semibold text-primary-600 underline hover:text-primary-700"
        >
          Sair e voltar para o login
        </button>
      </div>
    </div>
  );
}
