import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getProducts } from '@/services/products';
import type { Product } from '@/types/database';

const fallbackProducts: Product[] = [
  {
    id: 'camisetas',
    name: 'Camisetas',
    slug: 'camisetas',
    description: 'Camisetas personalizadas con tu diseño',
    image_url: 'https://images.unsplash.com/photo-1678951558353-3a85c36358bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBwcmludGVkJTIwdHNoaXJ0JTIwbW9ja3VwfGVufDF8fHx8MTc3NTY5MzQ2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    image_url: 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBtdWclMjBtb2NrdXB8ZW58MXx8fHwxNzc1NjkzNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
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
    image_url: 'https://images.unsplash.com/photo-1769283996520-b8a1e5834c5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3NTY5MzQ2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    base_price: 20,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 3,
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
    sort_order: 4,
  },
  {
    id: 'tote-bags',
    name: 'Tote Bags',
    slug: 'tote-bags',
    description: 'Bolsas ecológicas con estilo',
    image_url: 'https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3RlJTIwYmFnJTIwbW9ja3VwfGVufDF8fHx8MTc3NTY3MDk0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    base_price: 28,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 5,
  },
  {
    id: 'stickers',
    name: 'Stickers',
    slug: 'stickers',
    description: 'Stickers personalizados adhesivos',
    image_url: 'https://images.unsplash.com/photo-1591241880902-7f05d345516e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBzdGlja2VycyUyMG1vY2t1cHxlbnwxfHx8fDE3NzU2OTM0Njl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    base_price: 15,
    digital_download_price: 0,
    currency: 'PEN',
    active: true,
    sort_order: 6,
  },
];

type ProductsSectionProps = {
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
};

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
    <section id="productos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestros Productos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isLoading
              ? 'Cargando productos disponibles...'
              : 'Selecciona el producto que quieres personalizar y hazlo tuyo'}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl ${
                selectedProduct?.id === product.id
                  ? 'ring-2 ring-[#1b4332] shadow-xl'
                  : ''
              }`}
              onClick={() => onSelectProduct(product)}
            >
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={product.image_url ?? ''}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {selectedProduct?.id === product.id && (
                  <div className="absolute top-4 right-4 bg-[#1b4332] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ Seleccionado
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#1b4332]">
                    {formatPrice(product)}
                  </span>
                  <Button
                    size="sm"
                    variant={selectedProduct?.id === product.id ? 'default' : 'outline'}
                    className={
                      selectedProduct?.id === product.id
                        ? 'bg-[#1b4332] hover:bg-[#2d6a4f]'
                        : ''
                    }
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {selectedProduct?.id === product.id ? 'Seleccionado' : 'Seleccionar'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
