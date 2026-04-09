import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Users, Building2, BookOpen, CreditCard, TrendingUp, Award } from 'lucide-react';

function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          setInView(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const end = parseInt(value.replace(/,/g, ''));
    const step = Math.max(1, Math.floor(end / 60));
    let start = 0;

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    {
      value: '15000', suffix: '+',
      label: t('landing.statsStudents'),
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      value: '120', suffix: '+',
      label: t('landing.statsCenters'),
      icon: Building2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      value: '850', suffix: '+',
      label: t('landing.statsGroups'),
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      value: '500000', suffix: '+',
      label: t('landing.statsTransactions'),
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      gradient: 'from-blue-500 to-blue-600',
    },
  ];

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Decorative shapes */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            {t('landing.statsTitle') || "Raqamlar o'zi gapiradi"}
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="relative group"
              >
                <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-500">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${stat.bg} mb-5`}
                  >
                    <Icon className={`w-7 h-7 ${stat.color}`} />
                  </motion.div>

                  {/* Number */}
                  <div className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>

                  {/* Label */}
                  <p className="text-gray-600 text-sm sm:text-base font-medium">
                    {stat.label}
                  </p>

                  {/* Bottom accent */}
                  <motion.div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r ${stat.gradient} rounded-full`}
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {[
            { icon: Award, text: t('landing.statsSecure') || 'SSL Himoyalangan' },
            { icon: TrendingUp, text: '99.9% Uptime' },
            { icon: Users, text: t('landing.stats247') || '24/7 Yordam' },
          ].map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="flex items-center gap-2 text-gray-500"
            >
              <badge.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
