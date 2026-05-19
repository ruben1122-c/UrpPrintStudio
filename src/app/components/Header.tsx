import { useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import { Button } from './ui/button';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Crear diseño', href: '#personalizar' },
    { name: 'Productos', href: '#productos' },
    { name: 'Cuenta', href: '#cuenta' },
    { name: 'Cómo funciona', href: '#como-funciona' },
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">UP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#1b4332] text-lg leading-tight">URP</span>
                <span className="text-xs text-gray-600 leading-tight">PrintStudio</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-[#1b4332] transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Login Button */}
          <div className="hidden md:flex items-center">
            <Button className="bg-[#1b4332] hover:bg-[#2d6a4f]" asChild>
              <a href="#cuenta">
                <User className="mr-2 h-4 w-4" />
                Iniciar sesión
              </a>
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
          <div className="md:hidden py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block py-2 text-gray-700 hover:text-[#1b4332] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <Button className="w-full bg-[#1b4332] hover:bg-[#2d6a4f]" asChild>
              <a href="#cuenta" onClick={() => setIsMenuOpen(false)}>
              <User className="mr-2 h-4 w-4" />
              Iniciar sesión
              </a>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
