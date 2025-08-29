import React, { useEffect, useRef, useState } from "react";
import { ordersService } from "../services/ordersService";
import { mapDownloadError } from "../utils/downloadErrors";
import type { ProductLink } from "../helpers/downloads";

type Props = {
  links: ProductLink[];
  allUrl?: string | null;
  onError?: (msg: string) => void;
};

export const DownloadDropdown: React.FC<Props> = ({ links, allUrl, onError }) => {
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleClick = async (url: string, label: string, key: string) => {
    try {
      setBusyKey(key);
      const ok = await ordersService.downloadByUrl(url, label);
      if (!ok) onError?.("Failed to download file.");
    } catch (e) {
      onError?.(mapDownloadError(e));
    } finally {
      setBusyKey(null);
      setOpen(false);
    }
  };

  const triggerLabel =
    links.length > 1
      ? `Download products (${links.length})`
      : `Download ${links[0]?.label?.replace(/^Download\s*/i, "").trim() || "product"}`;

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="download-button dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {triggerLabel}
        <span className="chevron" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="dropdown-menu" role="menu">
          {allUrl && links.length > 1 && (
            <button
              type="button"
              role="menuitem"
              className="dropdown-item"
              onClick={() => handleClick(allUrl, "all-products", "all")}
              disabled={busyKey === "all"}
            >
              {busyKey === "all" ? "Downloading…" : "Download all products (ZIP)"}
            </button>
          )}

          {links.map((pl, idx) => (
            <button
              type="button"
              role="menuitem"
              key={`${idx}-${pl.label}`}
              className="dropdown-item"
              onClick={() => handleClick(pl.url, pl.label, String(idx))}
              disabled={busyKey === String(idx)}
            >
              {busyKey === String(idx) ? "Downloading…" : pl.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
