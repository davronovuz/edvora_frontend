import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Users, CalendarDays, CreditCard, ClipboardCheck,
  BarChart3, MessageSquare, Target, Building2
} from 'lucide-react';

const featureIcons = {
  students: Users,
  groups: CalendarDays,
  payments: CreditCard,
  attendance: ClipboardCheck,
  analytics: BarChart3,
  sms: MessageSquare,
  leads: Target,
  branches: Building2,
};

const featureStyles = {
  students: { bg: 'bg-blue-100', color: '#2563eb', border: 'hover:border-blue-300' },
  groups: { bg: 'bg-purple-100', color: '#9333ea', border: 'hover:border-purple-300' },
  payments: { bg: 'bg-green-100', color: '#16a34a', border: 'hover:border-green-300' },
  attendance: { bg: 'bg-orange-100', color: '#ea580c', border: 'hover:border-orange-300' },
  analytics: { bg: 'bg-cyan-100', color: '#0891b2', border: 'hover:border-cyan-300' },
  sms: { bg: 'bg-pink-100', color: '#db2777', border: 'hover:border-pink-300' },
  leads: { bg: 'bg-yellow-100', color: '#ca8a04', border: 'hover:border-yellow-300' },
  branches: { bg: 'bg-indigo-100', color: '#4f46e5', border: 'hover:border-indigo-300' },
};

export default function FeaturesSection() {
  const { t } = useTranslation();

  const features = Object.keys(featureIcons).map((key) => ({
    key,
    title: t(`landing.features.${key}.title`),
    desc: t(`landing.features.${key}.desc`),
    Icon: featureIcons[key],
    style: featureStyles[key],
  }));

  return (
    <section id="features" className="py-24 lg:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            {t('landing.featuresTitle')}{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              {t('landing.featuresSubtitle')}
            </span>
          </h2>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`group relative bg-white rounded-2xl p-6 border border-gray-200 ${feature.style.border} shadow-sm hover:shadow-xl transition-all duration-300`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${feature.style.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.Icon className="w-7 h-7" style={{ color: feature.style.color }} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
