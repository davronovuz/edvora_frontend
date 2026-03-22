import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Torus, MeshWobbleMaterial } from '@react-three/drei';

function AnimatedSphere({ position, color, speed, distort, scale }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      ref.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <Sphere ref={ref} args={[1, 64, 64]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          distort={distort}
          speed={2}
          transparent
          opacity={0.7}
        />
      </Sphere>
    </Float>
  );
}

function AnimatedTorus({ position, color, speed, scale }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.4;
      ref.current.rotation.z = state.clock.elapsedTime * speed * 0.2;
    }
  });

  return (
    <Float speed={speed * 0.5} rotationIntensity={0.3} floatIntensity={1}>
      <Torus ref={ref} args={[1, 0.3, 16, 32]} position={position} scale={scale}>
        <MeshWobbleMaterial
          color={color}
          roughness={0.2}
          metalness={0.7}
          factor={0.3}
          speed={1.5}
          transparent
          opacity={0.5}
        />
      </Torus>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.8} color="#fff" />
      <pointLight position={[-10, -10, -5]} color="#F28C28" intensity={1.5} />
      <pointLight position={[10, -5, 5]} color="#3D67A6" intensity={1.2} />
      <pointLight position={[0, 10, 0]} color="#F59E0B" intensity={0.8} />

      <AnimatedSphere position={[-4, 2, -3]} color="#1B365D" speed={1.5} distort={0.5} scale={2.2} />
      <AnimatedSphere position={[4, -1.5, -4]} color="#F28C28" speed={1} distort={0.4} scale={2.5} />
      <AnimatedSphere position={[0, 3, -5]} color="#1B365D" speed={0.8} distort={0.6} scale={1.5} />
      <AnimatedSphere position={[-2.5, -2.5, -2]} color="#F59E0B" speed={1.2} distort={0.35} scale={1} />
      <AnimatedSphere position={[2.5, 1, -1.5]} color="#F28C28" speed={0.6} distort={0.3} scale={0.7} />
      <AnimatedSphere position={[-1, 0, -6]} color="#3D67A6" speed={0.9} distort={0.45} scale={1.8} />

      <AnimatedTorus position={[3, 2.5, -3]} color="#F28C28" speed={0.7} scale={0.8} />
      <AnimatedTorus position={[-3, -1, -4]} color="#1B365D" speed={0.5} scale={0.6} />
    </>
  );
}

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background - yorqin dark blue + orange glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1D3A] via-[#122B52] to-[#0B1D3A]" />

      {/* Orange + blue glowing orbs */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 15% 25%, rgba(242, 140, 40, 0.2) 0%, transparent 45%),
                           radial-gradient(circle at 85% 75%, rgba(242, 140, 40, 0.15) 0%, transparent 40%),
                           radial-gradient(circle at 50% 10%, rgba(61, 103, 166, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 35%)`,
        }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Animated glowing blobs */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-secondary-500/20 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-secondary-400/15 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-primary-400/10 rounded-full blur-[100px]"
      />

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 55 }}
          style={{ pointerEvents: 'none' }}
          dpr={[1, 2]}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: i % 3 === 0 ? 'rgba(242,140,40,0.5)' : i % 3 === 1 ? 'rgba(255,255,255,0.4)' : 'rgba(61,103,166,0.5)',
            }}
            animate={{
              y: [0, -40 - Math.random() * 30, 0],
              x: [0, (Math.random() - 0.5) * 20, 0],
              opacity: [0.15, 0.8, 0.15],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <div className="max-w-5xl mx-auto text-center">

          {/* Title - KATTA */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight"
          >
            {t('landing.heroTitle')}{' '}
            <span className="bg-gradient-to-r from-secondary-300 via-secondary-400 to-secondary-500 bg-clip-text text-transparent">
              {t('landing.heroTitleHighlight')}
            </span>{' '}
            {t('landing.heroTitleEnd')}
          </motion.h1>

          {/* Subtitle - YORQIN */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
          >
            {t('landing.heroSubtitle')}
          </motion.p>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-5xl">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-secondary-500/25 via-primary-500/20 to-secondary-500/25 rounded-3xl blur-2xl" />
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-secondary-500/40 via-primary-500/30 to-secondary-500/40 rounded-2xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Browser mockup */}
              <div className="relative bg-[#0B1D3A]/90 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/10 rounded-lg px-4 py-1.5 text-xs text-white/50 text-center">
                      app.markazedu.uz/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    {[
                      { label: t('dashboard.totalStudents'), value: '1,247', color: 'from-blue-500 to-blue-600', change: '+12%' },
                      { label: t('dashboard.activeGroups'), value: '64', color: 'from-green-500 to-green-600', change: '+5' },
                      { label: t('dashboard.totalTeachers'), value: '38', color: 'from-purple-500 to-purple-600', change: '+3' },
                      { label: t('dashboard.monthlyIncome'), value: '47.2M', color: 'from-orange-500 to-orange-600', change: '+18%' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 + i * 0.1 }}
                        className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 sm:p-4 text-white`}
                      >
                        <p className="text-xs sm:text-sm opacity-80 truncate">{stat.label}</p>
                        <div className="flex items-end justify-between mt-1">
                          <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded hidden sm:inline">{stat.change}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div className="bg-white/5 rounded-xl p-4 h-32 sm:h-48 flex items-end gap-1 sm:gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 2 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                        className="flex-1 bg-gradient-to-t from-secondary-500 to-secondary-400 rounded-t-md hover:from-primary-500 hover:to-primary-400 transition-colors"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent z-10" />
    </section>
  );
}
