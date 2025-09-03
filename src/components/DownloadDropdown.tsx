import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ordersService } from "../services/ordersService";
import { mapDownloadError } from "../utils/downloadErrors";
import type { ProductLink } from "../helpers/downloads";

type Props = {
  links: ProductLink[];
  allUrl?: string | null;
  onError?: (msg: string) => void;
};

export const DownloadDropdown: React.FC<Props> = ({ links, allUrl, onError }) => {
  const { t } = useTranslation(['common', 'products']);
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  // Compute and clamp menu position relative to viewport
  const computePosition = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const baseWidth = Math.max(rect.width, 280);
    let left = rect.left;
    let top = rect.bottom + 8; // gap 8px below button
    // Clamp horizontally to viewport with 8px margin
    const margin = 8;
    if (left + baseWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - baseWidth);
    }
    // If not enough space at bottom, try open upwards
    const estimatedHeight = menuRef.current?.offsetHeight ?? 200;
    if (top + estimatedHeight > window.innerHeight - margin) {
      const upTop = rect.top - 8 - estimatedHeight;
      if (upTop >= margin) top = upTop; // open above
    }
    setMenuStyle({ position: 'fixed', top, left, minWidth: baseWidth, zIndex: 9999 });
  };

  // Close on outside click (consider portal menu as inside)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideWrapper && !insideMenu) setOpen(false);
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

  // Reposition on open, resize, scroll
  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const onWin = () => computePosition();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open]);

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

  const triggerLabel = t('common:download.download_product');

  const Menu = (
    <div
      ref={menuRef}
      className="dropdown-menu"
      role="menu"
      style={menuStyle ?? undefined}
    >
      {allUrl && links.length > 1 && (
        <button
          type="button"
          role="menuitem"
          className="dropdown-item"
          onClick={() => handleClick(allUrl, "all-products", "all")}
          disabled={busyKey === "all"}
        >
          {busyKey === "all" ? t('common:download.downloading') : t('common:download.download_all_products')}
        </button>
      )}

      {links.map((pl, idx) => {
        const displayName = (pl.productName?.trim() || pl.label?.replace(/^Download\s*/i, "").trim() || "product");
        const analyticsLabel = pl.productName?.trim() || pl.label;
        return (
          <button
            type="button"
            role="menuitem"
            key={`${idx}-${pl.label}`}
            className="dropdown-item"
            onClick={() => handleClick(pl.url, analyticsLabel, String(idx))}
            disabled={busyKey === String(idx)}
          >
            {busyKey === String(idx) ? t('common:download.downloading') : displayName}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="dropdown" ref={wrapperRef}>
      <button
        type="button"
        ref={triggerRef}
        className="download-button dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {triggerLabel}
        <span className="chevron" aria-hidden>▾</span>
      </button>

      {open && (createPortal(Menu, document.body))}
    </div>
  );
};
