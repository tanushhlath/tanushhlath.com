import { useState } from "react";
import { motion } from "framer-motion";

export function CopyEmail({ email, className }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <span className="relative inline-block">
      <a
        href={`mailto:${email}`}
        onClick={handleClick}
        data-cursor="view"
        data-cursor-label="Copy"
        className={className}
      >
        {email}
      </a>
      {copied && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-azure px-3 py-1 text-xs text-white"
          role="status"
        >
          Copied
        </motion.span>
      )}
    </span>
  );
}
