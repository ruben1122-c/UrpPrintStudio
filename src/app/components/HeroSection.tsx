import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function HeroSection() {
  return (
    <section id="inicio" className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Crea tu souvenir universitario <span className="text-[#95d5b2]">personalizado</span>
            </h1>
            <p className="text-lg text-gray-200">
              Diseña y personaliza productos únicos con la identidad de tu universidad. 
              Camisetas, tazas, pósters y más con tu estilo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-[#1b4332] hover:bg-gray-100"
                onClick={() => document.getElementById('personalizar')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Empieza ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white bg-white/15 text-white shadow-sm hover:bg-white hover:text-[#1b4332]"
                onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver productos
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-gray-300">Diseños creados</div>
              </div>
              <div>
                <div className="text-3xl font-bold">1000+</div>
                <div className="text-sm text-gray-300">Estudiantes felices</div>
              </div>
            </div>
          </div>

          {/* Image/Mockup */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1594686900103-3c9698dbb31b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBoYXBweXxlbnwxfHx8fDE3NzU2OTM0NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Estudiantes universitarios felices"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
            {/* Floating cards */}
            <div className="absolute -bottom-4 -left-4 bg-white text-gray-900 p-4 rounded-lg shadow-xl">
              <div className="text-sm font-semibold">✨ Diseño fácil</div>
              <div className="text-xs text-gray-600">En minutos</div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white text-gray-900 p-4 rounded-lg shadow-xl">
              <div className="text-sm font-semibold">🎓 100% URP</div>
              <div className="text-xs text-gray-600">Identidad universitaria</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
