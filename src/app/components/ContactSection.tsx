import { useState } from 'react';
import { CheckCircle2, Mail, MessageSquare, Phone, Send, User, XCircle, MapPin, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AnimateOnScroll } from './AnimateOnScroll';
import { apiRequest } from '@/lib/api';

type ContactField = 'fullName' | 'email' | 'phone' | 'message';

function validateContactField(name: ContactField, value: string): string | null {
  const trimmed = value.trim();
  switch (name) {
    case 'fullName':
      if (!trimmed) return 'El nombre es obligatorio';
      if (/\d/.test(trimmed)) return 'El nombre no puede contener números';
      return null;
    case 'email':
      if (!trimmed) return 'El correo es obligatorio';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Ingresa un correo válido';
      return null;
    case 'phone':
      if (!trimmed) return null; // opcional
      if (!/^\d{9}$/.test(trimmed.replace(/\s/g, ''))) return 'Ingresa un número válido de 9 dígitos';
      return null;
    case 'message':
      if (!trimmed) return 'El mensaje es obligatorio';
      if (trimmed.length < 10) return 'Escribe al menos 10 caracteres';
      return null;
  }
}

const CONTACT_FIELDS: ContactField[] = ['fullName', 'email', 'message'];

export function ContactSection() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const markTouched = (name: ContactField) => {
    setTouched((prev) => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const fieldErrors: Record<string, string | null> = {};
  for (const name of CONTACT_FIELDS) {
    if (touched.has(name)) {
      fieldErrors[name] = validateContactField(name, form[name]);
    }
  }
  if (touched.has('phone')) {
    fieldErrors.phone = validateContactField('phone', form.phone);
  }

  const isFormValid = CONTACT_FIELDS.every((name) => !validateContactField(name, form[name]));

  const inputClass = (name: ContactField) => {
    const base = 'mt-2 pr-10 rounded-lg';
    if (!touched.has(name)) return base;
    return fieldErrors[name]
      ? `${base} border-red-400 focus-visible:ring-red-400`
      : `${base} border-green-400 focus-visible:ring-green-400`;
  };

  const handleSubmit = async () => {
    setSubmitMessage(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await apiRequest('/api/contact', {
        method: 'POST',
        body: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        },
      });

      setSubmitMessage('Mensaje enviado correctamente. Nos pondremos en contacto pronto.');
      setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
      setTouched(new Set());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="bg-white py-16 sm:py-24 border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <AnimateOnScroll className="mb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full mb-3 text-primary">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Contacto</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            ¿Tienes alguna consulta?
          </h2>
          <p className="text-base text-gray-600 sm:text-lg">
            Estamos aquí para ayudarte con tus diseños, pedidos especiales o dudas corporativas.
          </p>
        </AnimateOnScroll>

        {/* 2-Column Layout Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-stretch mt-8">
          
          {/* Left Column: Info Card */}
          <AnimateOnScroll direction="left" className="lg:col-span-5 flex">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c2119] via-primary to-[#2d6a4f] p-8 text-white flex flex-col justify-between w-full shadow-lg">
              
              {/* Background glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-[50px] pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="font-display text-2xl font-extrabold tracking-tight mb-2">
                    Información de contacto
                  </h3>
                  <p className="text-emerald-100/80 text-sm leading-relaxed">
                    Escríbenos directamente o visítanos en nuestro punto de recojo dentro de la Universidad Ricardo Palma.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shadow-inner shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-emerald-300 uppercase tracking-wider">Punto de Recojo</h4>
                      <p className="text-sm mt-1 text-emerald-50">
                        Av. Alfredo Benavides 5440, Santiago de Surco<br />
                        Lima, Perú (Frente al Edificio Administrativo URP)
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shadow-inner shrink-0 mt-0.5">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-emerald-300 uppercase tracking-wider">Llámanos / WhatsApp</h4>
                      <p className="text-sm mt-1 text-emerald-50 hover:text-emerald-200 transition-colors">
                        <a href="tel:+51999888777">+51 999 888 777</a>
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shadow-inner shrink-0 mt-0.5">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-emerald-300 uppercase tracking-wider">Correo Electrónico</h4>
                      <p className="text-sm mt-1 text-emerald-50 hover:text-emerald-200 transition-colors">
                        <a href="mailto:soporte@urpprintstudio.com">soporte@urpprintstudio.com</a>
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shadow-inner shrink-0 mt-0.5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-emerald-300 uppercase tracking-wider">Horario de Atención</h4>
                      <p className="text-sm mt-1 text-emerald-50">
                        Lunes a Viernes: 8:00 AM - 6:00 PM<br />
                        Sábados: 9:00 AM - 1:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative accent */}
              <div className="relative z-10 pt-6 border-t border-white/10 mt-8 text-xs text-emerald-100/60 font-semibold uppercase tracking-widest">
                © URP PrintStudio • Hecho con orgullo
              </div>
            </div>
          </AnimateOnScroll>

          {/* Right Column: Contact Form */}
          <AnimateOnScroll direction="right" className="lg:col-span-7 flex">
            <Card className="p-6 sm:p-8 rounded-2xl border border-gray-200/60 bg-white flex flex-col justify-between w-full shadow-sm">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="contact-name" className="text-sm font-semibold text-gray-700">
                    Nombre completo <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact-name"
                      placeholder="Ej: Juan Pérez"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      onBlur={() => markTouched('fullName')}
                      className={`pl-10 h-11 ${inputClass('fullName')}`}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contact-email" className="text-sm font-semibold text-gray-700">
                      Correo <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="Ej: alumno@urp.edu.pe"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        onBlur={() => markTouched('email')}
                        className={`pl-10 h-11 ${inputClass('email')}`}
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
                    <Label htmlFor="contact-phone" className="text-sm font-semibold text-gray-700">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="contact-phone"
                        placeholder="Ej: 999888777"
                        maxLength={9}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        onBlur={() => markTouched('phone')}
                        className={`pl-10 h-11 ${inputClass('phone')}`}
                      />
                      {touched.has('phone') &&
                        (fieldErrors.phone ? (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                        ) : (
                          form.phone.trim() && (
                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          )
                        ))}
                    </div>
                    {touched.has('phone') && fieldErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact-subject" className="text-sm font-semibold text-gray-700">Asunto</Label>
                  <Input
                    id="contact-subject"
                    placeholder="Ej: Consulta sobre precios corporativos o promociones"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="mt-2 h-11 rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-message" className="text-sm font-semibold text-gray-700">
                    Mensaje <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Escribe tu consulta acá detalladamente..."
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    onBlur={() => markTouched('message')}
                    className={`mt-2 min-h-28 rounded-lg ${touched.has('message') ? (fieldErrors.message ? 'border-red-400 focus-visible:ring-red-400' : 'border-green-400 focus-visible:ring-green-400') : ''}`}
                  />
                  {touched.has('message') && fieldErrors.message && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.message}</p>
                  )}
                </div>

                <Button
                  className={`w-full h-11 font-semibold rounded-lg mt-4 cursor-pointer active:scale-95 transition-all duration-200 ${
                    isFormValid
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-emerald-950/10'
                      : 'bg-gray-200 text-gray-400 hover:bg-gray-200'
                  }`}
                  disabled={isSubmitting || !isFormValid}
                  onClick={handleSubmit}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                </Button>

                {submitMessage && (
                  <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2.5 text-sm text-green-700 border border-green-200/50 mt-3 animate-in fade-in duration-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    <span>{submitMessage}</span>
                  </div>
                )}
                {submitError && (
                  <div className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700 border border-red-200/50 mt-3 animate-in fade-in duration-200">
                    {submitError}
                  </div>
                )}
              </div>
            </Card>
          </AnimateOnScroll>

        </div>
      </div>
    </section>
  );
}
