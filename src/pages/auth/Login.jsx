import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  Bot 
} from 'lucide-react';

// Assets
import Logo from '@/assets/logo.png';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Store dan isLoading va login funksiyasini olamiz
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Tizimga muvaffaqiyatli kirdingiz!");
        navigate('/app');
      } else {
        toast.error("Kirish ma'lumotlari noto'g'ri");
      }
    } catch (error) {
      toast.error("Tizim xatosi yuz berdi. Qaytadan urining.");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      
      {/* ================= LEFT SIDE (BRANDING) ================= */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary-900 relative overflow-hidden text-white p-12 flex-col justify-between">
        
        {/* Background Effects (Gradient Blobs) */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-secondary-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          {/* Agar Logo rasmi oq bo'lmasa, brightness-0 invert klasslari kerak bo'ladi */}
          <img src={Logo} alt="MarkazEdu Logo" className="h-10 w-auto object-contain brightness-0 invert" />
          <span className="text-2xl font-bold tracking-tight">MarkazEdu</span>
        </div>

        {/* Main Marketing Content */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">
            O'quv markazingizni <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-secondary-600">
              professional
            </span> darajada boshqaring
          </h1>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed font-light">
            O'quvchilar, to'lovlar va davomat nazorati — barchasi bitta qulay platformada. 
            Biznes jarayonlarini avtomatlashtiring va daromadni oshiring.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <FeatureItem icon={<Bot className="w-5 h-5"/>} title="Telegram Bot" desc="Ota-onalar nazorati" />
            <FeatureItem icon={<LayoutDashboard className="w-5 h-5"/>} title="CRM Tizimi" desc="To'liq boshqaruv" />
            <FeatureItem icon={<ShieldCheck className="w-5 h-5"/>} title="Xavfsizlik" desc="Ishonchli himoya" />
            <FeatureItem icon={<Users className="w-5 h-5"/>} title="O'quvchilar" desc="Cheksiz baza" />
          </div>
        </div>

        {/* Copyright */}
        <div className="relative z-10 text-slate-500 text-sm">
          © 2025 MarkazEdu. Versiya 1.0.0
        </div>
      </div>

      {/* ================= RIGHT SIDE (FORM) ================= */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={Logo} alt="MarkazEdu" className="h-12" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{t('auth.loginTitle')}</h2>
            <p className="text-slate-500 text-sm mt-2">Hisobingizga kirish uchun ma'lumotlarni kiriting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">{t('auth.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@markazedu.uz"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">{t('auth.password')}</label>
                <a href="#" className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline">
                  Parolni unutdingizmi?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-primary-900/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Tekshirilmoqda...
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}

// Yordamchi komponent (Feature Item)
function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="text-secondary-400 bg-white/10 p-2 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}