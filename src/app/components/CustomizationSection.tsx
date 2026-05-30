import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, ShoppingBag, Sparkles, Upload, XCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCart } from '../cart/CartContext';
import { getFirstActiveProduct, getFirstTemplateForProduct, getProductBySlug } from '@/services/products';
import type { Product } from '@/types/database';

type CustomizationSectionProps = {
  selectedProduct: Product | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Campos requeridos para poder descargar el diseño
const DOWNLOAD_REQUIRED_FIELDS = ['nombre', 'carrera', 'año'] as const;

type FieldName = 'nombre' | 'carrera' | 'año' | 'email' | 'telefono' | 'cantidad';

type PreviewShape = 'apparel' | 'horizontal' | 'vertical' | 'badge';

type ProductOptionConfig = {
  key: string;
  label: string;
  values: string[];
};

type ProductCustomizationConfig = {
  exactSouvenirs: string[];
  options: ProductOptionConfig[];
  previewShape: PreviewShape;
};

const DEFAULT_CUSTOMIZATION: ProductCustomizationConfig = {
  exactSouvenirs: ['Souvenir personalizado'],
  options: [{ key: 'acabado', label: 'Acabado', values: ['Clásico'] }],
  previewShape: 'badge',
};

const PRODUCT_CUSTOMIZATIONS: Record<string, ProductCustomizationConfig> = {
  camisetas: {
    exactSouvenirs: ['Camiseta clásica', 'Camiseta oversize'],
    options: [
      { key: 'talla', label: 'Talla', values: ['S', 'M', 'L', 'XL'] },
      { key: 'fit', label: 'Fit', values: ['Regular', 'Oversize'] },
    ],
    previewShape: 'apparel',
  },
  tazas: {
    exactSouvenirs: ['Taza blanca', 'Taza mágica'],
    options: [{ key: 'capacidad', label: 'Capacidad', values: ['11 oz', '15 oz'] }],
    previewShape: 'horizontal',
  },
  posters: {
    exactSouvenirs: ['Poster egresado', 'Poster promoción'],
    options: [
      { key: 'tamaño', label: 'Tamaño', values: ['A4', 'A3'] },
      { key: 'orientación', label: 'Orientación', values: ['Vertical', 'Horizontal'] },
    ],
    previewShape: 'vertical',
  },
  'pines-urp': {
    exactSouvenirs: ['Pin redondo URP', 'Pin escudo URP'],
    options: [
      { key: 'tamaño', label: 'Tamaño', values: ['3 cm', '5 cm'] },
      { key: 'acabado', label: 'Acabado', values: ['Mate', 'Brillante'] },
    ],
    previewShape: 'badge',
  },
  'tote-bags': {
    exactSouvenirs: ['Tote natural', 'Tote negra'],
    options: [{ key: 'tamaño', label: 'Tamaño', values: ['Mediana', 'Grande'] }],
    previewShape: 'apparel',
  },
  stickers: {
    exactSouvenirs: ['Sticker individual', 'Pack stickers'],
    options: [
      { key: 'pack', label: 'Pack', values: ['1 unidad', 'Pack x6', 'Pack x12'] },
      { key: 'acabado', label: 'Acabado', values: ['Mate', 'Brillante'] },
    ],
    previewShape: 'badge',
  },
};

function getCustomizationConfig(productSlug?: string | null) {
  if (!productSlug) return null;
  return PRODUCT_CUSTOMIZATIONS[productSlug] ?? DEFAULT_CUSTOMIZATION;
}

function getDefaultOptions(config: ProductCustomizationConfig) {
  return config.options.reduce<Record<string, string>>((acc, option) => {
    acc[option.key] = option.values[0] ?? '';
    return acc;
  }, {});
}

function formatOptions(options: Record<string, string>) {
  return Object.values(options).filter(Boolean).join(' · ');
}

function validateField(name: FieldName, value: string): string | null {
  const trimmed = value.trim();
  switch (name) {
    case 'nombre':
      if (!trimmed) return 'El nombre es obligatorio';
      if (/\d/.test(trimmed)) return 'El nombre no puede contener números';
      return null;
    case 'carrera':
      return trimmed ? null : 'La carrera es obligatoria';
    case 'año':
      if (!trimmed) return 'El año de graduación es obligatorio';
      if (!/^\d{4}$/.test(trimmed)) return 'Ingresa un año válido (ej: 2026)';
      return null;
    case 'email':
      if (!trimmed) return null; // email no es requerido para descargar
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Ingresa un correo válido';
      return null;
    case 'telefono':
      if (!trimmed) return null; // opcional
      if (!/^\d{9}$/.test(trimmed.replace(/\s/g, ''))) return 'Ingresa un número válido de 9 dígitos';
      return null;
    case 'cantidad':
      if (!trimmed) return 'La cantidad es obligatoria';
      if (!/^\d+$/.test(trimmed)) return 'Ingresa solo números';
      if (Number.parseInt(trimmed, 10) < 1) return 'Mínimo 1 unidad';
      return null;
    default:
      return null;
  }
}

export function CustomizationSection({ selectedProduct }: CustomizationSectionProps) {
  const { addItem } = useCart();
  const [customData, setCustomData] = useState({
    nombre: '',
    carrera: '',
    año: '',
    email: '',
    telefono: '',
    cantidad: '1',
    foto: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exactSouvenir, setExactSouvenir] = useState('');
  const [productOptions, setProductOptions] = useState<Record<string, string>>({});
  const previewRef = useRef<HTMLDivElement>(null);

  const customizationConfig = getCustomizationConfig(selectedProduct?.slug);
  const selectedOptionsSummary = formatOptions(productOptions);

  useEffect(() => {
    if (!customizationConfig) {
      setExactSouvenir('');
      setProductOptions({});
      return;
    }

    setExactSouvenir(customizationConfig.exactSouvenirs[0] ?? '');
    setProductOptions(getDefaultOptions(customizationConfig));
  }, [selectedProduct?.slug, customizationConfig]);

  // Campos que el usuario ya interactuó (blur) → mostramos validación visual
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const markTouched = (name: FieldName) => {
    setTouched((prev) => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  // Errores por campo (solo se muestran si el campo fue tocado)
  const fieldErrors: Record<string, string | null> = {};
  const allValidatableFields: FieldName[] = ['nombre', 'carrera', 'año', 'email', 'telefono', 'cantidad'];
  for (const name of allValidatableFields) {
    if (touched.has(name)) {
      fieldErrors[name] = validateField(name, customData[name as keyof typeof customData] as string);
    }
  }

  // ¿El formulario está listo para descargar?
  const isDownloadValid = DOWNLOAD_REQUIRED_FIELDS.every(
    (name) => !validateField(name, customData[name] as string),
  );

  // Campos requeridos para ordenar impresión
  const ORDER_REQUIRED_FIELDS: FieldName[] = ['nombre', 'carrera', 'año', 'email', 'telefono', 'cantidad'];

  // ¿El formulario está listo para ordenar impresión? (todos los campos completos y válidos)
  const isOrderValid = ORDER_REQUIRED_FIELDS.every((name) => {
    const value = (customData as Record<string, string>)[name];
    if (!value.trim()) return false;
    return !validateField(name, value);
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomData({ ...customData, foto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCart = async () => {
    setSubmitMessage(null);
    setSubmitError(null);

    if (!customData.nombre.trim() || !customData.email.trim()) {
      setSubmitError('Completa tu nombre y correo para agregar al carrito.');
      return;
    }

    setIsSubmitting(true);

    try {
      const product = selectedProduct && uuidPattern.test(selectedProduct.id)
        ? selectedProduct
        : selectedProduct
          ? await getProductBySlug(selectedProduct.slug)
          : await getFirstActiveProduct();

      if (!product) {
        throw new Error('No hay productos activos en Supabase. Ejecuta primero el script schema.sql.');
      }

      const template = await getFirstTemplateForProduct(product.id);
      const quantity = Math.max(1, Number.parseInt(customData.cantidad, 10) || 1);
      const graduationYear = customData.año
        ? Number.parseInt(customData.año, 10)
        : null;
      const optionsSummary = formatOptions(productOptions);
      const productionNotes = [
        `Item agregado desde el editor web para ${product.name}.`,
        exactSouvenir ? `Souvenir exacto: ${exactSouvenir}.` : null,
        optionsSummary ? `Opciones: ${optionsSummary}.` : null,
      ].filter(Boolean).join(' ');

      const canvasData = {
          source: 'web-editor',
          product_slug: product.slug,
          template_slug: template?.slug ?? null,
          exact_souvenir: exactSouvenir || null,
          product_options: productOptions,
          fields: {
            nombre: customData.nombre,
            carrera: customData.carrera,
            año: customData.año,
            hasPhotoPreview: Boolean(customData.foto),
          },
        };

      addItem({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productImageUrl: product.image_url,
        unitPrice: Number(product.base_price),
        templateId: template?.id ?? null,
        quantity,
        customerName: customData.nombre.trim(),
        customerEmail: customData.email.trim(),
        customerPhone: customData.telefono.trim(),
        customerCareer: customData.carrera.trim(),
        graduationYear,
        exactSouvenir: exactSouvenir || null,
        productOptions,
        canvasData,
        productionNotes,
      });

      setSubmitMessage('Producto agregado al carrito.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar al carrito.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDesign = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
      });
      const filename = customData.nombre
        ? `diseno-urp-${customData.nombre.trim().replace(/\s+/g, '-').toLowerCase()}.png`
        : 'diseno-urp.png';
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al descargar el diseño:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper para armar la clase del input según estado de validación
  const inputClassName = (name: FieldName) => {
    const base = 'mt-2 pr-10';
    if (!touched.has(name)) return base;
    const error = fieldErrors[name];
    if (error) return `${base} border-red-400 focus-visible:ring-red-400`;
    return `${base} border-green-400 focus-visible:ring-green-400`;
  };

  const previewShape = customizationConfig?.previewShape ?? 'badge';
  const previewFrameClass: Record<PreviewShape, string> = {
    apparel: 'w-full max-w-sm min-h-[420px] rounded-3xl',
    horizontal: 'w-full max-w-md min-h-[300px] rounded-[2rem]',
    vertical: 'w-full max-w-xs min-h-[500px] rounded-lg',
    badge: 'w-full max-w-sm aspect-square rounded-full',
  };

  return (
    <section id="personalizar" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1b4332]/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-[#1b4332]" />
            <span className="text-sm font-semibold text-[#1b4332]">Editor en tiempo real</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Personaliza tu Diseño
          </h2>
          {selectedProduct ? (
            <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
              {selectedProduct.image_url && (
                <ImageWithFallback
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#1b4332]" />
                  <span className="font-semibold text-gray-900">{selectedProduct.name}</span>
                </div>
                <span className="text-sm text-[#1b4332] font-medium">
                  Desde S/. {Number(selectedProduct.base_price).toFixed(0)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-lg text-gray-500">
              👆 Selecciona un producto en la sección de arriba para empezar a personalizar
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Información del diseño
            </h3>
            <div className="space-y-6">
              {selectedProduct && customizationConfig && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <div>
                    <Label>Souvenir exacto</Label>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customizationConfig.exactSouvenirs.map((souvenir) => (
                        <Button
                          key={souvenir}
                          type="button"
                          size="sm"
                          variant={exactSouvenir === souvenir ? 'default' : 'outline'}
                          className={
                            exactSouvenir === souvenir
                              ? 'bg-[#1b4332] hover:bg-[#2d6a4f]'
                              : 'bg-white'
                          }
                          onClick={() => setExactSouvenir(souvenir)}
                        >
                          {souvenir}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {customizationConfig.options.map((option) => (
                      <div key={option.key}>
                        <Label>{option.label}</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {option.values.map((value) => {
                            const isSelected = productOptions[option.key] === value;
                            return (
                              <Button
                                key={value}
                                type="button"
                                size="sm"
                                variant={isSelected ? 'default' : 'outline'}
                                className={
                                  isSelected
                                    ? 'bg-[#1b4332] hover:bg-[#2d6a4f]'
                                    : 'bg-white'
                                }
                                onClick={() =>
                                  setProductOptions((prev) => ({
                                    ...prev,
                                    [option.key]: value,
                                  }))
                                }
                              >
                                {value}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nombre */}
              <div>
                <Label htmlFor="nombre">
                  Nombre completo <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="nombre"
                    placeholder="Ej: Juan Pérez García"
                    value={customData.nombre}
                    onChange={(e) =>
                      setCustomData({ ...customData, nombre: e.target.value })
                    }
                    onBlur={() => markTouched('nombre')}
                    className={inputClassName('nombre')}
                  />
                  {touched.has('nombre') &&
                    (fieldErrors.nombre ? (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    ))}
                </div>
                {touched.has('nombre') && fieldErrors.nombre && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.nombre}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Correo</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ej: alumno@urp.edu.pe"
                    value={customData.email}
                    onChange={(e) =>
                      setCustomData({ ...customData, email: e.target.value })
                    }
                    onBlur={() => markTouched('email')}
                    className={inputClassName('email')}
                  />
                  {touched.has('email') &&
                    (fieldErrors.email ? (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                    ) : (
                      customData.email.trim() && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )
                    ))}
                </div>
                {touched.has('email') && fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              {/* Carrera */}
              <div>
                <Label htmlFor="carrera">
                  Carrera <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="carrera"
                    placeholder="Ej: Ingeniería de Sistemas"
                    value={customData.carrera}
                    onChange={(e) =>
                      setCustomData({ ...customData, carrera: e.target.value })
                    }
                    onBlur={() => markTouched('carrera')}
                    className={inputClassName('carrera')}
                  />
                  {touched.has('carrera') &&
                    (fieldErrors.carrera ? (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    ))}
                </div>
                {touched.has('carrera') && fieldErrors.carrera && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.carrera}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="relative">
                    <Input
                      id="telefono"
                      placeholder="Ej: 999 888 777"
                      maxLength={9}
                      value={customData.telefono}
                      onChange={(e) =>
                        setCustomData({ ...customData, telefono: e.target.value })
                      }
                      onBlur={() => markTouched('telefono')}
                      className={inputClassName('telefono')}
                    />
                    {touched.has('telefono') &&
                      (fieldErrors.telefono ? (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                      ) : (
                        customData.telefono.trim() && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )
                      ))}
                  </div>
                  {touched.has('telefono') && fieldErrors.telefono && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.telefono}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <div className="relative">
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      value={customData.cantidad}
                      onChange={(e) =>
                        setCustomData({ ...customData, cantidad: e.target.value })
                      }
                      onBlur={() => markTouched('cantidad')}
                      className={inputClassName('cantidad')}
                    />
                    {touched.has('cantidad') &&
                      (fieldErrors.cantidad ? (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      ))}
                  </div>
                  {touched.has('cantidad') && fieldErrors.cantidad && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.cantidad}</p>
                  )}
                </div>
              </div>

              {/* Año */}
              <div>
                <Label htmlFor="año">
                  Año de graduación <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="año"
                    placeholder="Ej: 2026"
                    maxLength={4}
                    value={customData.año}
                    onChange={(e) =>
                      setCustomData({ ...customData, año: e.target.value })
                    }
                    onBlur={() => markTouched('año')}
                    className={inputClassName('año')}
                  />
                  {touched.has('año') &&
                    (fieldErrors.año ? (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    ))}
                </div>
                {touched.has('año') && fieldErrors.año && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.año}</p>
                )}
              </div>

              {/* Foto Upload */}
              <div>
                <Label htmlFor="foto">Foto (opcional)</Label>
                <div className="mt-2">
                  <label
                    htmlFor="foto"
                    className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-[#1b4332] focus:outline-none"
                  >
                    {customData.foto ? (
                      <img
                        src={customData.foto}
                        alt="Preview"
                        className="h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Haz clic para subir una imagen
                        </span>
                      </div>
                    )}
                    <input
                      id="foto"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-3">
                <Button
                  className={
                    isDownloadValid
                      ? 'w-full bg-[#1b4332] hover:bg-[#2d6a4f]'
                      : 'w-full bg-gray-300 text-gray-500'
                  }
                  onClick={handleDownloadDesign}
                  disabled={isDownloading || !isDownloadValid}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Generando imagen...' : 'Descargar diseño'}
                </Button>
                <Button
                  className={
                    isOrderValid
                      ? 'w-full bg-[#1b4332] hover:bg-[#2d6a4f]'
                      : 'w-full bg-gray-300 text-gray-500'
                  }
                  disabled={isSubmitting || !isOrderValid}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Agregando...' : 'Agregar al carrito'}
                </Button>
                {submitMessage && (
                  <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {submitMessage}
                  </div>
                )}
                {submitError && (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Preview Section */}
          <Card className="p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Vista previa
            </h3>
            <div
              ref={previewRef}
              className={`bg-white shadow-lg p-8 flex flex-col items-center justify-center relative overflow-hidden mx-auto ${previewFrameClass[previewShape]}`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, #1b4332 0, #1b4332 1px, transparent 0, transparent 50%)`,
                  backgroundSize: '10px 10px',
                }}></div>
              </div>

              {/* Content Preview */}
              <div className="relative z-10 text-center space-y-6 w-full">
                {/* Logo/Header */}
                <div className="mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-full mx-auto flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-2xl">URP</span>
                  </div>
                  {exactSouvenir && (
                    <div className="text-sm font-semibold text-[#1b4332] mb-1">
                      {exactSouvenir}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">Universidad Ricardo Palma</div>
                </div>

                {/* Photo */}
                {customData.foto && (
                  <div className="mb-6">
                    <img
                      src={customData.foto}
                      alt="User"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-[#1b4332]"
                    />
                  </div>
                )}

                {/* Name */}
                <div>
                  <div className="text-3xl font-bold text-[#1b4332] mb-2">
                    {customData.nombre || 'Tu nombre aquí'}
                  </div>
                </div>

                {/* Career */}
                <div>
                  <div className="text-xl text-gray-700">
                    {customData.carrera || 'Tu carrera'}
                  </div>
                </div>

                {/* Year */}
                <div>
                  <div className="inline-block px-6 py-2 bg-[#1b4332] text-white rounded-full font-bold">
                    {customData.año || '20XX'}
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="pt-8 border-t border-gray-200 mt-8">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">
                    {selectedProduct
                      ? `${selectedProduct.name} · URP PrintStudio`
                      : 'Diseñado con URP PrintStudio'}
                  </div>
                  {selectedOptionsSummary && (
                    <div className="mt-2 text-xs font-medium text-gray-500">
                      {selectedOptionsSummary}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              ✨ El diseño se actualiza automáticamente mientras escribes
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
