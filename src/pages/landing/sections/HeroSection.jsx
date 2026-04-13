import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function HeroSection({ onOpenDemo }) {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-blue-50" />

      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-200/50 to-orange-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-100/40 to-blue-200/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-r from-orange-50/30 to-purple-50/20 blur-3xl" />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(#ea580c 1px, transparent 1px), linear-gradient(90deg, #ea580c 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }} />
      </div>

      {/* Floating dots */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              background: i % 3 === 0 ? 'rgba(234,88,12,0.25)' : i % 3 === 1 ? 'rgba(249,115,22,0.3)' : 'rgba(59,130,246,0.15)',
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <div className="max-w-4xl mx-auto text-center">

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight"
          >
            {t('landing.heroTitle')}{' '}
            <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              {t('landing.heroTitleHighlight')}
            </span>{' '}
            {t('landing.heroTitleEnd')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            {t('landing.heroSubtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onOpenDemo}
              className="px-8 py-4 rounded-2xl text-white font-semibold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5 text-lg"
            >
              {t('landing.startFree') || "Bepul sinab ko'ring"}
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-2xl font-semibold border-2 border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-all duration-300 text-lg"
            >
              {t('landing.learnMore') || "Batafsil ko'rish"}
            </button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-5xl">
              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-200/40 via-purple-200/20 to-blue-200/30 rounded-3xl blur-2xl" />

              {/* Browser mockup */}
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-300/50 overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-gray-500 text-center border border-gray-200">
                      app.markazedu.uz/dashboard
                    </div>
                  </div>
                </div>

                {/* Real Dashboard Screenshot */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.8 }}
                >
                  <img
                    src="/crm-dashboard.png"
                    alt="MarkazEdu CRM Dashboard"
                    className="w-full h-auto"
                    loading="eager"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
