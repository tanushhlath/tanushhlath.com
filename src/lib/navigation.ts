import { useLocation, useNavigate } from "react-router-dom";

/** Replaces next/navigation's usePathname(). */
export function usePathname(): string {
  return useLocation().pathname;
}

/** Replaces next/navigation's useRouter() — same push/replace/back shape. */
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
  };
}
