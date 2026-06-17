import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function HeroSection() {
  return (
    <section id="inicio" className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] py-12 text-white sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
          {/* Text Content */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Crea tu souvenir universitario <span className="text-[#95d5b2]">personalizado</span>
            </h1>
            <p className="text-base leading-relaxed text-gray-200 sm:text-lg">
              Diseña y personaliza productos únicos con la identidad de tu universidad. 
              Camisetas, tazas, pósters y más con tu estilo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button 
                size="lg" 
                className="w-full bg-white text-[#1b4332] hover:bg-gray-100 sm:w-auto"
                onClick={() => document.getElementById('personalizar')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Empieza ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full border-2 border-white bg-white/15 text-white shadow-sm hover:bg-white hover:text-[#1b4332] sm:w-auto"
                onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver productos
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 sm:flex sm:items-center sm:gap-8 sm:pt-4">
              <div>
                <div className="text-2xl font-bold sm:text-3xl">500+</div>
                <div className="text-sm text-gray-300">Diseños creados</div>
              </div>
              <div>
                <div className="text-2xl font-bold sm:text-3xl">1000+</div>
                <div className="text-sm text-gray-300">Estudiantes felices</div>
              </div>
            </div>
          </div>

          {/* Image/Mockup */}
          <div className="relative mx-auto w-full max-w-xl md:max-w-none">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1594686900103-3c9698dbb31b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBoYXBweXxlbnwxfHx8fDE3NzU2OTM0NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Estudiantes universitarios felices"
                className="h-64 w-full object-cover sm:h-80 lg:h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
            {/* Floating cards */}
            <div className="absolute bottom-3 left-3 rounded-lg bg-white p-3 text-gray-900 shadow-xl sm:-bottom-4 sm:-left-4 sm:p-4">
              <div className="text-sm font-semibold">✨ Diseño fácil</div>
              <div className="text-xs text-gray-600">En minutos</div>
            </div>
            <div className="absolute right-3 top-3 rounded-lg bg-white p-3 text-gray-900 shadow-xl sm:-right-4 sm:-top-4 sm:p-4">
              <div className="text-sm font-semibold">🎓 100% URP</div>
              <div className="text-xs text-gray-600">Identidad universitaria</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
