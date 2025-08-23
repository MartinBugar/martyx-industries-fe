import React, {useEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";
import "./Navbar.css";

/**
 * MARTYX "Metal" Navbar – fully responsive with hamburger mobile drawer.
 * - Desktop (>=1024px): links + search + auth + cart
 * - Mobile: hamburger opens drawer with search + links + auth
 */

type NavLink = { label: string; href: string };
type Props = {
    cartCount?: number;
    activePath?: string;                 // optional; falls back to location.pathname
    onSearchSubmit?: (q: string) => void;
};

const LINKS: NavLink[] = [
    {label: "Home", href: "/"},
    {label: "Products", href: "/products"},
    {label: "About", href: "/about"},
];

export default function Navbar({cartCount = 0, activePath, onSearchSubmit}: Props) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [q, setQ] = useState("");
    const drawerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const currentPath = useMemo(
        () => activePath ?? (typeof window !== "undefined" ? window.location.pathname : ""),
        [activePath]
    );

    /** Lock body scroll when drawer open (via class) */
    useEffect(() => {
        if (typeof document === "undefined") return;
        document.body.classList.toggle("mi-lock-scroll", drawerOpen);
        return () => document.body.classList.remove("mi-lock-scroll");
    }, [drawerOpen]);

    /** Esc closes; click on overlay closes */
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setDrawerOpen(false);
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === drawerRef.current) setDrawerOpen(false);
    }

    /** Basic focus trap inside drawer panel */
    useEffect(() => {
        if (!drawerOpen || !panelRef.current) return;
        const sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(sel))
            .filter(el => !el.hasAttribute("disabled") && el.tabIndex !== -1);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        first?.focus();

        const handler: EventListener = (ev) => {
            const e = ev as KeyboardEvent;
            if (e.key !== "Tab" || focusables.length === 0) return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                (last as HTMLElement | undefined)?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                (first as HTMLElement | undefined)?.focus();
            }
        };
        panelRef.current.addEventListener("keydown", handler);
        return () => panelRef.current?.removeEventListener("keydown", handler);
    }, [drawerOpen]);

    function submitSearch(e: React.FormEvent) {
        e.preventDefault();
        const query = q.trim();
        if (!query) return;
        (onSearchSubmit ?? ((qq) => window.location.assign(`/search?q=${encodeURIComponent(qq)}`)))(query);
        setDrawerOpen(false);
    }

    const Drawer = (
        <div
            id="nav-drawer"
            className={`mi-drawer ${drawerOpen ? "is-open" : ""}`}
            aria-hidden={!drawerOpen}
            onClick={handleOverlayClick}
            ref={drawerRef}
        >
            <div className="mi-drawer__panel mi-panel" role="dialog" aria-modal="true" aria-label="Menu" ref={panelRef}>
                {/* Header: search (vľavo) + close (vpravo) */}
                <div className="mi-drawer__header">
                    <form className="mi-drawer__search" role="search" onSubmit={submitSearch}>
                        <div className="mi-panel mi-drawer__searchbox">
                            <SearchIcon/>
                            <input
                                placeholder="Search models…"
                                ref={searchInputRef}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>
                    </form>

                    <button
                        type="button"
                        className="mi-closebtn"
                        aria-label="Close menu"
                        onClick={() => setDrawerOpen(false)}
                    >
                        <span className="mi-close-x" aria-hidden="true"><span></span><span></span></span>
                    </button>
                </div>

                {/* Links */}
                {LINKS.map((l) => (
                    <a
                        key={l.href}
                        className="mi-drawer__link"
                        href={l.href}
                        aria-current={currentPath === l.href ? "page" : undefined}
                        onClick={() => setDrawerOpen(false)}
                    >
                        {l.label}
                    </a>
                ))}

                {/* Auth actions */}
                <div style={{display: "flex", gap: 8, marginTop: 10}}>
                    <a className="mi-btn mi-btn--ghost" href="/login" style={{flex: 1}}>Login</a>
                    <a className="mi-btn mi-btn--primary" href="/register" style={{flex: 1}}>Register</a>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <nav className="mi-nav" role="navigation" aria-label="Primary">
                <div className="mi-container">
                    <div className="mi-nav__bar">
                        {/* Brand */}
                        <a href="/" className="mi-brand" aria-label="Martyx Industries">
                            <MILogo/>
                            <span className="mi-brand__text">MARTYX INDUSTRIES</span>
                        </a>

                        {/* Primary links (desktop) */}
                        <ul className="mi-links mi-desktop">
                            {LINKS.map((l) => (
                                <li key={l.href}>
                                    <a
                                        className="mi-link"
                                        href={l.href}
                                        aria-current={currentPath === l.href ? "page" : undefined}
                                    >
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>

                        {/* Right actions */}
                        <div className="mi-actions">
                            {/* Search (desktop) */}
                            <form className="mi-search mi-desktop" role="search" aria-label="Site search"
                                  onSubmit={submitSearch}>
                                <div className="mi-panel">
                                    <SearchIcon/>
                                    <input
                                        name="q"
                                        placeholder="Search models…"
                                        autoComplete="off"
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                    />
                                </div>
                            </form>

                            {/* Auth (desktop) */}
                            <a href="/login" className="mi-btn mi-btn--ghost mi-desktop">Login</a>
                            <a href="/register" className="mi-btn mi-btn--primary mi-desktop">Register</a>

                            {/* Cart (always visible) */}
                            <a href="/cart" className="mi-iconbtn" aria-label="Cart">
                                <CartIcon/>
                                {cartCount > 0 && <span className="mi-badge" aria-live="polite">{cartCount}</span>}
                                <span className="visually-hidden">Open cart</span>
                            </a>

                            {/* MOBILE: hamburger (bez SVG/pseudo) */}
                            <button
                                className="mi-iconbtn mi-mobile"
                                aria-expanded={drawerOpen}
                                aria-controls="nav-drawer"
                                aria-label="Open menu"
                                onClick={() => setDrawerOpen(v => !v)}
                            >
  <span className="mi-menu-bars" aria-hidden="true">
    <span></span><span></span><span></span>
  </span>
                            </button>
                        </div>
                    </div>
                </div>

            </nav>
            {typeof document !== "undefined" ? createPortal(Drawer, document.body) : null}
        </>
    );
}

/* ===== Inline SVG icons ===== */
function MILogo() {
    return (
        <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="url(#g-mi)" stroke="rgba(255,255,255,.12)"/>
            <path d="M8 23V9h4l4 7 4-7h4v14h-4v-8l-4 7-4-7v8H8z" fill="var(--accent)"/>
            <defs>
                <linearGradient id="g-mi" x1="0" y1="0" x2="0" y2="32">
                    <stop stopColor="#1b232b"/>
                    <stop offset="1" stopColor="#12181f"/>
                </linearGradient>
            </defs>
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="m21 21-4.3-4.3"/>
        </svg>
    );
}

function CartIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             aria-hidden="true">
            <circle cx="10" cy="20" r="1"/>
            <circle cx="18" cy="20" r="1"/>
            <path d="M2 3h2l2.4 12.3A2 2 0 0 0 8.8 17h8.9a2 2 0 0 0 2-1.6L22 7H6"/>
        </svg>
    );
}
