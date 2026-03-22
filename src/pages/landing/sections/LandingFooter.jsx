import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTelegram, faInstagram, faYoutube, faFacebook } from '@fortawesome/free-brands-svg-icons';

export default function LandingFooter() {
  const { t } = useTranslation();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-950 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-xl font-bold">MarkazEdu</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('landing.footerDesc')}
            </p>
            <div className="flex gap-3">
              {[
                { icon: faTelegram, href: '#' },
                { icon: faInstagram, href: 'https://instagram.com/davronovsimple' },
                { icon: faYoutube, href: '#' },
                { icon: faFacebook, href: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <FontAwesomeIcon icon={social.icon} className="w-5 h-5 text-gray-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              {t('landing.featuresTitle')}
            </h4>
            <ul className="space-y-3">
              {['students', 'groups', 'payments', 'attendance'].map((key) => (
                <li key={key}>
                  <button
                    onClick={() => scrollTo('features')}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {t(`landing.features.${key}.title`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              MarkazEdu
            </h4>
            <ul className="space-y-3">
              {[
                { label: t('landing.pricingTitle'), id: 'pricing' },
                { label: t('landing.faqTitle'), id: 'faq' },
                { label: 'Blog', id: '' },
                { label: t('landing.watchDemo'), id: '' },
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => item.id && scrollTo(item.id)}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Aloqa
            </h4>
            <ul className="space-y-3">
              <li className="text-sm text-gray-500">+998 94 477 62 62</li>
              <li className="text-sm text-gray-500">davronovtatu@gmail.com</li>
              <li className="text-sm text-gray-500">Samarqand, O'zbekiston</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} MarkazEdu. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                Maxfiylik siyosati
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                Foydalanish shartlari
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
