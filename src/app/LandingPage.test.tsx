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

  it("renders the footer logo without inversion classes (since footer is white)", () => {
    render(<LandingPage />);
    
    const footer = screen.getByRole("contentinfo");
    // In footer we now only have the logo_texto which has alt="Unum People"
    const footerLogo = footer.querySelector('img[alt="Unum People"]');
    
    expect(footerLogo).toBeInTheDocument();
    expect(footerLogo?.className).not.toContain("brightness-0");
    expect(footerLogo?.className).not.toContain("invert");
  });
});
