import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="bg-[#0c2119] text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-[#0c2119] font-display font-black text-xl">UP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-white text-xl leading-none">URP</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 leading-none mt-1">PrintStudio</span>
              </div>
            </Link>
            <p className="text-emerald-100/70 text-sm leading-relaxed max-w-xs">
              Crea souvenirs universitarios personalizados de alta calidad con el orgullo y la identidad de la Universidad Ricardo Palma.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-emerald-300 mb-5">Enlaces rápidos</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/#inicio" className="text-emerald-100/75 hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/#productos" className="text-emerald-100/75 hover:text-white transition-colors">
                  Productos
                </a>
              </li>
              <li>
                <a href="/#como-funciona" className="text-emerald-100/75 hover:text-white transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="/#contacto" className="text-emerald-100/75 hover:text-white transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-emerald-300 mb-5">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/cuenta" className="text-emerald-100/75 hover:text-white transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link to="/cuenta" className="text-emerald-100/75 hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/cuenta" className="text-emerald-100/75 hover:text-white transition-colors">
                  Política de devoluciones
                </Link>
              </li>
              <li>
                <Link to="/cuenta" className="text-emerald-100/75 hover:text-white transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-emerald-300 mb-5">Contacto</h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <a
                  href="mailto:soporte@urpprintstudio.com"
                  className="text-emerald-100/75 hover:text-white transition-colors"
                >
                  soporte@urpprintstudio.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <a
                  href="tel:+51999888777"
                  className="text-emerald-100/75 hover:text-white transition-colors"
                >
                  +51 999 888 777
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-100/75">
                  Av. Alfredo Benavides 5440, Surco, Lima, Perú
                </span>
              </li>
            </ul>

            {/* Social Media */}
            <div className="pt-4">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-emerald-400/80 mb-3">Síguenos</h4>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://www.instagram.com/madebyurp"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-emerald-100 transition-all hover:bg-white hover:text-[#0c2119] hover:scale-105"
                  aria-label="Instagram @madebyurp"
                  title="@madebyurp"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com/MadeByUrp"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-xs text-emerald-100 transition-all hover:bg-white hover:text-[#0c2119] hover:scale-105"
                  aria-label="Facebook MadeBy Urp"
                  title="MadeBy Urp"
                >
                  <Facebook className="w-4 h-4" />
                  MadeBy Urp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-16 pt-8 text-center text-xs sm:text-sm text-emerald-100/40">
          <p>
            © {new Date().getFullYear()} URP PrintStudio. Todos los derechos reservados.
            <span className="block mt-1 text-[10px] tracking-wide uppercase font-medium">
              Desarrollado con ❤️ para la comunidad universitaria URP
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
