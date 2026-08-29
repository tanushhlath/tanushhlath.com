import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";

/**
 * Thin wrapper so every call site can keep writing `href=` (the API every
 * component already used under Next.js) instead of react-router's `to=`.
 * This is the only reason this file exists — swap the import, keep the JSX.
 */
export interface LinkProps extends Omit<RouterLinkProps, "to"> {
  href: string;
}

export default function Link({ href, ...props }: LinkProps) {
  return <RouterLink to={href} {...props} />;
}
