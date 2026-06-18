"use client";

import { useState } from "react";

/**
 * Shows a short preview of a long text block with a "Leer más" toggle so the
 * page is not a wall of text. Short texts render fully with no button.
 */
export function ExpandableText({
  text,
  className = "",
  clampClass = "line-clamp-5",
  threshold = 260,
}: {
  text: string;
  className?: string;
  clampClass?: string;
  threshold?: number;
}) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > threshold;

  return (
    <div>
      <p className={`${className} ${!open && isLong ? clampClass : ""}`}>{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2 text-[13px] font-bold text-honduras-red hover:underline"
        >
          {open ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  );
}
