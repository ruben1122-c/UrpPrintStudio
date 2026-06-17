import { useState } from 'react';
import { CheckCircle2, Mail, MessageSquare, Phone, Send, User, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
    const base = 'mt-2 pr-10';
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
    <section id="contacto" className="bg-gray-50 py-14 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#1b4332]/10 px-4 py-2 rounded-full mb-4">
              <MessageSquare className="w-4 h-4 text-[#1b4332]" />
              <span className="text-sm font-semibold text-[#1b4332]">Contacto</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Envíanos tu consulta
            </h2>
            <p className="text-base text-gray-600 sm:text-lg">
              ¿Tienes dudas sobre productos, pedidos o personalización? Escríbenos.
            </p>
          </div>

          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="contact-name">
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
                    className={`pl-10 ${inputClass('fullName')}`}
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
                  <Label htmlFor="contact-email">
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
                      className={`pl-10 ${inputClass('email')}`}
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
                  <Label htmlFor="contact-phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact-phone"
                      placeholder="Ej: 999888777"
                      maxLength={9}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      onBlur={() => markTouched('phone')}
                      className={`pl-10 ${inputClass('phone')}`}
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
                <Label htmlFor="contact-subject">Asunto</Label>
                <Input
                  id="contact-subject"
                  placeholder="Ej: Consulta sobre precios"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="contact-message">
                  Mensaje <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="contact-message"
                  placeholder="Escribe tu consulta acá..."
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  onBlur={() => markTouched('message')}
                  className={`mt-2 min-h-28 ${touched.has('message') ? (fieldErrors.message ? 'border-red-400 focus-visible:ring-red-400' : 'border-green-400 focus-visible:ring-green-400') : ''}`}
                />
                {touched.has('message') && fieldErrors.message && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.message}</p>
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
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
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
          </Card>
        </div>
      </div>
    </section>
  );
}
