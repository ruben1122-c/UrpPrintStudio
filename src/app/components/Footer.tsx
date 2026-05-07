import { Mail, Phone, MapPin, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contacto" className="bg-[#1b4332] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#1b4332] font-bold text-xl">UP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg leading-tight">URP</span>
                <span className="text-xs text-gray-300 leading-tight">PrintStudio</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Crea souvenirs universitarios personalizados con la identidad de la Universidad Ricardo Palma.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#inicio" className="text-gray-300 hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#productos" className="text-gray-300 hover:text-white transition-colors">
                  Productos
                </a>
              </li>
              <li>
                <a href="#personalizar" className="text-gray-300 hover:text-white transition-colors">
                  Crear diseño
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-gray-300 hover:text-white transition-colors">
                  Cómo funciona
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Política de devoluciones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                <a
                  href="mailto:madebyurp@gmail.com"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  madebyurp@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                <a
                  href="tel:+51936251979"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  +51 936 251 979
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span className="text-gray-300">
                  Av. Benavides 5440, Santiago de Surco, Lima
                </span>
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Síguenos</h4>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/MadeByUrp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Facebook MadeBy Urp"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/madebyurp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Instagram @madebyurp"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-gray-300">
          <p>
            © {new Date().getFullYear()} URP PrintStudio. Todos los derechos reservados.
            <span className="block mt-1 text-xs">
              Desarrollado con ❤️ para la comunidad universitaria URP
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
