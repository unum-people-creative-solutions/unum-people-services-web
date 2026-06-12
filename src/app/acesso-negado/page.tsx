"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-brand-blue text-center flex flex-col items-center">
        <div className="bg-red-50 p-4 rounded-full mb-6">
          <ShieldAlert className="text-red-600 w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-black text-brand-blue mb-4 tracking-tight">
          Acesso Negado
        </h1>
        
        <p className="text-support-grey mb-8 text-sm">
          Você não tem permissão para acessar esta página ou recurso. Se isso for um erro, entre em contato com o administrador.
        </p>
        
        <Link
          href="/kanban"
          className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 px-6 rounded-md transition-colors shadow-md text-sm block"
        >
          Voltar ao Kanban
        </Link>
      </div>
    </div>
  );
}
