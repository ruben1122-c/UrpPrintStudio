import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router';
import { Menu, X, User } from 'lucide-react';
import { Button } from './ui/button';
import { CartPanel } from './CartPanel';
import { getCurrentSession, onAuthStateChange } from '@/services/auth';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const navItems = [
    { name: 'Inicio', href: '/#inicio' },
    { name: 'Crear diseño', href: '/#productos' },
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

    return onAuthStateChange(setSession);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">UP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#1b4332] text-lg leading-tight">URP</span>
                <span className="text-xs text-gray-600 leading-tight">PrintStudio</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="whitespace-nowrap text-sm text-gray-700 transition-colors hover:text-[#1b4332] lg:text-base"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Header actions */}
          <div className="hidden md:flex items-center gap-2">
            <CartPanel />
            <Button className="bg-[#1b4332] hover:bg-[#2d6a4f]" asChild>
              <Link to={accountHref}>
                <User className="mr-2 h-4 w-4" />
                {accountLabel}
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden space-y-3 border-t border-gray-100 py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block rounded-md px-2 py-2 text-gray-700 transition-colors hover:bg-[#1b4332]/5 hover:text-[#1b4332]"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <CartPanel className="w-full justify-center" label="Carrito" autoOpenFromCheckout={false} />
            <Button className="w-full bg-[#1b4332] hover:bg-[#2d6a4f]" asChild>
              <Link to={accountHref} onClick={() => setIsMenuOpen(false)}>
                <User className="mr-2 h-4 w-4" />
                {accountLabel}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
