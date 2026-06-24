"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
