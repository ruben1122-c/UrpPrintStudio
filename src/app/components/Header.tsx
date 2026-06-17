import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, useLocation } from 'react-router';
import { Menu, X, User } from 'lucide-react';
import { Button } from './ui/button';
import { CartPanel } from './CartPanel';
import { getCurrentSession, onAuthStateChange } from '@/services/auth';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Inicio', href: '/#inicio' },
    { name: 'Productos', href: '/#productos' },
    { name: 'Cómo funciona', href: '/#como-funciona' },
    { name: 'Contacto', href: '/#contacto' },
  ];
  
  const accountHref = session ? '/cuenta' : '/login';
  const accountLabel = session ? 'Mi cuenta' : 'Iniciar sesión';

  useEffect(() => {
    getCurrentSession()
      .then(setSession)
      .catch(() => setSession(null));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    const unsubAuth = onAuthStateChange(setSession);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubAuth();
    };
  }, []);

  // Close mobile menu on route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-md border-gray-200/50 py-2' 
          : 'bg-white border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center cursor-pointer group"
          >
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-800 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-sm">
                <span className="text-white font-display font-black text-xl tracking-tighter">UP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-primary text-xl leading-none tracking-tight">URP</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 leading-none mt-1">PrintStudio</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="relative text-sm font-medium text-gray-600 transition-colors hover:text-primary py-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Header actions */}
          <div className="hidden md:flex items-center gap-3">
            <CartPanel />
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium rounded-lg" asChild>
              <Link to={accountHref}>
                <User className="mr-2 h-4 w-4" />
                {accountLabel}
              </Link>
            </Button>
          </div>

          {/* Mobile menu and cart actions */}
          <div className="flex items-center gap-2 md:hidden">
            <CartPanel />
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 space-y-3 border-t border-gray-100 pt-4 pb-2 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-primary/5 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium" asChild>
                <Link to={accountHref} onClick={() => setIsMenuOpen(false)}>
                  <User className="mr-2 h-4 w-4" />
                  {accountLabel}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
