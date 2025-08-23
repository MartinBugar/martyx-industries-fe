import React, {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import "./Navbar.css";
import {Link, NavLink, useNavigate, useLocation} from "react-router-dom";

/**
 * MARTYX "Metal" Navbar – fully responsive with hamburger mobile drawer.
 * - Desktop (>=1024px): links + search + auth + cart
 * - Mobile: hamburger opens drawer with search + links + auth
 */

type NavItem = { label: string; href: string };
type User = { id: string; name?: string; avatarUrl?: string };
type Props = {
    cartCount?: number;
    onSearchSubmit?: (q: string) => void;
    user?: User | null;
    onLogout?: () => Promise<void> | void;
};

const LINKS: NavItem[] = [
    {label: "Home", href: "/"},
    {label: "Products", href: "/products"},
    {label: "About", href: "/about"},
];

export default function Navbar({cartCount = 0, onSearchSubmit, user, onLogout}: Props) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [q, setQ] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const drawerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const prevBodyPrRef = useRef<string | undefined>(undefined);


    /** Lock body scroll when drawer open with visual compensation for scrollbar width */
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return;

        const body = document.body;
        const docEl = document.documentElement;
        // Scrollbar width = window innerWidth - document content width
        const sbw = window.innerWidth - docEl.clientWidth;

        body.classList.toggle("mi-lock-scroll", drawerOpen);

        if (drawerOpen) {
            // save previous padding-right to restore later
            prevBodyPrRef.current = body.style.paddingRight;
            body.style.paddingRight = `${sbw}px`; // visual compensation
        } else {
            body.style.paddingRight = prevBodyPrRef.current ?? "";
            prevBodyPrRef.current = undefined;
        }

        return () => {
            body.classList.remove("mi-lock-scroll");
            body.style.paddingRight = prevBodyPrRef.current ?? "";
            prevBodyPrRef.current = undefined;
        };
    }, [drawerOpen]);

    /** Esc closes; click on overlay closes */
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setDrawerOpen(false);
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname]);

    const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === drawerRef.current) setDrawerOpen(false);
    }, []);

    const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

    const handleToggleDrawer = useCallback(() => setDrawerOpen(v => !v), []);

    const onChangeQ = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value), []);

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

    const submitSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const query = q.trim();
        if (!query) return;
        (onSearchSubmit ?? ((qq: string) =>
                navigate(`/search?q=${encodeURIComponent(qq)}`)
        ))(query);
        setDrawerOpen(false);
    }, [q, onSearchSubmit, navigate]);

    const fallbackLogout = useCallback(() => {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("auth:user");
        } catch {
            /* ignore */
        }
        navigate("/login");
    }, [navigate]);

    const doLogout = useCallback(async () => {
        try {
            await (onLogout ?? fallbackLogout)();
        } finally {
            setDrawerOpen(false);
        }
    }, [onLogout, fallbackLogout]);

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
                                type="search"
                                placeholder="Search models…"
                                ref={searchInputRef}
                                value={q}
                                onChange={onChangeQ}
                            />
                        </div>
                    </form>

                    <button
                        type="button"
                        className="mi-closebtn"
                        aria-label="Close menu"
                        onClick={handleCloseDrawer}
                    >
                        <span className="mi-x" aria-hidden="true">×</span>
                    </button>
                </div>

                {/* Links */}
                {LINKS.map((l) => (
                    <NavLink
                        key={l.href}
                        to={l.href}
                        end
                        className={({isActive}) => `mi-drawer__link${isActive ? " is-active" : ""}`}
                        onClick={handleCloseDrawer}
                    >
                        {l.label}
                    </NavLink>
                ))}

                {/* Auth / User actions (mobile drawer) */}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {!user ? (
                    <>
                      <Link className="mi-btn mi-btn--ghost" to="/login" style={{ flex: 1 }} onClick={handleCloseDrawer}>
                        Login
                      </Link>
                      <Link className="mi-btn mi-btn--primary" to="/register" style={{ flex: 1 }} onClick={handleCloseDrawer}>
                        Register
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link className="mi-btn mi-btn--ghost" to="/account" style={{ flex: 1 }} onClick={handleCloseDrawer}>
                        Account
                      </Link>
                      <button type="button" className="mi-btn mi-btn--ghost" style={{ flex: 1 }} onClick={doLogout}>
                        Logout
                      </button>
                    </>
                  )}
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
                        <Link to="/" className="mi-brand" aria-label="Martyx Industries">
                            <MILogo/>
                            <span className="mi-brand__text">MARTYX INDUSTRIES</span>
                        </Link>

                        {/* Primary links (desktop) */}
                        <ul className="mi-links mi-desktop">
                            {LINKS.map((l) => (
                                <li key={l.href}>
                                    <NavLink
                                        to={l.href}
                                        end
                                        className={({isActive}) => `mi-link${isActive ? " is-active" : ""}`}
                                    >
                                        {l.label}
                                    </NavLink>
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
                                        type="search"
                                        name="q"
                                        placeholder="Search models…"
                                        autoComplete="off"
                                        value={q}
                                        onChange={onChangeQ}
                                    />
                                </div>
                            </form>

                            {/* Auth / User (desktop) */}
                            {!user ? (
                                <>
                                    <Link to="/login" className="mi-btn mi-btn--ghost mi-desktop">Login</Link>
                                    <Link to="/register" className="mi-btn mi-btn--primary mi-desktop">Register</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/account" className="mi-iconbtn mi-desktop" aria-label="Account">
                                        <UserIcon />
                                    </Link>
                                    <button type="button" className="mi-btn mi-btn--ghost mi-desktop" onClick={doLogout}>
                                        Logout
                                    </button>
                                </>
                            )}

                            {/* Cart (always visible) */}
                            <Link to="/cart" className="mi-iconbtn" aria-label="Cart">
                                <CartIcon/>
                                {cartCount > 0 && <span className="mi-badge" aria-live="polite">{cartCount}</span>}
                                <span className="visually-hidden">Open cart</span>
                            </Link>

                            {/* MOBILE: hamburger (bez SVG/pseudo) */}
                            <button
                                className="mi-iconbtn mi-mobile"
                                aria-expanded={drawerOpen}
                                aria-controls="nav-drawer"
                                aria-label={drawerOpen ? "Close menu" : "Open menu"}
                                onClick={handleToggleDrawer}
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
const MILogo = React.memo(function MILogo() {
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
});

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="m21 21-4.3-4.3"/>
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
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
