import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CheckCircle2, LogOut, UserCircle2, XCircle } from 'lucide-react';
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
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserCircle2 className="h-6 w-6 text-[#1b4332]" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Cuenta URP PrintStudio</h2>
                <p className="text-sm text-gray-600">Inicia sesión para asociar diseños y pedidos a tu perfil.</p>
              </div>
            </div>

            {session ? (
              <div className="space-y-4">
                <div className="rounded-md bg-white p-4 border border-gray-200">
                  <div className="text-sm text-gray-500">Sesión activa</div>
                  <div className="font-semibold text-gray-900">{profile?.full_name || session.user.email}</div>
                  <div className="text-sm text-gray-600">{session.user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">Rol: {profile?.role ?? 'customer'}</div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={mode === 'signin' ? 'default' : 'outline'}
                    className={mode === 'signin' ? 'bg-[#1b4332] hover:bg-[#2d6a4f]' : ''}
                    onClick={() => setMode('signin')}
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    variant={mode === 'signup' ? 'default' : 'outline'}
                    className={mode === 'signup' ? 'bg-[#1b4332] hover:bg-[#2d6a4f]' : ''}
                    onClick={() => setMode('signup')}
                  >
                    Registrarse
                  </Button>
                </div>

                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="auth-name">Nombre completo</Label>
                    <div className="relative">
                      <Input
                        id="auth-name"
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

            {message && <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}
            {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mis pedidos</h3>
            {session ? (
              orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-4">
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
                <div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                  Todavía no tienes pedidos asociados a tu cuenta.
                </div>
              )
            ) : (
              <div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                Inicia sesión para ver tus pedidos guardados.
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
