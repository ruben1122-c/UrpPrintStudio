import { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getProducts } from '@/services/products';
import { StaggerChildren, staggerItem } from './AnimateOnScroll';
import type { Product } from '@/types/database';

export const fallbackProducts: Product[] = [
  {
    id: 'camisetas',
    name: 'Camisetas',
    slug: 'camisetas',
    description: 'Camisetas personalizadas con tu diseño',
    image_url: 'https://images.unsplash.com/photo-1678951558353-3a85c36358bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBwcmludGVkJTIwdHNoaXJ0JTIwbW9ja3VwfGVufDF8fHx8MTc3NTY5MzQ2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    base_price: 35,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 1,
  },
  {
    id: 'tazas',
    name: 'Tazas',
    slug: 'tazas',
    description: 'Tazas únicas para tu café diario',
    image_url: 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBtdWclMjBtb2NrdXB8ZW58MXx8fHwxNzc1NjkzNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    base_price: 25,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 2,
  },
  {
    id: 'posters',
    name: 'Pósters',
    slug: 'posters',
    description: 'Pósters decorativos para tu espacio',
    image_url: 'https://images.unsplash.com/photo-1769283996520-b8a1e5834c5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3NTY5MzQ2OHww&ixlib=rb-4.1.0&q=80&w=1080',
    base_price: 20,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 3,
  },
  {
    id: 'cuadros',
    name: 'Cuadro personalizado',
    slug: 'cuadros',
    description: 'Cuadro decorativo personalizado para egresados, alumnos o promociones URP.',
    image_url: null,
    base_price: 45,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 4,
  },
  {
    id: 'pines-urp',
    name: 'Pines URP',
    slug: 'pines-urp',
    description: 'Pines personalizados con identidad URP',
    image_url: 'https://images.unsplash.com/photo-1614111662625-a024f2759e19?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
    base_price: 12,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 5,
  },
  {
    id: 'tote-bags',
    name: 'Tote Bags',
    slug: 'tote-bags',
    description: 'Bolsas ecológicas con estilo',
    image_url: 'https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3RlJTIwYmFnJTIwbW9ja3VwfGVufDF8fHx8MTc3NTY3MDk0Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    base_price: 28,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 6,
  },
  {
    id: 'stickers',
    name: 'Stickers',
    slug: 'stickers',
    description: 'Stickers personalizados adhesivos',
    image_url: 'https://images.unsplash.com/photo-1591241880902-7f05d345516e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBzdGlja2VycyUyMG1vY2t1cHxlbnwxfHx8fDE3NzU2OTM0Njl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    base_price: 15,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 7,
  },
];

type ProductsSectionProps = {
  selectedProduct?: Product | null;
  onSelectProduct: (product: Product) => void;
};

export function getFallbackProductBySlug(slug: string | undefined) {
  if (!slug) return null;
  return fallbackProducts.find((product) => product.slug === slug) ?? null;
}

const formatPrice = (product: Product) => `Desde S/. ${Number(product.base_price).toFixed(0)}`;

export function ProductsSection({ selectedProduct, onSelectProduct }: ProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getProducts()
      .then((loadedProducts) => {
        if (!mounted || loadedProducts.length === 0) return;
        setProducts(loadedProducts);
      })
      .catch(() => {
        setProducts(fallbackProducts);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="productos" className="bg-gray-50 py-16 sm:py-24 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
            Catálogo Oficial
          </div>
          <h2 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Nuestros Productos
          </h2>
          <p className="mt-3 text-base text-gray-600 sm:text-lg">
            {isLoading
              ? 'Cargando productos disponibles...'
              : 'Selecciona un producto para abrir el editor en tiempo real abajo y comenzar a personalizarlo.'}
          </p>
        </div>

        {/* Products Grid */}
        <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <motion.div key={product.id} variants={staggerItem} className="flex h-full">
              <Card
                className={`group flex flex-col w-full cursor-pointer overflow-hidden transition-all duration-300 rounded-2xl bg-white border border-gray-200/80 hover:border-transparent hover:shadow-2xl hover:-translate-y-1.5 ${
                  selectedProduct?.id === product.id
                    ? 'ring-2 ring-primary border-transparent shadow-xl bg-emerald-50/5'
                    : ''
                }`}
                onClick={() => onSelectProduct(product)}
              >
                {/* Image Wrap */}
                <div className="relative h-48 overflow-hidden sm:h-52 lg:h-56 bg-gray-100 shrink-0">
                  {product.image_url ? (
                    <ImageWithFallback
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50/20 transition-transform duration-500 group-hover:scale-105">
                      <div className="flex h-32 w-24 items-center justify-center border-8 border-gray-900 bg-white shadow-lg rounded-sm">
                        <div className="text-center">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">URP</div>
                          <div className="mt-1 h-[2px] w-8 bg-primary mx-auto" />
                          <div className="mt-1 text-[8px] font-bold text-gray-500 tracking-wider">PrintStudio</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {selectedProduct?.id === product.id && (
                    <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-md animate-in zoom-in-50 duration-200">
                      ✓ Seleccionado
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-display text-lg font-bold text-gray-900 group-hover:text-primary transition-colors duration-200 mb-1.5">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100/50">
                    <span className="font-display text-base font-extrabold text-primary">
                      {formatPrice(product)}
                    </span>
                    <Button
                      size="sm"
                      variant={selectedProduct?.id === product.id ? 'default' : 'outline'}
                      className={`h-9 font-semibold text-xs transition-colors rounded-lg cursor-pointer ${
                        selectedProduct?.id === product.id
                          ? 'bg-primary text-white hover:bg-primary/95 shadow-sm'
                          : 'border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                      {selectedProduct?.id === product.id ? 'Seleccionado' : 'Personalizar'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </StaggerChildren>

        {/* Selected Product Nudge */}
        {!selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 text-center text-sm font-semibold text-primary/70 animate-bounce"
          >
            👇 Selecciona un producto para comenzar a diseñar en tiempo real
          </motion.div>
        )}
      </div>
    </section>
  );
}
