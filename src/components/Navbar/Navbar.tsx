import React, {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import "./Navbar.css";
import {Link, NavLink, useNavigate, useLocation} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWishlist } from "../../context/WishlistContext";
import LanguageSwitcher from "../LanguageSwitcher";
import MiniCart from "../MiniCart/MiniCart";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import SearchSuggestions from "../SearchSuggestions/SearchSuggestions";
const miLogo = "/logo/logo.png";

/**
 * MARTYX "Metal" Navbar – fully responsive with hamburger mobile drawer.
 * - Desktop (>=1024px): links + search + auth + cart
 * - Mobile: hamburger opens drawer with search + links + auth
 */

type NavItem = { labelKey: string; href: string };
type User = { id: string; name?: string; avatarUrl?: string };
type Props = {
    cartCount?: number;
    onSearchSubmit?: (q: string) => void;
    user?: User | null;
    onLogout?: () => Promise<void> | void;
};

const LINKS: NavItem[] = [
    {labelKey: "nav:home", href: "/"},
    {labelKey: "nav:products", href: "/products"},
    {labelKey: "nav:gallery", href: "/gallery"},
    {labelKey: "nav:about", href: "/about"},
    {labelKey: "nav:contact", href: "/contact"},
];

export default function Navbar({cartCount = 0, onSearchSubmit, user, onLogout}: Props) {
    const { t } = useTranslation(['nav', 'common', 'search']);
    const { items: wishlistItems } = useWishlist();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [miniCartOpen, setMiniCartOpen] = useState(false);
    const navigate = useNavigate();

    // Search suggestions hook
    const {
        query: q,
        setQuery: setQ,
        suggestions,
        isLoading: suggestionsLoading,
        isOpen: suggestionsOpen,
        setIsOpen: setSuggestionsOpen,
        clearSuggestions,
        selectedIndex,
        handleKeyDown: handleSuggestionsKeyDown,
    } = useSearchSuggestions({ debounceMs: 300, minChars: 2, maxResults: 5 });
    const location = useLocation();
    const drawerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const prevBodyPrRef = useRef<string | undefined>(undefined);
    const cartButtonRef = useRef<HTMLButtonElement>(null);

    /** Add hydrated class to enable transitions after React hydration */
    useEffect(() => {
        document.documentElement.classList.add("hydrated");
        return () => document.documentElement.classList.remove("hydrated");
    }, []);

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

    // Close drawer and minicart on route change
    useEffect(() => {
        setDrawerOpen(false);
        setMiniCartOpen(false);
    }, [location.pathname]);

    const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === drawerRef.current) setDrawerOpen(false);
    }, []);

    const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

    const handleToggleDrawer = useCallback(() => setDrawerOpen(v => !v), []);

    const onChangeQ = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value), [setQ]);

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
        clearSuggestions();
        (onSearchSubmit ?? ((qq: string) =>
                navigate(`/products?search=${encodeURIComponent(qq)}`)
        ))(query);
        setDrawerOpen(false);
    }, [q, onSearchSubmit, navigate, clearSuggestions]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback((suggestion: { slug: string }) => {
        clearSuggestions();
        navigate(`/product/${suggestion.slug}`);
        setDrawerOpen(false);
    }, [navigate, clearSuggestions]);

    // Handle keyboard navigation in search
    const onSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
        const selected = handleSuggestionsKeyDown(e);
        if (selected) {
            handleSuggestionSelect(selected);
        }
    }, [handleSuggestionsKeyDown, handleSuggestionSelect]);

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

    const handleToggleMiniCart = useCallback(() => {
        setMiniCartOpen(prev => !prev);
    }, []);

    const handleCloseMiniCart = useCallback(() => {
        setMiniCartOpen(false);
    }, []);

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
                                placeholder={t('nav:search_placeholder')}
                                ref={searchInputRef}
                                value={q}
                                onChange={onChangeQ}
                            />
                        </div>
                    </form>

                    <button
                        type="button"
                        className="mi-closebtn"
                        aria-label={t('nav:close_menu')}
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
                        {t(l.labelKey)}
                    </NavLink>
                ))}

                {/* Quick actions (mobile drawer) */}
                <div className="mi-drawer-quick-actions">
                  <Link
                    to="/wishlist"
                    className="mi-btn mi-btn--ghost mi-drawer-action-btn"
                    onClick={handleCloseDrawer}
                  >
                    <WishlistIcon/>
                    {t('nav:wishlist', 'Wishlist')}
                    {wishlistItems.length > 0 && <span className="mi-badge">{wishlistItems.length}</span>}
                  </Link>
                  <Link
                    to="/cart"
                    className="mi-btn mi-btn--ghost mi-drawer-action-btn"
                    onClick={handleCloseDrawer}
                  >
                    <CartIcon/>
                    {t('nav:cart')}
                    {cartCount > 0 && <span className="mi-badge">{cartCount}</span>}
                  </Link>
                </div>

                {/* Auth / User actions (mobile drawer) */}
                <div className="mi-drawer-auth-actions">
                  {!user ? (
                    <>
                      <Link className="mi-btn mi-btn--ghost mi-drawer-btn-flex" to="/login" onClick={handleCloseDrawer}>
                        {t('nav:sign_in')}
                      </Link>
                      <Link className="mi-btn mi-btn--primary mi-drawer-btn-flex" to="/register" onClick={handleCloseDrawer}>
                        {t('nav:sign_up')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link className="mi-btn mi-btn--ghost mi-drawer-btn-flex" to="/account" onClick={handleCloseDrawer}>
                        {t('nav:account')}
                      </Link>
                      <button type="button" className="mi-btn mi-btn--ghost mi-drawer-btn-flex" onClick={doLogout}>
                        {t('nav:sign_out')}
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
                            <img src={miLogo} alt="Martyx Industries logo" className="mi-brand__logo" />
                            <span className="mi-brand__text">
                                <span className="mi-brand__line">MARTYX </span>
                                <span className="mi-brand__line">INDUSTRIES</span>
                            </span>
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
                                        {t(l.labelKey)}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>

                        {/* Right actions */}
                        <div className="mi-actions">
                            {/* Search (desktop) with suggestions */}
                            <div className="mi-search-wrapper mi-desktop">
                                <form className="mi-search" role="search" aria-label={t('nav:search')}
                                      onSubmit={submitSearch}>
                                    <div className="mi-panel">
                                        <SearchIcon/>
                                        <input
                                            type="search"
                                            name="q"
                                            placeholder={t('nav:search_placeholder')}
                                            autoComplete="off"
                                            value={q}
                                            onChange={onChangeQ}
                                            onKeyDown={onSearchKeyDown}
                                            onFocus={() => q.length >= 2 && suggestions.length > 0 && setSuggestionsOpen(true)}
                                            aria-expanded={suggestionsOpen}
                                            aria-controls="search-suggestions"
                                            aria-autocomplete="list"
                                        />
                                    </div>
                                </form>
                                <SearchSuggestions
                                    suggestions={suggestions}
                                    isOpen={suggestionsOpen}
                                    isLoading={suggestionsLoading}
                                    selectedIndex={selectedIndex}
                                    onSelect={handleSuggestionSelect}
                                    onClose={clearSuggestions}
                                    query={q}
                                />
                            </div>

                            {/* Auth / User (desktop) */}
                            {!user ? (
                                <>
                                    <Link to="/login" className="mi-btn mi-btn--ghost mi-desktop">{t('nav:sign_in')}</Link>
                                    <Link to="/register" className="mi-btn mi-btn--primary mi-desktop">{t('nav:sign_up')}</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/account" className="mi-iconbtn mi-desktop" aria-label={t('nav:account')}>
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt="User avatar"
                                                className="mi-user-avatar"
                                            />
                                        ) : (
                                            <UserIcon />
                                        )}
                                    </Link>
                                    <button type="button" className="mi-btn mi-btn--ghost mi-desktop" onClick={doLogout}>
                                        {t('nav:sign_out')}
                                    </button>
                                </>
                            )}

                            {/* Language Switcher */}
                            <LanguageSwitcher />

                            {/* Wishlist */}
                            <Link to="/wishlist" className="mi-iconbtn" aria-label={t('nav:wishlist', 'Wishlist')}>
                                <WishlistIcon/>
                                {wishlistItems.length > 0 && <span className="mi-badge" aria-live="polite">{wishlistItems.length}</span>}
                                <span className="visually-hidden">{t('nav:wishlist', 'Wishlist')}</span>
                            </Link>

                            {/* Cart with MiniCart dropdown (desktop) */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    ref={cartButtonRef}
                                    type="button"
                                    className="mi-iconbtn"
                                    style={{ cursor: 'pointer' }}
                                    aria-label={t('nav:cart')}
                                    aria-expanded={miniCartOpen}
                                    onClick={handleToggleMiniCart}
                                >
                                    <CartIcon/>
                                    {cartCount > 0 && <span className="mi-badge" aria-live="polite">{cartCount}</span>}
                                    <span className="visually-hidden">{t('nav:cart')}</span>
                                </button>
                                <MiniCart
                                    isOpen={miniCartOpen}
                                    onClose={handleCloseMiniCart}
                                    anchorRef={cartButtonRef}
                                />
                            </div>

                            {/* MOBILE: hamburger (bez SVG/pseudo) */}
                            <button
                                className="mi-iconbtn mi-mobile"
                                aria-expanded={drawerOpen}
                                aria-controls="nav-drawer"
                                aria-label={drawerOpen ? t('nav:close_menu') : t('nav:toggle_navigation')}
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

function WishlistIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    );
}

function CartIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10" cy="20" r="1"/>
            <circle cx="18" cy="20" r="1"/>
            <path d="M2 3h2l2.4 12.3A2 2 0 0 0 8.8 17h8.9a2 2 0 0 0 2-1.6L22 7H6"/>
        </svg>
    );
}
