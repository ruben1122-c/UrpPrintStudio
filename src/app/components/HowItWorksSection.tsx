import { MousePointerClick, Palette, Download } from 'lucide-react';
import { Card } from './ui/card';

const steps = [
  {
    number: '01',
    icon: MousePointerClick,
    title: 'Elegir producto',
    description:
      'Selecciona el tipo de souvenir que quieres personalizar: camiseta, taza, póster, pin URP, tote bag o stickers.',
    color: 'bg-blue-500',
  },
  {
    number: '02',
    icon: Palette,
    title: 'Personalizar',
    description:
      'Agrega tu nombre, carrera, año de graduación y foto. Observa el resultado en tiempo real mientras diseñas.',
    color: 'bg-[#1b4332]',
  },
  {
    number: '03',
    icon: Download,
    title: 'Agregar al carrito',
    description:
      'Descarga tu diseño o agrégalo al carrito para finalizar un pedido con tus souvenirs.',
    color: 'bg-purple-500',
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tres simples pasos para crear tu souvenir universitario perfecto
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Lines (hidden on mobile) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gray-300 z-0" style={{ top: '80px' }}></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10">
              <Card className="p-8 h-full hover:shadow-xl transition-shadow duration-300">
                {/* Step Number */}
                <div className="flex items-center mb-6">
                  <div className={`${step.color} text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl`}>
                    {step.number}
                  </div>
                  <div className="ml-auto">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <step.icon className={`w-6 h-6 ${step.color === 'bg-[#1b4332]' ? 'text-[#1b4332]' : step.color === 'bg-blue-500' ? 'text-blue-500' : 'text-purple-500'}`} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow indicator for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-16 text-gray-300 text-4xl">
                    →
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            ¿Listo para comenzar? Personaliza tu souvenir en minutos
          </p>
          <button
            onClick={() => document.getElementById('personalizar')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center px-8 py-3 bg-[#1b4332] text-white rounded-lg hover:bg-[#2d6a4f] transition-colors duration-300 font-semibold"
          >
            Crear mi diseño ahora
            <MousePointerClick className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
