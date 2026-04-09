import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Rocket, Sparkles } from 'lucide-react';

export default function CtaSection({ onOpenDemo }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-blue-50" />

      {/* Decorative shapes */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-200 mb-8"
          >
            <Rocket className="w-10 h-10 text-orange-600" />
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
            {t('landing.ctaSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
            >
              {t('landing.startFree')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenDemo}
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl border-2 border-gray-300 text-gray-700 font-bold text-lg hover:border-orange-400 hover:text-orange-600 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 text-orange-500" />
              {t('landing.watchDemo')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
