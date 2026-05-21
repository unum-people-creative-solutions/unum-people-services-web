import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LandingPage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders the footer logo without brightness-0 invert classes", () => {
    render(<LandingPage />);
    
    // Find all images with Unum People Logo alt text
    const logos = screen.getAllByAltText("Unum People Logo");
    
    // The footer logo is usually the second one (first is in nav)
    // But let's check both or find the one in the footer
    const footer = screen.getByRole("contentinfo"); // <footer> usually has role contentinfo
    const footerLogo = footer.querySelector('img[alt="Unum People Logo"]');
    
    expect(footerLogo).toBeInTheDocument();
    expect(footerLogo?.className).not.toContain("brightness-0");
    expect(footerLogo?.className).not.toContain("invert");
  });
});
