import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { createCartCheckout } from '@/services/orders';
import { useCart } from '../cart/CartContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

type CartPanelProps = {
  className?: string;
  label?: string;
};

function formatMoney(value: number) {
  return `S/. ${value.toFixed(2)}`;
}

function formatOptions(options: Record<string, string>) {
  return Object.entries(options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

export function CartPanel({ className, label }: CartPanelProps) {
  const { items, itemCount, subtotal, clearCart, removeItem, updateQuantity } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const firstItem = items[0];

  useEffect(() => {
    if (!firstItem) return;
    setCustomerName((current) => current || firstItem.customerName);
    setCustomerEmail((current) => current || firstItem.customerEmail);
    setCustomerPhone((current) => current || firstItem.customerPhone);
  }, [firstItem]);

  const canCheckout = useMemo(() => {
    return items.length > 0 && Boolean(customerName.trim()) && Boolean(customerEmail.trim());
  }, [customerEmail, customerName, items.length]);

  const handleCheckout = async () => {
    setCheckoutMessage(null);
    setCheckoutError(null);

    if (!canCheckout) {
      setCheckoutError('Completa nombre y correo para finalizar el pedido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createCartCheckout({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || null,
        delivery_method: 'pickup',
        notes: 'Pedido creado desde carrito web.',
        items: items.map((item) => ({
          product_id: item.productId,
          template_id: item.templateId,
          quantity: item.quantity,
          customer_career: item.customerCareer || null,
          graduation_year: item.graduationYear,
          canvas_data: item.canvasData,
          production_notes: item.productionNotes,
        })),
      });

      clearCart();
      setCheckoutMessage(
        `Pedido ${order.order_code} creado correctamente. Total: ${formatMoney(order.total_amount)}.`,
      );
      window.dispatchEvent(new CustomEvent('urp:orders-changed'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo finalizar el pedido.';
      setCheckoutError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`relative border-[#1b4332]/20 text-[#1b4332] hover:bg-[#1b4332]/10 ${className ?? ''}`}
        >
          <ShoppingCart className="h-4 w-4" />
          {label && <span>{label}</span>}
          {!label && <span className="sr-only">Carrito</span>}
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[#1b4332] px-1.5 text-xs leading-5 text-white">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Carrito</SheetTitle>
          <SheetDescription>Revisa tus souvenirs antes de crear un solo pedido.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Tu carrito está vacío.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const options = formatOptions(item.productOptions);

                return (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-md bg-gray-100">
                        {item.productImageUrl ? (
                          <ImageWithFallback
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            URP
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900">{item.productName}</div>
                        {item.exactSouvenir && (
                          <div className="text-sm text-[#1b4332]">{item.exactSouvenir}</div>
                        )}
                        {options && <div className="mt-1 text-xs text-gray-500">{options}</div>}
                        <div className="mt-2 text-sm font-medium text-gray-900">
                          {formatMoney(item.unitPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6 space-y-4">
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cart-name">Nombre</Label>
                  <Input
                    id="cart-name"
                    className="mt-2"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cart-email">Correo</Label>
                  <Input
                    id="cart-email"
                    type="email"
                    className="mt-2"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cart-phone">Teléfono</Label>
                  <Input
                    id="cart-phone"
                    className="mt-2"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <SheetFooter>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-lg font-bold text-gray-900">{formatMoney(subtotal)}</span>
          </div>
          <Button
            type="button"
            className="w-full bg-[#1b4332] hover:bg-[#2d6a4f]"
            disabled={!canCheckout || isSubmitting}
            onClick={handleCheckout}
          >
            {isSubmitting ? 'Finalizando...' : 'Finalizar pedido'}
          </Button>
          {checkoutMessage && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {checkoutMessage}
            </div>
          )}
          {checkoutError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {checkoutError}
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
