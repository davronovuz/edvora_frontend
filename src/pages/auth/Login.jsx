import { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Logo from '@/assets/logo.png';

const isMainDomain = () => {
  const host = window.location.hostname;
  return host === 'markazedu.uz' || host === 'www.markazedu.uz' || host === 'localhost' || host === '127.0.0.1';
};

// Telefon raqamdan faqat raqamlar
const cleanPhone = (value) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length > 9) {
    digits = digits.slice(3);
  }
  return digits.slice(0, 9);
};

// Raw digits dan serverga yuboriladigan formatga: +998901234567
const toServerPhone = (digits) => {
  return '+998' + digits;
};

export default function Login() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(!isMainDomain());
  const [phoneError, setPhoneError] = useState('');
  const passwordRef = useRef(null);

  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Agar allaqachon login bo'lgan bo'lsa — app ga redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Tenant ma'lumotlarini yuklash (subdomen uchun)
  useEffect(() => {
    if (!isMainDomain()) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      api.get('/tenant-info/', { signal: controller.signal })
        .then((res) => {
          setTenantInfo(res.data);
          if (res.data.name) document.title = res.data.name;
        })
        .catch(() => {
          setTenantInfo({ name: window.location.hostname.split('.')[0], is_main: false });
        })
        .finally(() => {
          clearTimeout(timeout);
          setLoadingTenant(false);
        });

      return () => {
        controller.abort();
        clearTimeout(timeout);
      };
    }
  }, []);

  // Telefon o'zgarsa — faqat raqamlar saqlash
  const handlePhoneChange = (e) => {
    const digits = cleanPhone(e.target.value);
    setPhone(digits);
    setPhoneError('');
    if (error) clearError();
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) clearError();
  };

  // Telefon validatsiyasi (phone endi raw digits)
  const validatePhone = () => {
    const digits = phone;
    if (digits.length === 0) {
      setPhoneError(t('auth.phoneRequired') || 'Telefon raqamni kiriting');
      return false;
    }
    if (digits.length < 9) {
      setPhoneError(t('auth.phoneInvalid') || "Telefon raqam to'liq emas");
      return false;
    }
    // O'zbekiston raqamlari 9X bilan boshlanishi kerak
    if (!/^(9[0-9]|3[0-3]|5[05]|6[15679]|7[01234579])/.test(digits)) {
      setPhoneError(t('auth.phoneInvalid') || "Telefon raqam noto'g'ri");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhone()) return;
    if (password.length < 4) {
      toast.error(t('auth.passwordTooShort') || 'Parol juda qisqa');
      return;
    }

    const serverPhone = toServerPhone(phone);
    const success = await login(serverPhone, password);

    if (success) {
      toast.success(t('auth.loginSuccess') || "Tizimga muvaffaqiyatli kirdingiz!");
      navigate('/app', { replace: true });
    }
    // Xato bo'lsa — error state'da ko'rsatiladi (authStore.error)
  };

  // Enter bosilganda — telefonda enter bosilsa parolga o'tish
  const handlePhoneKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (validatePhone()) {
        passwordRef.current?.focus();
      }
    }
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-sm text-gray-400">{t('common.loading') || 'Yuklanmoqda...'}</p>
      </div>
    );
  }

  const isTenant = tenantInfo && !tenantInfo.is_main;
  const centerName = tenantInfo?.name || 'MarkazEdu';
  const centerLogo = tenantInfo?.logo;

  const errorMsg = phoneError || error;

  const formJSX = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          {t('common.phone') || 'Telefon raqam'}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
            +998
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={handlePhoneChange}
            onKeyDown={handlePhoneKeyDown}
            placeholder="901234567"
            maxLength={9}
            className={`w-full h-12 pl-16 pr-4 rounded-xl border text-lg tracking-widest ${
              phoneError ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50'
            } text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 outline-none`}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          {t('auth.password') || 'Parol'}
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            className="w-full h-12 px-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 mt-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {t('auth.checking') || 'Tekshirilmoqda...'}
          </>
        ) : (
          t('auth.login') || 'Kirish'
        )}
      </button>
    </form>
  );

  // ===== TENANT LOGIN =====
  if (isTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />

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
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                src={Logo}
                alt={centerName}
                className="h-28 w-auto mx-auto mb-4 object-contain"
              />
            )}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 capitalize"
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
            {formJSX}

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Powered by{' '}
                <span className="font-semibold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                  MarkazEdu
                </span>
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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-rose-500 to-purple-600" />

        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

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

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={Logo} alt="MarkazEdu" className="h-12 w-auto object-contain brightness-0 invert" />
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-white/80">
              {t('auth.tagline') || "#1 CRM o'quv markazlar uchun"}
            </span>
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
            </span>{' '}
            {t('auth.brandEnd') || 'darajada boshqaring'}
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
            <FeatureItem icon={<Bot className="w-5 h-5" />} title="Telegram Bot" desc={t('auth.featureBot') || "Ota-onalar nazorati"} />
            <FeatureItem icon={<LayoutDashboard className="w-5 h-5" />} title="CRM" desc={t('auth.featureCrm') || "To'liq boshqaruv"} />
            <FeatureItem icon={<ShieldCheck className="w-5 h-5" />} title={t('auth.featureSecurity') || "Xavfsizlik"} desc={t('auth.featureSecurityDesc') || "Ishonchli himoya"} />
            <FeatureItem icon={<Users className="w-5 h-5" />} title={t('auth.featureStudents') || "O'quvchilar"} desc={t('auth.featureStudentsDesc') || "Cheksiz baza"} />
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
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={Logo} alt="MarkazEdu" className="h-14 w-auto object-contain" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.loginTitle') || 'Tizimga kirish'}</h2>
            <p className="text-gray-500 text-sm mt-2">
              {t('auth.loginSubtitle') || "Ma'lumotlaringizni kiriting"}
            </p>
          </div>

          {formJSX}
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
