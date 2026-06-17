import { MousePointerClick, Palette, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { StaggerChildren, staggerItem, AnimateOnScroll } from './AnimateOnScroll';
import { Button } from './ui/button';

const steps = [
  {
    number: '01',
    icon: MousePointerClick,
    title: 'Elegir producto',
    description:
      'Selecciona el souvenir que deseas personalizar desde nuestro catálogo: camisetas, tazas, posters y más.',
    color: 'bg-emerald-800',
    iconColor: 'text-emerald-800 bg-emerald-50',
  },
  {
    number: '02',
    icon: Palette,
    title: 'Personalizar',
    description:
      'Completa tu nombre, carrera y año de graduación. Puedes subir fotos y ver los mockups 2D y 3D en tiempo real.',
    color: 'bg-primary',
    iconColor: 'text-primary bg-emerald-50',
  },
  {
    number: '03',
    icon: ShoppingBag,
    title: 'Finalizar pedido',
    description:
      'Descarga tu imagen de diseño personalizada o agrégala al carrito para ordenar la impresión física de calidad.',
    color: 'bg-teal-600',
    iconColor: 'text-teal-600 bg-teal-50',
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-gray-50 py-16 sm:py-24 border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <AnimateOnScroll className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-base text-gray-600 sm:text-lg">
            Tres simples pasos para crear tu souvenir universitario perfecto
          </p>
        </AnimateOnScroll>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connection Lines (Desktop only) */}
          <div 
            className="hidden md:block absolute left-[16%] right-[16%] h-0.5 bg-gray-200 z-0" 
            style={{ top: '32px' }} 
          />

          <StaggerChildren className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <motion.div key={index} variants={staggerItem} className="relative z-10 flex flex-col items-center">
                
                {/* Step Circle */}
                <div className={`w-16 h-16 ${step.color} text-white rounded-full flex items-center justify-center font-display font-black text-2xl shadow-md z-20 group-hover:scale-105 transition-transform duration-300`}>
                  {step.number}
                </div>

                {/* Card container */}
                <Card className="mt-[-32px] pt-12 p-6 rounded-2xl border border-gray-200/60 bg-white text-center shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center h-full w-full">
                  
                  {/* Floating Icon Box */}
                  <div className={`w-10 h-10 ${step.iconColor} rounded-lg flex items-center justify-center mb-4 mt-2 shadow-inner`}>
                    <step.icon className="w-5 h-5" />
                  </div>

                  {/* Text */}
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>

        {/* Action Nudge */}
        <AnimateOnScroll delay={0.2} className="text-center mt-16">
          <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest">
            ¿Listo para comenzar a diseñar?
          </p>
          <Button
            size="lg"
            onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-emerald-950/10 h-12 px-8 rounded-xl active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Crear mi diseño ahora
            <MousePointerClick className="ml-2 h-4 w-4" />
          </Button>
        </AnimateOnScroll>

      </div>
    </section>
  );
}
