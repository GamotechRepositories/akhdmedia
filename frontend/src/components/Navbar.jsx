import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import Logo from './brand/Logo';

const Navbar = () => {
  const { navLinks } = useCatalog();
  const { getCartItemsCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = getCartItemsCount();

  const [activeCategory, setActiveCategory] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchExpanded, setIsDesktopSearchExpanded] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);

  const searchInputRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const routeCategory = pathParts[0] === 'videos' ? pathParts[1] : null;

    if (location.pathname === '/') setActiveCategory('home');
    else if (location.pathname === '/videos') setActiveCategory('videos');
    else if (routeCategory) setActiveCategory(routeCategory);
    else setActiveCategory('');

    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
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
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target) && !searchQuery) {
        setIsDesktopSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/?search=${encodeURIComponent(trimmed)}`);
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsDesktopSearchExpanded(false);
  }, [navigate, searchQuery]);

  const navLinkClass = (isActive) =>
    `text-sm font-semibold uppercase tracking-[0.12em] transition-colors relative ${
      isActive ? 'text-black' : 'text-gray-500 hover:text-black'
    }`;

  const underlineClass = (isActive, color = 'bg-black') =>
    `absolute -bottom-2 left-1/2 h-0.5 -translate-x-1/2 transition-all duration-300 ${
      isActive ? `w-full ${color}` : `w-0 group-hover:w-full ${color}`
    }`;

  return (
    <>
      <nav
        className={`sticky top-0 z-50 border-b py-1 transition-all duration-300 ${
          isNavHidden ? '-translate-y-full' : 'translate-y-0'
        } ${isScrolled ? 'border-gray-300 bg-white shadow-sm' : 'border-gray-200 bg-white'}`}
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-12">
          <div className="flex h-11 items-center justify-between md:h-12">
            <Logo />

            <div className="hidden items-center space-x-6 lg:space-x-8 md:flex">
              <Link to="/" className={`group ${navLinkClass(activeCategory === 'home')}`}>
                Home
                <span className={underlineClass(activeCategory === 'home')} />
              </Link>

              {navLinks.map((link) => (
                <div key={link.id} className="group relative flex h-12 items-center">
                  <Link to={link.path} className={navLinkClass(activeCategory === link.id)}>
                    {link.label}
                    <span className={underlineClass(activeCategory === link.id)} />
                  </Link>

                  <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-4 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-hover:-translate-y-1">
                    <div className="relative grid gap-1 rounded-none border border-gray-100 bg-white p-6 shadow-xl">
                      <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-gray-100 bg-white" />
                      <h3 className="mb-2 border-b pb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
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

            <div className="flex items-center gap-1 md:gap-4">
              <div className="hidden items-center justify-end md:flex" ref={searchInputRef}>
                <form
                  onSubmit={handleSearch}
                  onClick={() => !isDesktopSearchExpanded && setIsDesktopSearchExpanded(true)}
                  className={`flex items-center rounded-full border transition-all duration-500 ${
                    isDesktopSearchExpanded
                      ? 'w-64 border-gray-300 bg-gray-50 px-3 py-1.5'
                      : 'h-9 w-9 cursor-pointer justify-center border-transparent hover:bg-gray-100'
                  }`}
                >
                  <button type="submit" className="text-gray-800" aria-label="Search footage">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search footage..."
                    className={`ml-2 w-full border-none bg-transparent text-sm outline-none transition-all md:text-base ${
                      isDesktopSearchExpanded ? 'visible opacity-100' : 'invisible w-0 opacity-0'
                    }`}
                  />
                </form>
              </div>

              <button type="button" onClick={() => setIsSearchOpen((v) => !v)} className="p-2 text-gray-800 md:hidden" aria-label="Toggle search">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <Link to="/cart" className="relative rounded-full p-2 text-gray-800 transition hover:bg-gray-100" aria-label="Cart">
                <svg className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="rounded-full p-2 text-gray-800 hover:bg-gray-100 md:hidden" aria-label="Open menu">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            </div>
          </div>

          <div className={`overflow-hidden transition-all duration-300 md:hidden ${isSearchOpen ? 'max-h-20 py-2 opacity-100' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search footage..."
                className="w-full rounded-full border-none bg-gray-100/80 px-5 py-2.5 text-sm outline-none placeholder-gray-500 focus:ring-1 focus:ring-black"
              />
            </form>
          </div>
        </div>
      </nav>

      <div className="safe-bottom fixed bottom-4 left-3 right-3 z-40 md:hidden">
        <div className="flex items-center justify-around rounded-2xl border border-white/20 bg-white/90 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl sm:p-2">
          <Link to="/" className={`rounded-xl p-3 transition ${activeCategory === 'home' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`} aria-label="Home">
            <svg className="h-5 w-5" fill={activeCategory === 'home' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="rounded-xl p-3 text-gray-500" aria-label="Menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/videos" className={`rounded-xl p-3 transition ${activeCategory === 'videos' ? 'bg-black text-white shadow-lg' : 'text-gray-500'}`} aria-label="Videos">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Link>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[61] flex w-[80%] max-w-xs flex-col bg-white transition-transform duration-500 md:hidden ${
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
