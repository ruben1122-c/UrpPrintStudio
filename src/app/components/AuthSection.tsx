import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CheckCircle2, LogOut, Mail, PackageCheck, ShieldCheck, UserCircle2, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getCurrentSession, getMyProfile, onAuthStateChange, signInWithEmail, signOut, signUpWithEmail } from '@/services/auth';
import { getMyOrders } from '@/services/orders';
import type { Profile, UserOrder } from '@/types/database';

type AuthField = 'email' | 'password' | 'fullName';

function validateAuthField(name: AuthField, value: string): string | null {
  const trimmed = value.trim();
  switch (name) {
    case 'email':
      if (!trimmed) return 'El correo es obligatorio';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Ingresa un correo válido';
      return null;
    case 'password':
      if (!trimmed) return 'La contraseña es obligatoria';
      if (trimmed.length < 6) return 'Mínimo 6 caracteres';
      return null;
    case 'fullName':
      if (!trimmed) return 'El nombre es obligatorio';
      if (/\d/.test(trimmed)) return 'El nombre no puede contener números';
      return null;
  }
}

export function AuthSection() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [touched, setTouched] = useState<Set<string>>(new Set());

  const markTouched = (name: AuthField) => {
    setTouched((prev) => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const fieldErrors: Record<string, string | null> = {};
  const authFields: AuthField[] = mode === 'signup'
    ? ['fullName', 'email', 'password']
    : ['email', 'password'];

  for (const name of authFields) {
    if (touched.has(name)) {
      fieldErrors[name] = validateAuthField(name, form[name]);
    }
  }

  const isFormValid = authFields.every((name) => !validateAuthField(name, form[name]));

  const inputClass = (name: AuthField) => {
    const base = 'mt-2 pr-10';
    if (!touched.has(name)) return base;
    return fieldErrors[name]
      ? `${base} border-red-400 focus-visible:ring-red-400`
      : `${base} border-green-400 focus-visible:ring-green-400`;
  };

  useEffect(() => {
    getCurrentSession()
      .then(setSession)
      .catch((sessionError) => setError(sessionError.message));

    return onAuthStateChange(setSession);
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setOrders([]);
      return;
    }

    const refreshOrders = () => {
      getMyOrders()
        .then(setOrders)
        .catch((ordersError) => setError(ordersError.message));
    };

    getMyProfile()
      .then(setProfile)
      .catch((profileError) => setError(profileError.message));

    refreshOrders();
    window.addEventListener('urp:orders-changed', refreshOrders);

    return () => window.removeEventListener('urp:orders-changed', refreshOrders);
  }, [session]);

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(form.email.trim(), form.password);
        setMessage('Sesión iniciada correctamente.');
      } else {
        if (!form.fullName.trim()) {
          throw new Error('Ingresa tu nombre completo para crear tu perfil.');
        }

        const result = await signUpWithEmail(form.email.trim(), form.password, form.fullName.trim());
        setMessage('Cuenta creada y perfil configurado correctamente.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar la operación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setMessage(null);
    setError(null);

    try {
      await signOut();
      setMessage('Sesión cerrada.');
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'No se pudo cerrar sesión.');
    }
  };

  return (
    <section id="cuenta" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1b4332]/10 px-4 py-2 rounded-full mb-4">
            <UserCircle2 className="h-4 w-4 text-[#1b4332]" />
            <span className="text-sm font-semibold text-[#1b4332]">Cuenta y pedidos</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Tu espacio URP PrintStudio
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accede para revisar tus pedidos y guardar tu historial sin bloquear la experiencia de compra.
          </p>
        </div>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
          <Card className="overflow-hidden border-gray-200 shadow-sm">
            <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] p-6 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 mb-4">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold">Cuenta URP PrintStudio</h3>
              <p className="mt-2 text-sm text-white/80">
                Inicia sesión o crea tu cuenta para asociar pedidos a tu perfil.
              </p>
            </div>

            <div className="p-6">
              {session ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#1b4332]/15 bg-[#1b4332]/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b4332] text-white">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#1b4332]">Sesión activa</div>
                        <div className="font-semibold text-gray-900 truncate">
                          {profile?.full_name || session.user.email}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{session.user.email}</div>
                        <div className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">
                          Rol: {profile?.role ?? 'customer'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-gray-300" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        mode === 'signin'
                          ? 'bg-white text-[#1b4332] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setMode('signin')}
                    >
                      Iniciar sesión
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                        mode === 'signup'
                          ? 'bg-white text-[#1b4332] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setMode('signup')}
                    >
                      Crear cuenta
                    </button>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-[#1b4332]" />
                      <p className="text-sm text-gray-600">
                        {mode === 'signin'
                          ? 'Usa tus credenciales para consultar tus pedidos guardados.'
                          : 'Tu cuenta queda lista para comprar sin validar el correo por bandeja.'}
                      </p>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <Label htmlFor="auth-name">Nombre completo</Label>
                      <div className="relative">
                        <Input
                          id="auth-name"
                          placeholder="Ej: Juan Pérez García"
                          value={form.fullName}
                          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                          onBlur={() => markTouched('fullName')}
                          className={inputClass('fullName')}
                        />
                        {touched.has('fullName') &&
                          (fieldErrors.fullName ? (
                            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                          ) : (
                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          ))}
                      </div>
                      {touched.has('fullName') && fieldErrors.fullName && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="auth-email">Correo</Label>
                    <div className="relative">
                      <Input
                        id="auth-email"
                        type="email"
                        placeholder="Ej: alumno@urp.edu.pe"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        onBlur={() => markTouched('email')}
                        className={inputClass('email')}
                      />
                      {touched.has('email') &&
                        (fieldErrors.email ? (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                        ) : (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        ))}
                    </div>
                    {touched.has('email') && fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="auth-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="auth-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        onBlur={() => markTouched('password')}
                        className={inputClass('password')}
                      />
                      {touched.has('password') &&
                        (fieldErrors.password ? (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                        ) : (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        ))}
                    </div>
                    {touched.has('password') && fieldErrors.password && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
                    )}
                  </div>

                  <Button
                    className={
                      isFormValid
                        ? 'w-full bg-[#1b4332] hover:bg-[#2d6a4f]'
                        : 'w-full bg-gray-300 text-gray-500'
                    }
                    disabled={isSubmitting || !isFormValid}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? 'Procesando...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
                  </Button>
                </div>
              )}

              {message && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden border-gray-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mis pedidos</h3>
                <p className="text-sm text-gray-600">Historial asociado a tu cuenta.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1b4332]/10 text-[#1b4332]">
                <PackageCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="p-6">
              {session ? (
                orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                        <div>
                          <div className="font-semibold text-gray-900">{order.order_code}</div>
                          <div className="text-sm text-gray-600">{order.status} · {order.payment_status}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[#1b4332]">S/. {order.total_amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <PackageCheck className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                    <div className="font-semibold text-gray-900">Aún no tienes pedidos</div>
                    <p className="mt-1 text-sm text-gray-600">
                      Cuando finalices una compra, aparecerá acá.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <Mail className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                  <div className="font-semibold text-gray-900">Inicia sesión para ver tus pedidos</div>
                  <p className="mt-1 text-sm text-gray-600">
                    Tus compras se guardan automáticamente cuando finalizas el pedido.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
