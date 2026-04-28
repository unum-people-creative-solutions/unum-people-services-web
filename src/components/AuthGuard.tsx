"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, session, logout } = useAuthStore();
  const router = useRouter();
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

  useEffect(() => {
    const publicPaths = ["/login", "/forgot-password"];
    
    if (isHydrated && !publicPaths.includes(pathname)) {
      if (!isAuthenticated || !session?.token) {
        router.push("/login");
        return;
      }

      // Validação de expiração do Token
      try {
        const decoded: any = jwtDecode(session.token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          console.warn("Sessão expirada. Redirecionando...");
          logout();
          router.push("/login");
        }
      } catch (err) {
        logout();
        router.push("/login");
      }
    }
  }, [isHydrated, isAuthenticated, session, pathname, router, logout]);

  if (!isHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
