import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Trophy, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HeroSectionProps {
  onCtaClick?: () => void;
}

function AnimatedCounter({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    let currentFrame = 0;
    const totalFrames = duration * 60;

    const timer = setInterval(() => {
      currentFrame++;
      start += increment;
      if (currentFrame >= totalFrames) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  const handleScrollToProducts = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="inicio" 
      className="relative overflow-hidden bg-gradient-to-br from-[#0c2119] via-[#1b4332] to-[#2d6a4f] py-16 text-white sm:py-24 lg:py-32"
    >
      {/* Decorative background grids and glowing lights */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
      
      {/* Glowing radial shapes */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-16">
          
          {/* Left Column: Text & CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="font-display text-xs font-semibold tracking-wider uppercase text-emerald-300">
                Universidad Ricardo Palma
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl text-white">
              Crea tu souvenir universitario{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white">
                personalizado
              </span>
            </h1>

            {/* Description */}
            <p className="text-base leading-relaxed text-emerald-100/80 sm:text-lg lg:text-xl max-w-lg">
              Diseña y personaliza productos de alta calidad con el orgullo URP. Camisetas, tazas, posters y accesorios a tu estilo en tiempo real.
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={handleScrollToProducts}
                className="w-full bg-white text-[#1b4332] hover:bg-emerald-50 active:scale-95 transition-all duration-200 font-semibold shadow-lg shadow-emerald-950/20 sm:w-auto h-12 px-8"
              >
                Empieza ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleScrollToProducts}
                className="w-full border border-white/20 bg-white/5 text-white shadow-sm hover:bg-white/10 active:scale-95 transition-all duration-200 sm:w-auto h-12 px-8"
              >
                Ver productos
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10 max-w-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl font-display text-white">
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  <AnimatedCounter end={500} suffix="+" />
                </div>
                <div className="text-xs sm:text-sm text-emerald-100/60 uppercase tracking-widest font-semibold">
                  Diseños creados
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl font-display text-white">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <AnimatedCounter end={1000} suffix="+" />
                </div>
                <div className="text-xs sm:text-sm text-emerald-100/60 uppercase tracking-widest font-semibold">
                  Alumnos felices
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Image with Floating Tags */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-md md:max-w-none lg:max-w-lg"
          >
            {/* Visual background blur behind the mockup */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl" />

            <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#0f281f]/40 p-2 backdrop-blur-sm">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1594686900103-3c9698dbb31b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBoYXBweXxlbnwxfHx8fDE3NzU2OTM0NzB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Estudiantes universitarios felices de la URP"
                className="h-72 w-full object-cover rounded-xl sm:h-96 lg:h-[420px]"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Floating glassmorphism badge 1 (bottom left) */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="absolute -bottom-5 left-4 md:-left-6 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                ✨
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">Editor 3D</div>
                <div className="text-sm font-bold text-white leading-tight">Diseño fácil y rápido</div>
              </div>
            </motion.div>

            {/* Floating glassmorphism badge 2 (top right) */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -top-5 right-4 md:-right-6 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md">
                🎓
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">Calidad URP</div>
                <div className="text-sm font-bold text-white leading-tight">100% Identidad</div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
