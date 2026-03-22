import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Users, Building2, BookOpen, CreditCard, TrendingUp, Award } from 'lucide-react';

function AnimatedCounter({ value, suffix = '', duration = 2 }) {
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
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

function FloatingParticle({ delay, x, y, size, color }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: color,
      }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.2, 0.6, 0.2],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    {
      value: '15000',
      suffix: '+',
      label: t('landing.statsStudents'),
      icon: Users,
      color: 'from-blue-400 to-blue-600',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      value: '120',
      suffix: '+',
      label: t('landing.statsCenters'),
      icon: Building2,
      color: 'from-emerald-400 to-emerald-600',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      value: '850',
      suffix: '+',
      label: t('landing.statsGroups'),
      icon: BookOpen,
      color: 'from-violet-400 to-violet-600',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      value: '500000',
      suffix: '+',
      label: t('landing.statsTransactions'),
      icon: CreditCard,
      color: 'from-orange-400 to-orange-600',
      bgGlow: 'rgba(249, 115, 22, 0.15)',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
    },
  ];

  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-primary-900 to-[#0d2847]" />

      {/* Animated mesh grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-500/10 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px]"
      />

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.3}
          x={Math.random() * 100}
          y={Math.random() * 100}
          size={`${2 + Math.random() * 3}px`}
          color={i % 3 === 0 ? 'rgba(242,140,40,0.4)' : i % 3 === 1 ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.3)'}
        />
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            <TrendingUp className="w-4 h-4 text-secondary-400" />
            <span className="text-sm text-white/70 font-medium">{t('landing.trustedBy') || "Ishonchli raqamlar"}</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
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
                {/* Card glow on hover */}
                <div
                  className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: stat.bgGlow }}
                />

                {/* Card */}
                <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 text-center overflow-hidden group-hover:border-white/20 transition-all duration-500">
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
                    <div className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rotate-45`} />
                  </div>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${stat.iconBg} mb-5`}
                  >
                    <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                  </motion.div>

                  {/* Number */}
                  <div className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>

                  {/* Label */}
                  <p className="text-white/50 text-sm sm:text-base font-medium">
                    {stat.label}
                  </p>

                  {/* Bottom line accent */}
                  <motion.div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r ${stat.color} rounded-full`}
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
              className="flex items-center gap-2 text-white/40"
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
