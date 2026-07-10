"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import TermsModal from "./TermsModal";
import ServiceAgreementGate from "./ServiceAgreementGate";
import ServiceAgreementWaiting from "./ServiceAgreementWaiting";
import { ServiceAgreementService, ServiceAgreementStatusResponse } from "@/services/api";
import { AnimatePresence } from "framer-motion";
import { redirectToHostedUI } from "@/lib/pkce";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, session, logout } = useAuthStore();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [mustAcceptTerms, setMustAcceptTerms] = useState(false);
  const [agreementStatus, setAgreementStatus] = useState<ServiceAgreementStatusResponse | null>(null);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => unsub();
  }, []);

  const publicPaths = ["/", "/privacy", "/terms", "/auth/callback"];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (isHydrated) {
      // Verificar se o caminho é público
      if (!isPublicPath) {
        if (!isAuthenticated || !session?.token) {
          void redirectToHostedUI(pathname);
          return;
        }

        // 3. Validação de expiração do Token
        try {
          const decoded: any = jwtDecode(session.token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            console.warn("Sessão expirada. Redirecionando...");
            logout();
            void redirectToHostedUI(pathname);
            return;
          }
        } catch (err) {
          logout();
          void redirectToHostedUI(pathname);
          return;
        }

        // 4. Verificação de Consentimento LGPD (localStorage)
        if (session?.email) {
          const accepted = localStorage.getItem(`terms-accepted-${session.email}`);
          if (!accepted) {
            setMustAcceptTerms(true);
          } else {
            setMustAcceptTerms(false);
          }
        }
      } else {
        // Se estiver em rota pública, não forçar modal
        setMustAcceptTerms(false);
      }
    }
  }, [isHydrated, isAuthenticated, session, pathname, isPublicPath, logout]);

  // SUG-8 (/local-review): a busca do Termo de Contratação de Serviço vive
  // num efeito à parte, sem `pathname`/`session`/`router` nas deps (só o que
  // realmente muda o resultado) — evita refazer a chamada de API a cada troca
  // de rota dentro da área autenticada (alinhado ao padrão já usado no
  // blog-admin). Independente do consentimento LGPD acima (gate separado, ver
  // HANDOFF-fase5.md). O backend decide can_accept a partir do papel real do
  // JWT; o frontend nunca infere. Fail-closed: se a busca falhar, tratamos
  // como pendente/sem permissão de aceite (tela de espera) em vez de liberar
  // o acesso — nunca assumir "sem gate" só porque não conseguimos confirmar
  // o status.
  useEffect(() => {
    if (!isHydrated) return;

    if (isPublicPath || !isAuthenticated) {
      setAgreementStatus(null);
      return;
    }

    ServiceAgreementService.getMyStatus()
      .then(setAgreementStatus)
      .catch(() => setAgreementStatus({
        status: 'pendente',
        term_name: '',
        required_version: 0,
        document_url: '',
        can_accept: false,
      }));
  }, [isHydrated, isAuthenticated, isPublicPath]);

  // SUG-3 (/local-review): quem vê ServiceAgreementWaiting não é quem aceita
  // (é o TenantAdmin, em outra sessão/dispositivo) — sem polling, a tela só
  // desbloqueava com um F5 manual depois do aceite acontecer em outro lugar.
  const isWaitingForAgreement = agreementStatus?.status === 'pendente' && agreementStatus.can_accept === false;
  useEffect(() => {
    if (!isWaitingForAgreement) return;

    const intervalId = setInterval(() => {
      ServiceAgreementService.getMyStatus()
        .then(setAgreementStatus)
        .catch(() => {});
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isWaitingForAgreement]);

  // BUG DE PRODUÇÃO (2026-07): sem essa trava, `children` sempre renderizava
  // assim que hidratado, mesmo sem sessão válida em rota privada — em rotas
  // que não existem mais (ex.: a extinta /login), isso deixava o 404 real do
  // Next.js visível enquanto o redirect assíncrono pro Hosted UI ainda não
  // completava (mesmo padrão já usado no AuthGuard do blog-admin).
  if (!isHydrated || (!isPublicPath && (!isAuthenticated || !session?.token))) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div role="status" className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {mustAcceptTerms && session?.email && (
          <TermsModal
            email={session.email}
            onAccept={() => setMustAcceptTerms(false)}
          />
        )}
      </AnimatePresence>
      {agreementStatus?.status === "pendente" && (
        agreementStatus.can_accept ? (
          <ServiceAgreementGate
            status={agreementStatus}
            onAccepted={() => setAgreementStatus((prev) => (prev ? { ...prev, status: "aceito" } : prev))}
          />
        ) : (
          <ServiceAgreementWaiting />
        )
      )}
    </>
  );
}
