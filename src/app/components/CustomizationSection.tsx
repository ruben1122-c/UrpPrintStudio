import { useState } from 'react';
import { CheckCircle2, Download, Sparkles, Upload } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createCheckoutOrder } from '@/services/orders';
import { getFirstActiveProduct, getFirstTemplateForProduct, getProductById } from '@/services/products';

type CustomizationSectionProps = {
  selectedProductId: string | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function CustomizationSection({ selectedProductId }: CustomizationSectionProps) {
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

  const handleOrderPrint = async () => {
    setSubmitMessage(null);
    setSubmitError(null);

    if (!customData.nombre.trim() || !customData.email.trim()) {
      setSubmitError('Completa tu nombre y correo para crear el pedido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProduct = selectedProductId && uuidPattern.test(selectedProductId)
        ? await getProductById(selectedProductId)
        : null;
      const product = selectedProduct ?? await getFirstActiveProduct();

      if (!product) {
        throw new Error('No hay productos activos en Supabase. Ejecuta primero el script schema.sql.');
      }

      const template = await getFirstTemplateForProduct(product.id);
      const quantity = Math.max(1, Number.parseInt(customData.cantidad, 10) || 1);
      const graduationYear = customData.año
        ? Number.parseInt(customData.año, 10)
        : null;

      const order = await createCheckoutOrder({
        product_id: product.id,
        template_id: template?.id ?? null,
        customer_name: customData.nombre.trim(),
        customer_email: customData.email.trim(),
        customer_phone: customData.telefono.trim() || null,
        customer_career: customData.carrera.trim() || null,
        graduation_year: graduationYear,
        quantity,
        canvas_data: {
          source: 'web-editor',
          product_slug: product.slug,
          template_slug: template?.slug ?? null,
          fields: {
            nombre: customData.nombre,
            carrera: customData.carrera,
            año: customData.año,
            hasPhotoPreview: Boolean(customData.foto),
          },
        },
        notes: `Pedido creado desde el editor web para ${product.name}.`,
      });

      setSubmitMessage(`Pedido ${order.order_code} creado correctamente. Total: S/. ${order.total_amount.toFixed(2)}.`);
      window.dispatchEvent(new CustomEvent('urp:orders-changed'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el pedido.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
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
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Agrega tu información y observa el resultado en tiempo real
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Información del diseño
            </h3>
            <div className="space-y-6">
              {/* Nombre */}
              <div>
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Juan Pérez García"
                  value={customData.nombre}
                  onChange={(e) =>
                    setCustomData({ ...customData, nombre: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: alumno@urp.edu.pe"
                  value={customData.email}
                  onChange={(e) =>
                    setCustomData({ ...customData, email: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              {/* Carrera */}
              <div>
                <Label htmlFor="carrera">Carrera</Label>
                <Input
                  id="carrera"
                  placeholder="Ej: Ingeniería de Sistemas"
                  value={customData.carrera}
                  onChange={(e) =>
                    setCustomData({ ...customData, carrera: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="Ej: 999 888 777"
                    value={customData.telefono}
                    onChange={(e) =>
                      setCustomData({ ...customData, telefono: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={customData.cantidad}
                    onChange={(e) =>
                      setCustomData({ ...customData, cantidad: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Año */}
              <div>
                <Label htmlFor="año">Año de graduación</Label>
                <Input
                  id="año"
                  placeholder="Ej: 2026"
                  value={customData.año}
                  onChange={(e) =>
                    setCustomData({ ...customData, año: e.target.value })
                  }
                  className="mt-2"
                />
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
                <Button className="w-full bg-[#1b4332] hover:bg-[#2d6a4f]">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar diseño
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={handleOrderPrint}
                >
                  {isSubmitting ? 'Creando pedido...' : 'Ordenar impresión'}
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
            <div className="bg-white rounded-lg shadow-lg p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
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
                    Diseñado con URP PrintStudio
                  </div>
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
