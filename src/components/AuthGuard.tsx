"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import PendingTermsGate from "./PendingTermsGate";
import { redirectToHostedUI } from "@/lib/pkce";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, session, logout } = useAuthStore();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);


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
      {!isPublicPath && isAuthenticated && <PendingTermsGate />}
    </>
  );
}
