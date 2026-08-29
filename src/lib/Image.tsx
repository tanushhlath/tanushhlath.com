import { cn } from "@/lib/cn";

/**
 * Plain-`<img>` replacement for next/image. No on-the-fly optimization or
 * responsive srcset generation (that required Next's image server) — every
 * source here is already a reasonably-sized local asset, so a plain <img>
 * with lazy loading covers the same real-world behavior. `fill` reproduces
 * the "absolutely fill the positioned parent" pattern every call site here
 * already relies on; `sizes` is accepted and ignored (nothing consumes it
 * without a generated srcset).
 */
export interface ImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export default function Image({
  src,
  alt,
  fill,
  className,
  priority,
  width,
  height,
}: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  );
}
