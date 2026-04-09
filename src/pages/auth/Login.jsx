import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import api from '@/services/api';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Bot,
  GraduationCap,
  Sparkles
} from 'lucide-react';

const isMainDomain = () => {
  const host = window.location.hostname;
  return host === 'markazedu.uz' || host === 'www.markazedu.uz' || host === 'localhost' || host === '127.0.0.1';
};

export default function Login() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(!isMainDomain());

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMainDomain()) {
      const fetchTenantInfo = async () => {
        try {
          const res = await api.get('/tenant-info/');
          setTenantInfo(res.data);
          if (res.data.name) document.title = res.data.name;
        } catch {
          setTenantInfo({ name: 'MarkazEdu', is_main: true });
        } finally {
          setLoadingTenant(false);
        }
      };
      fetchTenantInfo();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await login(phone, password);
      if (success) {
        toast.success(t('auth.loginSuccess') || "Tizimga muvaffaqiyatli kirdingiz!");
        navigate('/app');
      } else {
        toast.error(t('auth.loginError') || "Kirish ma'lumotlari noto'g'ri");
      }
    } catch {
      toast.error(t('auth.systemError') || "Tizim xatosi yuz berdi.");
    }
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const isTenant = tenantInfo && !tenantInfo.is_main;
  const centerName = tenantInfo?.name || 'MarkazEdu';
  const centerLogo = tenantInfo?.logo;
  const centerBg = tenantInfo?.login_background;

  // ===== TENANT LOGIN =====
  if (isTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-orange-200/60 to-amber-200/40 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-rose-200/50 to-pink-100/40 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-violet-100/30 to-blue-100/20 blur-3xl"
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${10 + Math.random() * 80}%`,
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              background: i % 3 === 0 ? 'rgba(251,146,60,0.3)' : i % 3 === 1 ? 'rgba(244,114,182,0.2)' : 'rgba(167,139,250,0.2)',
            }}
            animate={{ y: [0, -25, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[420px] mx-4"
        >
          {/* Logo & Name */}
          <div className="text-center mb-8">
            {centerLogo ? (
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                src={centerLogo}
                alt={centerName}
                className="h-20 w-auto mx-auto mb-4 object-contain"
              />
            ) : (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-orange-500 to-rose-500 shadow-xl shadow-orange-500/25"
              >
                <GraduationCap className="w-10 h-10 text-white" />
              </motion.div>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900"
            >
              {centerName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 text-sm mt-1"
            >
              {t('auth.loginSubtitle') || "Hisobingizga kirish"}
            </motion.p>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-orange-900/5 border border-white/60"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Telefon raqam</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 px-4 pr-11 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-70 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {t('auth.checking') || 'Tekshirilmoqda...'}
                  </>
                ) : (
                  t('auth.login')
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Powered by <span className="font-semibold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">MarkazEdu</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ===== MAIN DOMAIN LOGIN =====
  return (
    <div className="min-h-screen flex w-full bg-white">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden text-white p-12 flex-col justify-between">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-rose-500 to-purple-600" />

        {/* Animated mesh */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        {/* Blobs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-white/10 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-amber-400/15 rounded-full blur-[80px]"
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">MarkazEdu</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-white/80">#1 CRM o'quv markazlar uchun</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-5xl font-extrabold leading-tight mb-6 tracking-tight"
          >
            {t('auth.brandTitle') || "O'quv markazingizni"} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-300">
              {t('auth.brandHighlight') || 'professional'}
            </span> {t('auth.brandEnd') || 'darajada boshqaring'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/70 text-lg mb-10 leading-relaxed"
          >
            {t('auth.brandDesc') || "O'quvchilar, to'lovlar va davomat nazorati — barchasi bitta qulay platformada."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-4"
          >
            <FeatureItem icon={<Bot className="w-5 h-5"/>} title="Telegram Bot" desc={t('auth.featureBot') || "Ota-onalar nazorati"} />
            <FeatureItem icon={<LayoutDashboard className="w-5 h-5"/>} title="CRM" desc={t('auth.featureCrm') || "To'liq boshqaruv"} />
            <FeatureItem icon={<ShieldCheck className="w-5 h-5"/>} title={t('auth.featureSecurity') || "Xavfsizlik"} desc={t('auth.featureSecurityDesc') || "Ishonchli himoya"} />
            <FeatureItem icon={<Users className="w-5 h-5"/>} title={t('auth.featureStudents') || "O'quvchilar"} desc={t('auth.featureStudentsDesc') || "Cheksiz baza"} />
          </motion.div>
        </div>

        <div className="relative z-10 text-white/30 text-sm">
          © {new Date().getFullYear()} MarkazEdu
        </div>
      </div>

      {/* RIGHT SIDE (FORM) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-gray-50/50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100"
        >

          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.loginTitle')}</h2>
            <p className="text-gray-500 text-sm mt-2">{t('auth.loginSubtitle') || "Hisobingizga kirish uchun ma'lumotlarni kiriting"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Telefon raqam</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-700">{t('auth.password')}</label>
                <a href="#" className="text-xs font-medium text-orange-500 hover:text-orange-600 hover:underline">
                  {t('auth.forgotPassword') || 'Parolni unutdingizmi?'}
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-70 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('auth.checking') || 'Tekshirilmoqda...'}
                </>
              ) : (
                t('auth.login')
              )}
            </motion.button>
          </form>

        </motion.div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors">
      <div className="text-amber-300 bg-white/10 p-2 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-white/50">{desc}</p>
      </div>
    </div>
  );
}
