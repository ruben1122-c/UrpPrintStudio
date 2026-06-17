import { Palette, Download, Printer, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { StaggerChildren, staggerItem, AnimateOnScroll } from './AnimateOnScroll';

const benefits = [
  {
    icon: Palette,
    title: 'Personalización total',
    description:
      'Diseña productos únicos con tu nombre, carrera, foto y elementos personalizados.',
    color: 'from-emerald-600 to-teal-700',
  },
  {
    icon: Download,
    title: 'Descarga digital',
    description:
      'Obtén tu diseño en alta calidad para usarlo como fondo de pantalla, stickers digitales y más.',
    color: 'from-teal-600 to-emerald-700',
  },
  {
    icon: Printer,
    title: 'Impresión bajo demanda',
    description:
      'Ordena la impresión de tu diseño en productos físicos con envío a domicilio.',
    color: 'from-emerald-700 to-green-800',
  },
  {
    icon: Zap,
    title: 'Fácil y rápido',
    description:
      'Crea diseños profesionales en minutos sin necesidad de conocimientos de diseño.',
    color: 'from-emerald-500 to-green-600',
  },
];

export function BenefitsSection() {
  return (
    <section className="bg-white py-16 sm:py-24 border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <AnimateOnScroll className="mb-12 text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            ¿Por qué elegir URP PrintStudio?
          </h2>
          <p className="text-base text-gray-600 sm:text-lg">
            La manera más fácil de crear souvenirs universitarios personalizados
          </p>
        </AnimateOnScroll>

        {/* Benefits Grid */}
        <StaggerChildren className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <motion.div key={index} variants={staggerItem} className="flex">
              <Card
                className="p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 rounded-2xl bg-white border border-gray-100 flex flex-col w-full"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-5 shadow-sm text-white shrink-0`}
                >
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2.5">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-grow">
                  {benefit.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </StaggerChildren>

        {/* Additional Info */}
        <AnimateOnScroll delay={0.2} className="mt-14 md:mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#17382b] to-[#122c22] p-8 text-center text-white sm:p-12 md:p-16 shadow-2xl">
            {/* Background blurs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-400/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
              <h3 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight">
                Únete a la comunidad URP PrintStudio
              </h3>
              <p className="mx-auto max-w-2xl text-sm sm:text-base text-emerald-100/80 leading-relaxed">
                Miles de estudiantes ya han creado sus souvenirs personalizados. Crea recuerdos únicos de tu vida universitaria hoy mismo.
              </p>
              <div className="pt-4 max-w-2xl mx-auto border-t border-white/10 space-y-2">
                <p className="text-lg font-bold text-emerald-300 sm:text-xl font-display">
                  Empieza gratis y transforma tus ideas en souvenirs memorables
                </p>
                <p className="text-xs sm:text-sm text-emerald-100/60 font-medium">
                  Sin límites de creatividad. Sin experiencia requerida. Solo tu orgullo URP.
                </p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>

      </div>
    </section>
  );
}
