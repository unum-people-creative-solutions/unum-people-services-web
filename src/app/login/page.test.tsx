import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import LoginRedirect from "./page";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

describe("/login (rota extinta, migrada pro Cognito Hosted UI)", () => {
  it("redireciona para / em vez de expor o 404 do Next.js", () => {
    render(<LoginRedirect />);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
