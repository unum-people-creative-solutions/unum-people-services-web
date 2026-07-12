import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AuthGuard from "./AuthGuard";
import { useAuthStore } from "@/store/authStore";
import { usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { redirectToHostedUI } from "@/lib/pkce";

// Mocks
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: Object.assign(vi.fn(), {
    persist: {
      onFinishHydration: vi.fn(),
      hasHydrated: vi.fn(),
    },
  }),
}));

vi.mock("./PendingTermsGate", () => ({
  default: () => <div data-testid="pending-terms-gate" />,
}));

vi.mock("@/lib/pkce", () => ({
  redirectToHostedUI: vi.fn(async () => {}),
}));

describe("AuthGuard", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    (usePathname as any).mockReturnValue("/dashboard");

    // Mock default persist behavior (already hydrated)
    (useAuthStore.persist.hasHydrated as any).mockReturnValue(true);
    (useAuthStore.persist.onFinishHydration as any).mockReturnValue(() => {});

    // Mock default jwt-decode behavior (valid token)
    (jwtDecode as any).mockReturnValue({ exp: Date.now() / 1000 + 10000 });

    // Default store state
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      session: { token: "valid-token", email: "test@example.com" },
      logout: mockLogout,
    });
  });

  it("deve exibir spinner de carregamento quando não hidratado", () => {
    (useAuthStore.persist.hasHydrated as any).mockReturnValue(false);

    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    );

    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
  });

  it("deve renderizar children se o usuário estiver autenticado em rota privada", async () => {
    render(
      <AuthGuard>
        <div data-testid="child-content">Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });

  it("deve renderizar children em rotas públicas sem autenticação", async () => {
    (usePathname as any).mockReturnValue("/");
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      session: null,
      logout: mockLogout,
    });

    render(
      <AuthGuard>
        <div data-testid="child-content">Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });

  describe("TASK-FE-CRM-001 — Redirect para o Hosted UI (Cognito)", () => {
    it("aciona redirectToHostedUI com o pathname atual se não autenticado em rota privada — nunca mais /login interno", async () => {
      (usePathname as any).mockReturnValue("/dashboard");
      (useAuthStore as any).mockReturnValue({
        isAuthenticated: false,
        session: null,
        logout: mockLogout,
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(redirectToHostedUI).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("nunca renderiza children em rota privada sem sessão válida — evita expor o 404 por trás enquanto o redirect está em andamento", async () => {
      (useAuthStore as any).mockReturnValue({
        isAuthenticated: false,
        session: null,
        logout: mockLogout,
      });

      render(
        <AuthGuard>
          <div data-testid="pagina-404-real">Página não encontrada</div>
        </AuthGuard>
      );

      expect(screen.queryByTestId("pagina-404-real")).not.toBeInTheDocument();
    });

    it("aciona redirectToHostedUI se o token estiver expirado", async () => {
      const expiredTime = Date.now() / 1000 - 1000;
      (jwtDecode as any).mockReturnValue({ exp: expiredTime });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(redirectToHostedUI).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("aciona redirectToHostedUI se a decodificação do token falhar", async () => {
      (jwtDecode as any).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(redirectToHostedUI).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  describe("PendingTermsGate integration", () => {
    it("deve exibir PendingTermsGate em rotas privadas autenticadas", async () => {
      (usePathname as any).mockReturnValue("/dashboard");
      render(
        <AuthGuard>
          <div data-testid="child-content">Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pending-terms-gate")).toBeInTheDocument();
      });
    });

    it("não deve exibir PendingTermsGate em rotas públicas", async () => {
      (usePathname as any).mockReturnValue("/");
      (useAuthStore as any).mockReturnValue({
        isAuthenticated: false,
        session: null,
        logout: mockLogout,
      });

      render(
        <AuthGuard>
          <div data-testid="child-content">Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.queryByTestId("pending-terms-gate")).not.toBeInTheDocument();
      });
    });
  });
});
