import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { getFallbackProductBySlug, ProductsSection } from './components/ProductsSection';
import { CustomizationSection } from './components/CustomizationSection';
import { AuthSection } from './components/AuthSection';
import { BenefitsSection } from './components/BenefitsSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartProvider } from './cart/CartContext';
import type { Product } from '@/types/database';
import { readCustomizationDraft } from './utils/customizationDraft';
import { getProductBySlug } from '@/services/products';

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

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    window.requestAnimationFrame(() => {
      document.getElementById('personalizar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <>
      <HeroSection onCtaClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} />
      <ProductsSection
        selectedProduct={selectedProduct}
        onSelectProduct={handleSelectProduct}
      />
      {selectedProduct && (
        <CustomizationSection selectedProduct={selectedProduct} />
      )}
      <BenefitsSection />
      <HowItWorksSection />
      <ContactSection />
    </>
  );
}

function EditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => getFallbackProductBySlug(slug));
  const [isLoadingProduct, setIsLoadingProduct] = useState(Boolean(slug));

  useEffect(() => {
    if (slug) return;

    const draft = readCustomizationDraft();
    if (draft?.product?.slug) {
      navigate(`/personalizar/${draft.product.slug}`, { replace: true });
    }
  }, [navigate, slug]);

  useEffect(() => {
    if (!slug) {
      setSelectedProduct(null);
      setIsLoadingProduct(false);
      return;
    }

    let mounted = true;
    setIsLoadingProduct(true);

    getProductBySlug(slug)
      .then((product) => {
        if (!mounted) return;
        setSelectedProduct(product ?? getFallbackProductBySlug(slug));
      })
      .catch(() => {
        if (mounted) setSelectedProduct(getFallbackProductBySlug(slug));
      })
      .finally(() => {
        if (mounted) setIsLoadingProduct(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (isLoadingProduct && !selectedProduct) {
    return (
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm font-medium text-gray-500 sm:px-6 lg:px-8">
          Cargando editor...
        </div>
      </section>
    );
  }

  return <CustomizationSection selectedProduct={selectedProduct} />;
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
            <Route path="/personalizar" element={<EditorPage />} />
            <Route path="/personalizar/:slug" element={<EditorPage />} />
            <Route path="/login" element={<AuthSection view="login" />} />
            <Route path="/cuenta" element={<AuthSection view="account" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WebsiteShell />
    </BrowserRouter>
  );
}
