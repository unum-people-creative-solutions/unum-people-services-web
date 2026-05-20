"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import TermsModal from "./TermsModal";
import { AnimatePresence } from "framer-motion";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, session, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [mustAcceptTerms, setMustAcceptTerms] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    const publicPaths = ["/", "/login", "/forgot-password", "/privacy", "/terms"];
    
    if (isHydrated) {
      // 1. Redirecionar usuário logado se tentar acessar login
      if (pathname === "/login" && isAuthenticated && session?.token) {
        router.push("/kanban");
        return;
      }

      // 2. Verificar se o caminho é público
      if (!publicPaths.includes(pathname)) {
        if (!isAuthenticated || !session?.token) {
          router.push("/login");
          return;
        }

        // 3. Validação de expiração do Token
        try {
          const decoded: any = jwtDecode(session.token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            console.warn("Sessão expirada. Redirecionando...");
            logout();
            router.push("/login");
            return;
          }
        } catch (err) {
          logout();
          router.push("/login");
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
  }, [isHydrated, isAuthenticated, session, pathname, router, logout]);

  if (!isHydrated) {
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
    </>
  );
}
