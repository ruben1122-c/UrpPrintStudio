import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductsSection } from './components/ProductsSection';
import { CustomizationSection } from './components/CustomizationSection';
import { AuthSection } from './components/AuthSection';
import { BenefitsSection } from './components/BenefitsSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartProvider } from './cart/CartContext';
import type { Product } from '@/types/database';
import { getCurrentSession, onAuthStateChange } from '@/services/auth';

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      window.requestAnimationFrame(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.hash, location.pathname]);

  return null;
}

function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <HeroSection />
      <ProductsSection
        selectedProduct={selectedProduct}
        onSelectProduct={setSelectedProduct}
      />
      <CustomizationSection selectedProduct={selectedProduct} />
      <BenefitsSection />
      <HowItWorksSection />
      <ContactSection />
    </>
  );
}

function WebsiteShell() {
  return (
    <CartProvider>
      <ScrollToHash />
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthSection view="login" />} />
            <Route path="/cuenta" element={<AuthSection view="account" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

function AuthGate() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'guest'>('loading');

  useEffect(() => {
    let isActive = true;

    getCurrentSession()
      .then((session) => {
        if (isActive) setAuthState(session ? 'authenticated' : 'guest');
      })
      .catch(() => {
        if (isActive) setAuthState('guest');
      });

    const unsubscribe = onAuthStateChange((session) => {
      if (isActive) setAuthState(session ? 'authenticated' : 'guest');
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  if (authState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-600">
        Cargando...
      </div>
    );
  }

  if (authState === 'guest') {
    return <AuthSection view="login" />;
  }

  return <WebsiteShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}
