import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CheckCircle2, Eye, EyeOff, LogOut, Mail, PackageCheck, ShieldCheck, UserCircle2, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getCurrentSession, getMyProfile, onAuthStateChange, signInWithEmail, signOut, signUpWithEmail } from '@/services/auth';
import { getMyOrders } from '@/services/orders';
import type { Profile, UserOrder } from '@/types/database';

type AuthField = 'email' | 'password' | 'confirmPassword' | 'fullName';

function validateAuthField(name: AuthField, value: string): string | null {
  const trimmed = value.trim();
  switch (name) {
    case 'email':
      if (!trimmed) return 'El correo es obligatorio';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Ingresa un correo válido';
      return null;
    case 'password':
      if (!trimmed) return 'La contraseña es obligatoria';
      if (trimmed.length < 8) return 'Mínimo 8 caracteres';
      return null;
    case 'confirmPassword':
      return trimmed ? null : 'Confirma la contraseña';
    case 'fullName':
      if (!trimmed) return 'El nombre es obligatorio';
      if (/\d/.test(trimmed)) return 'El nombre no puede contener números';
      return null;
  }
}

type AuthSectionProps = {
  view: 'login' | 'account';
};

function getAuthRedirect(next: string | null) {
  if (next === 'checkout') return '/?checkout=1';
  if (next === 'cuenta') return '/cuenta';
  if (next?.startsWith('/') && !next.startsWith('//')) return next;
  return '/';
}

export function AuthSection({ view }: AuthSectionProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<Set<string>>(new Set());

  const markTouched = (name: AuthField) => {
    setTouched((prev) => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const getAuthFieldError = (name: AuthField) => {
    const baseError = validateAuthField(name, form[name]);
    if (baseError) return baseError;
    if (name === 'confirmPassword' && form.password !== form.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  };

  const fieldErrors: Record<string, string | null> = {};
  const authFields: AuthField[] = mode === 'signup'
    ? ['fullName', 'email', 'password', 'confirmPassword']
    : ['email', 'password'];

  for (const name of authFields) {
    if (touched.has(name)) {
      fieldErrors[name] = getAuthFieldError(name);
    }
  }

  const isFormValid = authFields.every((name) => !getAuthFieldError(name));
  const next = searchParams.get('next');

  const inputClass = (name: AuthField) => {
    const base = name === 'password' || name === 'confirmPassword' ? 'mt-2 pr-20' : 'mt-2 pr-10';
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
    if (view !== 'account') {
      setProfile(null);
      setOrders([]);
      return;
    }

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
  }, [session, view]);

  useEffect(() => {
    if (view === 'login' && session) {
      navigate(getAuthRedirect(next), { replace: true });
    }
  }, [navigate, next, session, view]);

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

        await signUpWithEmail(form.email.trim(), form.password, form.fullName.trim());
        await signInWithEmail(form.email.trim(), form.password);
        setMessage('Cuenta creada y perfil configurado correctamente.');
      }

      navigate(getAuthRedirect(next), { replace: true });
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
    <section className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 sm:py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-[#1b4332]/10 px-4 py-2 rounded-full mb-4">
            <UserCircle2 className="h-4 w-4 text-[#1b4332]" />
            <span className="text-sm font-semibold text-[#1b4332]">
              {view === 'login' ? 'Acceso a la web' : 'Cuenta y pedidos'}
            </span>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
            {view === 'login' ? 'Ingresa a URP PrintStudio' : 'Tu espacio URP PrintStudio'}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            {view === 'login'
              ? 'Inicia sesión o crea tu cuenta para entrar a URP PrintStudio.'
              : 'Revisa tus datos y el historial de pedidos asociado a tu cuenta.'}
          </p>
        </div>

        {view === 'account' && !session ? (
          <Card className="mx-auto max-w-xl overflow-hidden border-gray-200 shadow-sm">
            <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] p-5 text-white sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 mb-4">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold sm:text-2xl">Acceso requerido</h3>
              <p className="mt-2 text-sm text-white/80">
                Inicia sesión para ver tus pedidos y datos de cuenta.
              </p>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Puedes seguir navegando y agregando productos al carrito sin iniciar sesión. Solo te pediremos acceso al finalizar la compra.
              </div>
              <Button className="w-full bg-[#1b4332] hover:bg-[#2d6a4f]" asChild>
                <Link to="/login?next=cuenta">Iniciar sesión</Link>
              </Button>
            </div>
          </Card>
        ) : (
        <div className={view === 'account'
          ? 'grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8'
          : 'mx-auto grid max-w-xl gap-8 items-start'}>
          <Card className="overflow-hidden border-gray-200 shadow-sm">
            <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] p-5 text-white sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 mb-4">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold sm:text-2xl">
                {view === 'login' ? 'Acceso URP PrintStudio' : 'Cuenta URP PrintStudio'}
              </h3>
              <p className="mt-2 text-sm text-white/80">
                {session
                  ? 'Tu sesión está activa y lista para finalizar pedidos.'
                  : 'Inicia sesión o crea tu cuenta para entrar a la web.'}
              </p>
            </div>

            <div className="p-4 sm:p-6">
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
                      className={`rounded-md px-2 py-2 text-sm font-semibold transition-colors sm:px-3 ${
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
                      className={`rounded-md px-2 py-2 text-sm font-semibold transition-colors sm:px-3 ${
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
                          ? 'Usa tus credenciales para entrar a la web.'
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        onBlur={() => markTouched('password')}
                        className={inputClass('password')}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {touched.has('password') &&
                        (fieldErrors.password ? (
                          <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                        ) : (
                          <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        ))}
                    </div>
                    {touched.has('password') && fieldErrors.password && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
                    )}
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <Label htmlFor="auth-confirm-password">Confirmar contraseña</Label>
                      <div className="relative">
                        <Input
                          id="auth-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repite tu contraseña"
                          value={form.confirmPassword}
                          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                          onBlur={() => markTouched('confirmPassword')}
                          className={inputClass('confirmPassword')}
                        />
                        <button
                          type="button"
                          aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        {touched.has('confirmPassword') &&
                          (fieldErrors.confirmPassword ? (
                            <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                          ) : (
                            <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          ))}
                      </div>
                      {touched.has('confirmPassword') && fieldErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}

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

          {view === 'account' && (
          <Card className="overflow-hidden border-gray-200 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mis pedidos</h3>
                <p className="text-sm text-gray-600">Historial asociado a tu cuenta.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1b4332]/10 text-[#1b4332]">
                <PackageCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {session ? (
                orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{order.order_code}</div>
                          <div className="text-sm text-gray-600">{order.status} · {order.payment_status}</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="font-semibold text-[#1b4332]">S/. {order.total_amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center sm:p-8">
                    <PackageCheck className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                    <div className="font-semibold text-gray-900">Aún no tienes pedidos</div>
                    <p className="mt-1 text-sm text-gray-600">
                      Cuando finalices una compra, aparecerá acá.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center sm:p-8">
                  <Mail className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                  <div className="font-semibold text-gray-900">Inicia sesión para ver tus pedidos</div>
                  <p className="mt-1 text-sm text-gray-600">
                    Tus compras se guardan automáticamente cuando finalizas el pedido.
                  </p>
                </div>
              )}
            </div>
          </Card>
          )}
        </div>
        )}
      </div>
    </section>
  );
}
