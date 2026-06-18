import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Logo from './brand/Logo';

const Navbar = () => {
  const { navLinks } = useCatalog();
  const { getCartItemsCount } = useCart();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = getCartItemsCount();

  const [activeCategory, setActiveCategory] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);

  const lastScrollY = useRef(0);
  const searchInputRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [categoryOverflow, setCategoryOverflow] = useState(false);

  const updateCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;

    const overflow = el.scrollWidth > el.clientWidth + 1;
    setCategoryOverflow(overflow);
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const scrollCategories = useCallback((direction) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 220, behavior: 'smooth' });
  }, []);

  const authLinkState =
    location.pathname === '/login' || location.pathname === '/register'
      ? location.state?.from
        ? { from: location.state.from }
        : null
      : { from: location.pathname + location.search };

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const routeCategory = pathParts[0] === 'videos' ? pathParts[1] : null;

    if (location.pathname === '/') setActiveCategory('home');
    else if (location.pathname === '/support') setActiveCategory('support');
    else if (location.pathname === '/profile') setActiveCategory('profile');
    else if (location.pathname === '/orders') setActiveCategory('orders');
    else if (location.pathname === '/videos') setActiveCategory('videos');
    else if (routeCategory) setActiveCategory(routeCategory);
    else setActiveCategory('');

    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);

    const urlSearch = new URLSearchParams(location.search).get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY.current;

      if (!isMobileMenuOpen && !isSearchOpen) {
        if (scrollingDown && currentY > 80) setIsNavHidden(true);
        else if (!scrollingDown) setIsNavHidden(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen, isSearchOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      const frame = requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [isSearchOpen]);

  useEffect(() => {
    updateCategoryScroll();
    const el = categoryScrollRef.current;
    if (!el) return undefined;

    el.addEventListener('scroll', updateCategoryScroll, { passive: true });
    const resizeObserver = new ResizeObserver(updateCategoryScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateCategoryScroll);
      resizeObserver.disconnect();
    };
  }, [navLinks, updateCategoryScroll]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/videos?search=${encodeURIComponent(trimmed)}`);
    setIsSearchOpen(false);
  }, [navigate, searchQuery]);

  const searchBoxClass =
    'flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 shadow-sm transition focus-within:border-gray-300 focus-within:bg-white focus-within:shadow';

  const renderSearchForm = (formClassName, { onEscape, inputRef } = {}) => (
    <form onSubmit={handleSearch} className={formClassName}>
      <div className={searchBoxClass}>
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          enterKeyHint="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onEscape?.(e);
          }}
          placeholder="Search clips, categories..."
          className="min-w-0 flex-1 border-none bg-transparent py-1.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
    </form>
  );

  const ProfileIcon = ({ className = 'h-5 w-5 sm:h-[22px] sm:w-[22px]' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const OrdersIcon = ({ className = 'h-5 w-5 sm:h-[22px] sm:w-[22px]' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3h6a2 2 0 012 2v1h1a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h1V5a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6h6M8 11h8M8 15h8" />
    </svg>
  );

  const navLinkClass = (isActive) =>
    `whitespace-nowrap text-sm font-semibold tracking-normal transition-colors relative xl:text-[15px] 2xl:text-base ${
      isActive ? 'text-black' : 'text-gray-500 hover:text-black'
    }`;

  const iconBtnClass =
    'inline-flex shrink-0 items-center justify-center rounded-full p-2 text-gray-800 transition hover:bg-gray-100 sm:p-2.5';

  const desktopIconBtnClass =
    'hidden shrink-0 items-center justify-center rounded-full p-2 text-gray-800 transition hover:bg-gray-100 sm:p-2.5 xl:inline-flex';

  const underlineClass = (isActive, color = 'bg-black') =>
    `absolute -bottom-2 left-1/2 h-0.5 -translate-x-1/2 transition-all duration-300 ${
      isActive ? `w-full ${color}` : `w-0 group-hover:w-full ${color}`
    }`;

  const scrollBtnClass =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30';

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isNavHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
      <nav
        className={`border-b py-1 transition-all duration-300 ${
          isScrolled ? 'border-gray-300 bg-white shadow-sm' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8">
          <div className="flex h-11 min-w-0 items-center gap-2 sm:h-12 sm:gap-3 xl:grid xl:grid-cols-[1fr_minmax(0,28rem)_1fr] xl:items-center xl:gap-6 2xl:grid-cols-[1fr_minmax(0,32rem)_1fr]">
            <div className="min-w-0 max-w-[62vw] shrink sm:max-w-[68vw] md:max-w-[50vw] xl:max-w-xs 2xl:max-w-sm">
              <Logo className="w-full" />
            </div>

            {renderSearchForm('hidden w-full xl:block', {
              onEscape: (e) => {
                setSearchQuery('');
                e.currentTarget.blur();
              },
            })}

            <div className="ml-auto flex shrink-0 items-center justify-end gap-0.5 sm:gap-1 md:gap-2 xl:ml-0">
              <button
                type="button"
                onClick={() => setIsSearchOpen((v) => !v)}
                className={`${iconBtnClass} xl:hidden ${isSearchOpen ? 'bg-gray-100' : ''}`}
                aria-label="Toggle search"
                aria-expanded={isSearchOpen}
              >
                <svg className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <Link
                to="/support"
                className={`${desktopIconBtnClass} ${location.pathname === '/support' ? 'bg-gray-100' : ''}`}
                aria-label="Support"
              >
                <svg className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/orders"
                  className={`${desktopIconBtnClass} ${location.pathname === '/orders' ? 'bg-gray-100' : ''}`}
                  aria-label="My orders"
                >
                  <OrdersIcon />
                </Link>
              )}

              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className={`${desktopIconBtnClass} ${location.pathname === '/profile' ? 'bg-gray-100' : ''}`}
                  aria-label="My profile"
                >
                  <ProfileIcon />
                </Link>
              ) : (
                <Link
                  to="/login"
                  state={authLinkState}
                  className={`${desktopIconBtnClass} ${location.pathname === '/login' ? 'bg-gray-100' : ''}`}
                  aria-label="Sign in"
                >
                  <ProfileIcon />
                </Link>
              )}

              <Link to="/cart" className={`${iconBtnClass} relative`} aria-label="Cart">
                <svg className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className={`${iconBtnClass} xl:hidden`}
                aria-label="Open menu"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out xl:hidden ${
              isSearchOpen ? 'max-h-14 pb-2 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {renderSearchForm('flex justify-stretch', {
              onEscape: () => setIsSearchOpen(false),
              inputRef: searchInputRef,
            })}
          </div>
        </div>
      </nav>

      <nav
        className={`hidden border-b bg-white transition-all duration-300 xl:block ${
          isScrolled ? 'border-gray-300 shadow-sm' : 'border-gray-200'
        }`}
        aria-label="Footage categories"
      >
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8">
          <div className="relative flex h-10 items-center gap-2">
            {categoryOverflow ? (
              <button
                type="button"
                onClick={() => scrollCategories(-1)}
                disabled={!canScrollLeft}
                className={scrollBtnClass}
                aria-label="Scroll categories left"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : null}

            <div
              ref={categoryScrollRef}
              className="min-w-0 flex-1 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="mx-auto flex w-max min-w-full items-center justify-center gap-5 px-1 xl:gap-6 2xl:gap-8">
                <div className="group relative flex h-10 shrink-0 items-center">
                  <Link to="/" className={navLinkClass(activeCategory === 'home')}>
                    Home
                    <span className={underlineClass(activeCategory === 'home')} />
                  </Link>
                </div>

                {navLinks.map((link) => (
                  <div key={link.id} className="group relative flex h-10 shrink-0 items-center">
                    <Link to={link.path} className={navLinkClass(activeCategory === link.id)}>
                      {link.label}
                      <span className={underlineClass(activeCategory === link.id)} />
                    </Link>

                    <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:-translate-y-1">
                      <div className="relative grid gap-1 rounded-none border border-gray-100 bg-white p-6 shadow-xl">
                        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-gray-100 bg-white" />
                        <h3 className="mb-2 border-b pb-2 text-xs font-bold tracking-wide text-gray-400">
                          {link.label} Footage
                        </h3>
                        {link.subItems.map((sub) => (
                          <Link
                            key={sub.name}
                            to={sub.path}
                            className="block px-3 py-2 text-sm text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:pl-5 hover:text-black md:text-[15px]"
                          >
                            {sub.name}
                          </Link>
                        ))}
                        <div className="mt-2 border-t border-gray-50 pt-2">
                          <Link to={link.path} className="block px-3 text-xs font-bold text-black underline decoration-gray-300 underline-offset-4 hover:decoration-black">
                            View All {link.label}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {categoryOverflow ? (
              <button
                type="button"
                onClick={() => scrollCategories(1)}
                disabled={!canScrollRight}
                className={scrollBtnClass}
                aria-label="Scroll categories right"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </nav>
      </header>

      <div className="safe-bottom fixed bottom-4 left-3 right-3 z-40 md:hidden">
        <div className="flex items-center justify-around rounded-2xl border border-white/20 bg-white/90 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl sm:p-2">
          <Link to="/" className={`rounded-xl p-3 transition ${activeCategory === 'home' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`} aria-label="Home">
            <svg className="h-5 w-5" fill={activeCategory === 'home' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link
            to="/support"
            className={`rounded-xl p-3 transition ${activeCategory === 'support' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`}
            aria-label="Support"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </Link>
          <Link to="/videos" className={`rounded-xl p-3 transition ${activeCategory === 'videos' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`} aria-label="Videos">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Link>
          {isAuthenticated && (
            <Link
              to="/orders"
              className={`rounded-xl p-3 transition ${activeCategory === 'orders' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`}
              aria-label="My orders"
            >
              <OrdersIcon className="h-5 w-5" />
            </Link>
          )}
          {isAuthenticated ? (
            <Link
              to="/profile"
              className={`rounded-xl p-3 transition ${activeCategory === 'profile' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`}
              aria-label="Profile"
            >
              <ProfileIcon className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/login"
              state={authLinkState}
              className={`rounded-xl p-3 transition ${location.pathname === '/login' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`}
              aria-label="Sign in"
            >
              <ProfileIcon className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity xl:hidden ${
          isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[61] flex w-[min(85vw,20rem)] flex-col bg-white transition-transform duration-500 xl:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between p-6 pt-10">
          <Logo variant="compact" />
          <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="-mr-2 p-2 text-gray-400 hover:text-black" aria-label="Close menu">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-light tracking-tight text-gray-900">Home</Link>
            <Link to="/videos" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-light tracking-tight text-gray-900">All Videos</Link>
            <Link to="/support" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-light tracking-tight text-gray-900">Support</Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-light tracking-tight text-gray-900">
                  My Profile
                </Link>
                <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-light tracking-tight text-gray-900">
                  My Orders
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" state={authLinkState} onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-light tracking-tight text-gray-900">Sign in</Link>
                <Link to="/register" state={authLinkState} onClick={() => setIsMobileMenuOpen(false)} className="block text-2xl font-light tracking-tight text-gray-900">Create account</Link>
              </>
            )}
          </div>
          <div className="h-px w-12 bg-gray-200" />
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Footage Categories</p>
            {navLinks.map((link) => (
              <div key={link.id} className="border-b border-gray-100 last:border-0">
                <button
                  type="button"
                  onClick={() => setExpandedMobileCategory((c) => (c === link.id ? null : link.id))}
                  className="flex w-full items-center justify-between py-4 text-lg font-medium text-gray-800"
                >
                  {link.label}
                  <svg className={`h-4 w-4 transition-transform ${expandedMobileCategory === link.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all ${expandedMobileCategory === link.id ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 pl-4">
                    {link.subItems.map((sub) => (
                      <Link key={sub.name} to={sub.path} onClick={() => setIsMobileMenuOpen(false)} className="block text-base text-gray-500 hover:text-black">
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
