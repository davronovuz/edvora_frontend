import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Send } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingHeader({ onOpenDemo }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { label: t('landing.featuresTitle'), id: 'features' },
    { label: t('landing.pricingTitle'), id: 'pricing' },
    { label: t('landing.faqTitle'), id: 'faq' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-800/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className={`text-xl font-bold transition-colors ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
              MarkazEdu
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`text-sm font-medium transition-colors hover:text-secondary-500 ${
                  scrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant={scrolled ? 'default' : 'landing'} />

            {/* Demo button - orange */}
            <button
              onClick={onOpenDemo}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/25 hover:shadow-secondary-500/50 hover:scale-105"
            >
              <Send className="w-4 h-4" />
              {t('landing.watchDemo')}
            </button>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className={`w-6 h-6 ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 border-t border-white/10 bg-[#0B1D3A]/95 backdrop-blur-xl rounded-b-2xl"
            >
              <div className="flex flex-col gap-2 pt-4">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium ${
                      scrolled
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={onOpenDemo}
                  className="mx-4 mt-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-secondary-500 to-secondary-600 text-white flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t('landing.watchDemo')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
