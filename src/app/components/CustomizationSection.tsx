import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router';
import { CheckCircle2, Download, ShoppingBag, SlidersHorizontal, Sparkles, Upload, XCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCart } from '../cart/CartContext';
import { renderProductDesign } from '../utils/renderProductDesign';
import { getPreviewCanvasDataUrl } from '../utils/previewCanvasCapture';
import {
  clearCustomizationDraft,
  readCustomizationDraft,
  saveCustomizationDraft,
  type CustomizationDraftAction,
} from '../utils/customizationDraft';
import { getCurrentSession, onAuthStateChange } from '@/services/auth';
import { getFirstActiveProduct, getFirstTemplateForProduct, getProductBySlug } from '@/services/products';
import type { Product, Template } from '@/types/database';
import { ProductPreview } from './ProductPreview';

type CustomizationSectionProps = {
  selectedProduct: Product | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Campos requeridos para poder descargar el diseño
const DOWNLOAD_REQUIRED_FIELDS = ['nombre', 'carrera', 'año'] as const;

type FieldName = 'nombre' | 'carrera' | 'año' | 'email' | 'telefono' | 'cantidad';

type ProductOptionConfig = {
  key: string;
  label: string;
  values: string[];
};

type ProductCustomizationConfig = {
  exactSouvenirs: string[];
  options: ProductOptionConfig[];
};

const DEFAULT_CUSTOMIZATION: ProductCustomizationConfig = {
  exactSouvenirs: [],
  options: [],
};

/**
 * Fallback slug→config map.
 * Used as initial defaults when no Supabase template is loaded yet.
 * Keep this structured and easy to extend.
 */
const PRODUCT_CUSTOMIZATIONS: Record<string, ProductCustomizationConfig> = {
  camisetas: {
    exactSouvenirs: [],
    options: [
      { key: 'tipo', label: 'Tipo de polo', values: ['Clásico'] },
      { key: 'talla', label: 'Talla', values: ['S', 'M', 'L', 'XL'] },
    ],
  },
  tazas: {
    exactSouvenirs: [],
    options: [],
  },
  posters: {
    exactSouvenirs: [],
    options: [
      { key: 'tamaño', label: 'Tamaño', values: ['A4', 'A3'] },
      { key: 'orientación', label: 'Orientación', values: ['Vertical', 'Horizontal'] },
    ],
  },
  cuadros: {
    exactSouvenirs: [],
    options: [
      { key: 'tamaño', label: 'Tamaño del cuadro', values: ['A4', 'A3', '30x40 cm'] },
    ],
  },
  'pines-urp': {
    exactSouvenirs: [],
    options: [
      { key: 'tipo', label: 'Tipo de pin', values: ['Redondo URP', 'Escudo URP'] },
      { key: 'tamaño', label: 'Tamaño', values: ['3 cm', '5 cm'] },
      { key: 'acabado', label: 'Acabado', values: ['Mate', 'Brillante'] },
    ],
  },
  'tote-bags': {
    exactSouvenirs: [],
    options: [
      { key: 'tipo', label: 'Tipo de tote bag', values: ['Natural', 'Negra'] },
      { key: 'tamaño', label: 'Tamaño', values: ['Mediana', 'Grande'] },
    ],
  },
  stickers: {
    exactSouvenirs: [],
    options: [
      { key: 'pack', label: 'Cantidad del pack', values: ['1 unidad', 'Pack x6', 'Pack x12'] },
      { key: 'acabado', label: 'Acabado', values: ['Mate', 'Brillante'] },
    ],
  },
};

function getCustomizationConfig(productSlug?: string | null): ProductCustomizationConfig | null {
  if (!productSlug) return null;
  return PRODUCT_CUSTOMIZATIONS[productSlug] ?? DEFAULT_CUSTOMIZATION;
}

function getDefaultOptions(config: ProductCustomizationConfig): Record<string, string> {
  return config.options.reduce<Record<string, string>>((acc, option) => {
    acc[option.key] = option.values[0] ?? '';
    return acc;
  }, {});
}

function formatOptions(options: Record<string, string>) {
  return Object.values(options).filter(Boolean).join(' · ');
}

function formatLabeledOptions(config: ProductCustomizationConfig, options: Record<string, string>) {
  return config.options
    .map((option) => {
      const value = options[option.key];
      return value ? `${option.label}: ${value}` : null;
    })
    .filter(Boolean)
    .join(' · ');
}

interface ProductOptionsBoxProps {
  config: ProductCustomizationConfig;
  exactSouvenir: string;
  onExactSouvenirChange: (souvenir: string) => void;
  onProductOptionChange: (key: string, value: string) => void;
  product: Product;
  productOptions: Record<string, string>;
}

function ProductOptionsBox({
  config,
  exactSouvenir,
  onExactSouvenirChange,
  onProductOptionChange,
  product,
  productOptions,
}: ProductOptionsBoxProps) {
  const labeledOptionsSummary = formatLabeledOptions(config, productOptions);
  const hasExactSouvenirs = config.exactSouvenirs.length > 0;
  const hasProductOptions = config.options.length > 0;
  const hasSelectableOptions = hasExactSouvenirs || hasProductOptions;

  return (
    <div className="space-y-5 rounded-xl border border-emerald-900/15 bg-emerald-50/40 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-900 shadow-sm">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-gray-900">Opciones del producto</h4>
          <p className="mt-1 text-sm text-gray-600">
            Elegí la configuración específica disponible para {product.name}.
          </p>
          {labeledOptionsSummary && (
            <p className="mt-2 break-words text-xs font-medium text-emerald-900">Selección: {labeledOptionsSummary}</p>
          )}
        </div>
      </div>

      {!hasSelectableOptions && (
        <div className="rounded-lg border border-emerald-900/10 bg-white p-3 text-sm text-gray-600">
          Este producto no requiere medidas, talla ni variantes adicionales.
        </div>
      )}

      {hasExactSouvenirs && (
        <div>
          <Label>Producto exacto</Label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {config.exactSouvenirs.map((souvenir) => (
              <Button
                key={souvenir}
                type="button"
                size="sm"
                variant={exactSouvenir === souvenir ? 'default' : 'outline'}
                aria-pressed={exactSouvenir === souvenir}
                className={
                  exactSouvenir === souvenir
                    ? 'h-auto min-h-9 whitespace-normal bg-emerald-900 hover:bg-emerald-800'
                    : 'h-auto min-h-9 whitespace-normal bg-white'
                }
                onClick={() => onExactSouvenirChange(souvenir)}
              >
                {souvenir}
              </Button>
            ))}
          </div>
        </div>
      )}

      {hasProductOptions && (
        <div className="grid gap-4 sm:grid-cols-2">
          {config.options.map((option) => (
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
                      aria-pressed={isSelected}
                      className={
                        isSelected
                          ? 'h-auto min-h-9 whitespace-normal bg-emerald-900 hover:bg-emerald-800'
                          : 'h-auto min-h-9 whitespace-normal bg-white'
                      }
                      onClick={() => onProductOptionChange(option.key, value)}
                    >
                      {value}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  const navigate = useNavigate();
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
  const [session, setSession] = useState<Session | null>(null);
  const [restoredDraftSlug, setRestoredDraftSlug] = useState<string | null>(null);

  /**
   * Active template loaded from Supabase when selectedProduct changes.
   * Used to pass canvas_width/canvas_height/config to ProductPreview so it can
   * orient proportions and fields correctly. Falls back to null (slug-based shape).
   *
   * NOTE: template loading is non-blocking — if it fails the preview still works
   * using the slug-based fallback in ProductPreview.
   */
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const customizationConfig = getCustomizationConfig(selectedProduct?.slug);
  const selectedOptionsSummary = formatOptions(productOptions);

  useEffect(() => {
    getCurrentSession()
      .then(setSession)
      .catch(() => setSession(null));

    return onAuthStateChange(setSession);
  }, []);

  // Reset config and load template when selected product changes
  useEffect(() => {
    if (!customizationConfig) {
      setExactSouvenir('');
      setProductOptions({});
      setActiveTemplate(null);
      return;
    }

    setExactSouvenir(customizationConfig.exactSouvenirs[0] ?? '');
    setProductOptions(getDefaultOptions(customizationConfig));

    // Load the active template for this product (if it has a real UUID id)
    if (selectedProduct && uuidPattern.test(selectedProduct.id)) {
      setIsLoadingTemplate(true);
      getFirstTemplateForProduct(selectedProduct.id)
        .then((tpl) => setActiveTemplate(tpl))
        .catch(() => setActiveTemplate(null))
        .finally(() => setIsLoadingTemplate(false));
    } else {
      // Fallback product (slug-based id from static list) — no template lookup
      setActiveTemplate(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct?.slug]);

  useEffect(() => {
    if (!selectedProduct || restoredDraftSlug === selectedProduct.slug) return;

    const draft = readCustomizationDraft();
    if (!draft?.product || draft.product.slug !== selectedProduct.slug) return;

    setCustomData(draft.data);
    setExactSouvenir(draft.exactSouvenir);
    setProductOptions(draft.productOptions);
    setRestoredDraftSlug(selectedProduct.slug);

    if (draft.pendingAction) {
      setSubmitMessage(
        draft.pendingAction === 'download'
          ? 'SesiÃ³n iniciada. Puedes descargar tu diseÃ±o.'
          : 'SesiÃ³n iniciada. Puedes agregar tu diseÃ±o al carrito.',
      );
    }
  }, [restoredDraftSlug, selectedProduct]);

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

  const requestLoginForAction = (pendingAction: CustomizationDraftAction) => {
    saveCustomizationDraft({
      product: selectedProduct,
      data: customData,
      exactSouvenir,
      productOptions,
      pendingAction,
    });
    navigate(`/login?next=${encodeURIComponent('/#personalizar')}`);
  };

  const ensureAuthenticated = async (pendingAction: CustomizationDraftAction) => {
    const currentSession = session ?? await getCurrentSession().catch(() => null);

    if (currentSession) {
      setSession(currentSession);
      return true;
    }

    requestLoginForAction(pendingAction);
    return false;
  };

  const handleAddToCart = async () => {
    setSubmitMessage(null);
    setSubmitError(null);

    if (!customData.nombre.trim() || !customData.email.trim()) {
      setSubmitError('Completa tu nombre y correo para agregar al carrito.');
      return;
    }

    if (!await ensureAuthenticated('cart')) {
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

      const template = activeTemplate ?? await getFirstTemplateForProduct(product.id);
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
      clearCustomizationDraft();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo agregar al carrito.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDesign = async () => {
    setSubmitMessage(null);
    setSubmitError(null);

    if (!await ensureAuthenticated('download')) {
      return;
    }

    setIsDownloading(true);
    try {
      const previewCanvasDataUrl = selectedProduct?.slug === 'camisetas'
        ? getPreviewCanvasDataUrl(previewRef.current)
        : null;
      const dataUrl = previewCanvasDataUrl ?? await renderProductDesign({
        product: selectedProduct,
        template: activeTemplate,
        data: {
          nombre: customData.nombre,
          carrera: customData.carrera,
          año: customData.año,
          foto: customData.foto,
        },
        exactSouvenir,
        productOptions,
      });
      const filename = customData.nombre
        ? `diseno-urp-${customData.nombre.trim().replace(/\s+/g, '-').toLowerCase()}.png`
        : 'diseno-urp.png';
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      clearCustomizationDraft();
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

  const handleProductOptionChange = (key: string, value: string) => {
    setProductOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section id="personalizar" className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1b4332]/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-[#1b4332]" />
            <span className="text-sm font-semibold text-[#1b4332]">Editor en tiempo real</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Personaliza tu Diseño
          </h2>
          {selectedProduct ? (
            <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-5">
              {selectedProduct.image_url && (
                <ImageWithFallback
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#1b4332]" />
                  <span className="break-words font-semibold text-gray-900">{selectedProduct.name}</span>
                </div>
                <span className="text-sm text-[#1b4332] font-medium">
                  Desde S/. {Number(selectedProduct.base_price).toFixed(0)}
                </span>
              </div>
              {isLoadingTemplate && (
                <span className="animate-pulse text-xs text-gray-400">cargando template…</span>
              )}
            </div>
          ) : (
            <p className="text-base text-gray-500 sm:text-lg">
              👆 Selecciona un producto en la sección de arriba para empezar a personalizar
            </p>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
          {/* Form Section */}
          <Card className="min-w-0 p-4 sm:p-6 lg:p-8">
            <h3 className="mb-5 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">
              Información del diseño
            </h3>
            <div className="space-y-5 sm:space-y-6">
              {selectedProduct && customizationConfig && (
                <ProductOptionsBox
                  config={customizationConfig}
                  exactSouvenir={exactSouvenir}
                  onExactSouvenirChange={setExactSouvenir}
                  onProductOptionChange={handleProductOptionChange}
                  product={selectedProduct}
                  productOptions={productOptions}
                />
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

              <div className="grid gap-4 sm:grid-cols-2">
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
                    className="flex h-28 w-full cursor-pointer appearance-none items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 text-center transition hover:border-[#1b4332] focus:outline-none sm:h-32"
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
              <div className="space-y-3 pt-3 sm:pt-4">
                <Button
                  className={
                    isDownloadValid
                      ? 'h-auto min-h-10 w-full whitespace-normal bg-[#1b4332] hover:bg-[#2d6a4f]'
                      : 'h-auto min-h-10 w-full whitespace-normal bg-gray-300 text-gray-500'
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
                      ? 'h-auto min-h-10 w-full whitespace-normal bg-[#1b4332] hover:bg-[#2d6a4f]'
                      : 'h-auto min-h-10 w-full whitespace-normal bg-gray-300 text-gray-500'
                  }
                  disabled={isSubmitting || !isOrderValid}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Agregando...' : 'Agregar al carrito'}
                </Button>
                {submitMessage && (
                  <div className="flex items-start gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
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
          <Card className="min-w-0 overflow-visible bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <h3 className="mb-5 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">
              Vista previa
            </h3>
            <div className="flex min-w-0 justify-center">
              <ProductPreview
                previewRef={previewRef}
                product={selectedProduct}
                template={activeTemplate}
                data={{
                  nombre: customData.nombre,
                  carrera: customData.carrera,
                  año: customData.año,
                  foto: customData.foto,
                }}
                exactSouvenir={exactSouvenir}
                productOptions={productOptions}
              />
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">
              ✨ El diseño se actualiza automáticamente mientras escribes
            </p>
            {selectedOptionsSummary && (
              <p className="mt-1 break-words text-center text-xs text-gray-400">{selectedOptionsSummary}</p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
