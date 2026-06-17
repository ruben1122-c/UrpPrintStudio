import { Palette, Download, Printer, Zap } from 'lucide-react';
import { Card } from './ui/card';

const benefits = [
  {
    icon: Palette,
    title: 'Personalización total',
    description:
      'Diseña productos únicos con tu nombre, carrera, foto y elementos personalizados.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Download,
    title: 'Descarga digital',
    description:
      'Obtén tu diseño en alta calidad para usarlo como fondo de pantalla, stickers digitales y más.',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Printer,
    title: 'Impresión bajo demanda',
    description:
      'Ordena la impresión de tu diseño en productos físicos con envío a domicilio.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Zap,
    title: 'Fácil y rápido',
    description:
      'Crea diseños profesionales en minutos sin necesidad de conocimientos de diseño.',
    color: 'from-orange-500 to-orange-600',
  },
];

export function BenefitsSection() {
  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Por qué elegir URP PrintStudio?
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            La manera más fácil de crear souvenirs universitarios personalizados
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="p-5 transition-shadow duration-300 hover:shadow-xl sm:p-6"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${benefit.color} rounded-lg flex items-center justify-center mb-4`}
              >
                <benefit.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600">{benefit.description}</p>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] p-5 text-center text-white sm:p-8 md:mt-16 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Únete a la comunidad URP PrintStudio
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-base text-gray-200 sm:text-lg">
            Miles de estudiantes ya han creado sus souvenirs personalizados. 
            Crea recuerdos únicos de tu vida universitaria.
          </p>
          <div className="max-w-3xl mx-auto">
            <p className="mb-4 text-lg font-semibold text-[#95d5b2] sm:text-xl md:text-2xl">
              Empieza gratis y transforma tus ideas en souvenirs memorables
            </p>
            <p className="text-gray-200">
              Sin límites de creatividad. Sin experiencia en diseño requerida. 
              Solo tú y tu imaginación.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
