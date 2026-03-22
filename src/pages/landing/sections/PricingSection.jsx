import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PricingSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const plans = ['starter', 'professional', 'enterprise'];

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-white dark:bg-gray-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-semibold mb-4">
            {t('landing.pricingTitle')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white">
            {t('landing.pricingTitle')}
          </h2>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            {t('landing.pricingSubtitle')}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isPopular = t(`landing.pricing.${plan}.popular`, { defaultValue: '' }) === 'true' || plan === 'professional';
            const features = t(`landing.pricing.${plan}.features`, { returnObjects: true }) || [];

            return (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative rounded-2xl p-8 ${
                  isPopular
                    ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white scale-105 shadow-2xl shadow-primary-500/20 border-2 border-primary-400/30'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm'
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>MASHHUR</span>
                  </div>
                )}

                {/* Plan name */}
                <h3 className={`text-lg font-bold ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {t(`landing.pricing.${plan}.name`)}
                </h3>
                <p className={`text-sm mt-1 ${isPopular ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t(`landing.pricing.${plan}.desc`)}
                </p>

                {/* Price */}
                <div className="mt-6 mb-8">
                  <span className={`text-4xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {t(`landing.pricing.${plan}.price`)}
                  </span>
                  {t(`landing.pricing.${plan}.period`) && (
                    <span className={`text-sm ml-1 ${isPopular ? 'text-white/60' : 'text-gray-400'}`}>
                      {t(`landing.pricing.${plan}.period`)}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {Array.isArray(features) && features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isPopular ? 'bg-white/20' : 'bg-green-100 dark:bg-green-500/10'
                      }`}>
                        <Check className={`w-3 h-3 ${isPopular ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
                      </div>
                      <span className={`text-sm ${isPopular ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isPopular
                      ? 'bg-white text-primary-700 hover:bg-gray-100 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('landing.startFree')}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
