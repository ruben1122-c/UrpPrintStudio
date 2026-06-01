import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CheckCircle2, LockKeyhole, Minus, Plus, ShoppingCart, ShieldCheck, Trash2 } from 'lucide-react';
import { getCurrentSession, onAuthStateChange, signInWithEmail, signUpWithEmail } from '@/services/auth';
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

type CheckoutContact = {
  name: string;
  email: string;
  phone: string;
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

function StepBadge({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b4332] text-white">
        {number}
      </span>
      {label}
    </div>
  );
}

export function CartPanel({ className, label }: CartPanelProps) {
  const { items, itemCount, subtotal, clearCart, removeItem, updateQuantity } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authFullName, setAuthFullName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const firstItem = items[0];

  useEffect(() => {
    if (!firstItem) return;
    setCustomerName((current) => current || firstItem.customerName);
    setCustomerEmail((current) => current || firstItem.customerEmail);
    setCustomerPhone((current) => current || firstItem.customerPhone);
    setAuthFullName((current) => current || firstItem.customerName);
    setAuthEmail((current) => current || firstItem.customerEmail);
  }, [firstItem]);

  useEffect(() => {
    getCurrentSession()
      .then((currentSession) => {
        setSession(currentSession);
        if (currentSession?.user.email) {
          setCustomerEmail((current) => current || currentSession.user.email || '');
        }
      })
      .catch((error) => setCheckoutError(error.message));

    return onAuthStateChange((currentSession) => {
      setSession(currentSession);
      if (currentSession?.user.email) {
        setCustomerEmail((current) => current || currentSession.user.email || '');
      }
    });
  }, []);

  const canCheckout = useMemo(() => {
    return items.length > 0 && Boolean(customerName.trim()) && Boolean(customerEmail.trim());
  }, [customerEmail, customerName, items.length]);

  const submitCartOrder = async (contact?: CheckoutContact) => {
    const checkoutContact = contact ?? {
      name: customerName.trim(),
      email: customerEmail.trim(),
      phone: customerPhone.trim(),
    };

    setIsSubmitting(true);

    try {
      const order = await createCartCheckout({
        customer_name: checkoutContact.name,
        customer_email: checkoutContact.email,
        customer_phone: checkoutContact.phone || null,
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

  const handleCheckout = async () => {
    setCheckoutMessage(null);
    setCheckoutError(null);

    if (!canCheckout) {
      setCheckoutError('Completa nombre y correo para finalizar el pedido.');
      return;
    }

    if (!session) {
      setShowAuthForm(true);
      setAuthFullName((current) => current || customerName);
      setAuthEmail((current) => current || customerEmail);
      return;
    }

    await submitCartOrder();
  };

  const handleAuthSubmit = async () => {
    setCheckoutMessage(null);
    setCheckoutError(null);

    const email = authEmail.trim() || customerEmail.trim();
    const password = authPassword.trim();
    const fullName = authFullName.trim() || customerName.trim();

    if (!email || !password || (authMode === 'signup' && !fullName)) {
      setCheckoutError('Completa los datos de acceso para continuar.');
      return;
    }

    if (password.length < 8) {
      setCheckoutError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsAuthSubmitting(true);

    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password, fullName);
        await signInWithEmail(email, password);
        setCustomerName((current) => current || fullName);
      } else {
        await signInWithEmail(email, password);
      }

      setCustomerEmail((current) => current || email);
      setShowAuthForm(false);
      setAuthPassword('');
      await submitCartOrder({
        name: customerName.trim() || fullName,
        email,
        phone: customerPhone.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      setCheckoutError(message);
    } finally {
      setIsAuthSubmitting(false);
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
          <SheetDescription>Revisa tus souvenirs y finaliza un solo pedido.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <div className="font-semibold text-gray-900">Tu carrito está vacío</div>
              <p className="mt-1 text-sm text-gray-500">
                Agrega un souvenir personalizado para continuar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <StepBadge number="1" label="Souvenirs seleccionados" />
              {items.map((item) => {
                const options = formatOptions(item.productOptions);

                return (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
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
              <StepBadge number="2" label="Datos de contacto" />
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
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
              {showAuthForm && !session && (
                <div className="rounded-lg border border-[#1b4332]/20 bg-gradient-to-br from-[#1b4332]/10 to-white p-4">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1b4332] text-white">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div>
                      <StepBadge number="3" label="Acceso para finalizar" />
                      <div className="mt-2 font-semibold text-gray-900">Completa tu compra con una cuenta</div>
                      <div className="text-sm text-gray-600">
                        No necesitas validar correo por bandeja para continuar.
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 grid grid-cols-2 rounded-lg bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        authMode === 'signin'
                          ? 'bg-[#1b4332] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setAuthMode('signin')}
                    >
                      Iniciar sesión
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        authMode === 'signup'
                          ? 'bg-[#1b4332] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setAuthMode('signup')}
                    >
                      Crear cuenta
                    </button>
                  </div>
                  <div className="space-y-3">
                    {authMode === 'signup' && (
                      <div>
                        <Label htmlFor="cart-auth-name">Nombre completo</Label>
                        <Input
                          id="cart-auth-name"
                          className="mt-2 bg-white"
                          placeholder="Ej: Juan Pérez García"
                          value={authFullName}
                          onChange={(event) => setAuthFullName(event.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="cart-auth-email">Correo</Label>
                      <Input
                        id="cart-auth-email"
                        type="email"
                        className="mt-2 bg-white"
                        placeholder="Ej: alumno@urp.edu.pe"
                        value={authEmail}
                        onChange={(event) => setAuthEmail(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cart-auth-password">Contraseña</Label>
                      <Input
                        id="cart-auth-password"
                        type="password"
                        className="mt-2 bg-white"
                        placeholder="Mínimo 8 caracteres"
                        value={authPassword}
                        onChange={(event) => setAuthPassword(event.target.value)}
                      />
                    </div>
                    <div className="flex items-start gap-2 rounded-md bg-white px-3 py-2 text-xs text-gray-600">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-[#1b4332]" />
                      El pedido quedará asociado a tu cuenta para que puedas revisarlo luego.
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-[#1b4332] hover:bg-[#2d6a4f]"
                      disabled={isAuthSubmitting || isSubmitting}
                      onClick={handleAuthSubmit}
                    >
                      {isAuthSubmitting ? 'Validando...' : 'Continuar compra'}
                    </Button>
                  </div>
                </div>
              )}
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
