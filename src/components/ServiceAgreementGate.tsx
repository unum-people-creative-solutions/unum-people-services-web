"use client";

import { useState } from "react";
import { ServiceAgreementService, ServiceAgreementStatusResponse } from "@/services/api";

interface ServiceAgreementGateProps {
  status: ServiceAgreementStatusResponse;
  onAccepted: () => void;
}

export default function ServiceAgreementGate({ status, onAccepted }: ServiceAgreementGateProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await ServiceAgreementService.accept(status.required_version);
      onAccepted();
    } catch (err: any) {
      // Nunca fecha o gate silenciosamente — só um 200 confirmado libera o acesso.
      setError(
        err?.response?.data?.error ||
        "Não foi possível registrar o aceite. Verifique sua conexão e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-8">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Termo de Contratação de Serviço</h2>
        <p className="text-sm text-gray-600 mb-4">
          Para continuar utilizando o sistema, revise e aceite o Termo de Contratação referente ao pacote
          contratado: <strong>{status.term_name}</strong>.
        </p>
        <a
          href={status.document_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 text-sm font-semibold underline"
        >
          Ler o Termo de Contratação completo
        </a>

        <div className="flex items-start gap-2 mt-6">
          <input
            type="checkbox"
            id="accept-service-agreement"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="accept-service-agreement" className="text-sm text-gray-700">
            Li e concordo com o Termo de Contratação de Serviço acima.
          </label>
        </div>

        {error && (
          <p role="alert" className="text-red-600 text-sm mt-3">{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={!checked || loading}
          className="w-full mt-6 bg-primary-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Processando..." : "Concordar e Continuar"}
        </button>
      </div>
    </div>
  );
}
