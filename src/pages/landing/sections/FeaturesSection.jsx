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

const featureColors = {
  students: 'from-blue-500 to-blue-600',
  groups: 'from-purple-500 to-purple-600',
  payments: 'from-green-500 to-green-600',
  attendance: 'from-orange-500 to-orange-600',
  analytics: 'from-cyan-500 to-cyan-600',
  sms: 'from-pink-500 to-pink-600',
  leads: 'from-yellow-500 to-yellow-600',
  branches: 'from-indigo-500 to-indigo-600',
};

const featureBgColors = {
  students: 'bg-blue-50 dark:bg-blue-500/10',
  groups: 'bg-purple-50 dark:bg-purple-500/10',
  payments: 'bg-green-50 dark:bg-green-500/10',
  attendance: 'bg-orange-50 dark:bg-orange-500/10',
  analytics: 'bg-cyan-50 dark:bg-cyan-500/10',
  sms: 'bg-pink-50 dark:bg-pink-500/10',
  leads: 'bg-yellow-50 dark:bg-yellow-500/10',
  branches: 'bg-indigo-50 dark:bg-indigo-500/10',
};

export default function FeaturesSection() {
  const { t } = useTranslation();

  const features = Object.keys(featureIcons).map((key) => ({
    key,
    title: t(`landing.features.${key}.title`),
    desc: t(`landing.features.${key}.desc`),
    Icon: featureIcons[key],
    gradient: featureColors[key],
    bg: featureBgColors[key],
  }));

  return (
    <section id="features" className="py-24 lg:py-32 bg-white dark:bg-gray-950 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-4">
            {t('landing.featuresTitle')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white">
            {t('landing.featuresTitle')}{' '}
            <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
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
              className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.Icon className={`w-7 h-7 bg-gradient-to-br ${feature.gradient} bg-clip-text`}
                  style={{ color: feature.gradient.includes('blue') ? '#3b82f6' : feature.gradient.includes('purple') ? '#a855f7' : feature.gradient.includes('green') ? '#22c55e' : feature.gradient.includes('orange') ? '#f97316' : feature.gradient.includes('cyan') ? '#06b6d4' : feature.gradient.includes('pink') ? '#ec4899' : feature.gradient.includes('yellow') ? '#eab308' : '#6366f1' }}
                />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.desc}
              </p>

              {/* Hover gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/0 to-secondary-500/0 group-hover:from-primary-500/5 group-hover:to-secondary-500/5 transition-all duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
