import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useState } from 'react';

const testimonials = [
  {
    name: 'Sardor Alimov',
    role: 'CEO, "Najot Ta\'lim"',
    text: 'MarkazEdu tizimi bizning o\'quv markazimizni boshqarishni tubdan o\'zgartirdi. Endi barcha ma\'lumotlar bir joyda va hamma narsa avtomatlashtirilgan.',
    textRu: 'Система MarkazEdu кардинально изменила управление нашим учебным центром. Теперь все данные в одном месте и всё автоматизировано.',
    textEn: 'MarkazEdu system has radically changed the management of our education center. Now all data is in one place and everything is automated.',
    avatar: 'SA',
    rating: 5,
  },
  {
    name: 'Dilnoza Karimova',
    role: 'Direktor, "Smart Academy"',
    text: 'Avtomatik write-off va SMS tizimi juda qulay. Ota-onalar ham tizimdan juda mamnun. Modme dan ko\'chib o\'tganimizga hech pushaymon emasmiz.',
    textRu: 'Автоматическое списание и SMS система очень удобны. Родители тоже очень довольны системой. Мы ни разу не пожалели что перешли с Modme.',
    textEn: 'Auto write-off and SMS system are very convenient. Parents are also very satisfied with the system. We never regretted switching from Modme.',
    avatar: 'DK',
    rating: 5,
  },
  {
    name: 'Bobur Yusupov',
    role: 'Asoschisi, "IT Park Academy"',
    text: 'Ko\'p filiallarni boshqarish endi juda oson. Har bir filialning statistikasini ko\'rish va taqqoslash imkoniyati zo\'r.',
    textRu: 'Управление несколькими филиалами теперь очень простое. Возможность просмотра и сравнения статистики каждого филиала — отлично.',
    textEn: 'Managing multiple branches is now very easy. The ability to view and compare statistics of each branch is great.',
    avatar: 'BY',
    rating: 5,
  },
  {
    name: 'Madina Rahimova',
    role: 'Admin, "English Plus"',
    text: 'Tizim juda tez va qulay. Darslarni rejalashtirish, davomat olish va to\'lovlarni kuzatish endi bir necha bosqichda amalga oshadi.',
    textRu: 'Система очень быстрая и удобная. Планирование занятий, отметка посещаемости и отслеживание платежей теперь занимает несколько шагов.',
    textEn: 'The system is very fast and convenient. Planning lessons, marking attendance and tracking payments now takes just a few steps.',
    avatar: 'MR',
    rating: 5,
  },
  {
    name: 'Jasur Tursunov',
    role: 'Moliyachi, "Oxford Study"',
    text: 'Moliyaviy hisobotlar va analitika moduli bizning ishimizni juda osonlashtirdi. Qarzdorlar ro\'yxati va avtomatik eslatmalar zo\'r ishlaydi.',
    textRu: 'Финансовые отчёты и модуль аналитики значительно упростили нашу работу. Список должников и автоматические напоминания работают отлично.',
    textEn: 'Financial reports and analytics module have greatly simplified our work. Debtors list and auto reminders work excellently.',
    avatar: 'JT',
    rating: 5,
  },
  {
    name: 'Nilufar Azizova',
    role: 'Asoschisi, "Kids World"',
    text: 'Bolalar uchun o\'quv markazni boshqarish endi ancha oson. Ota-onalar bilan aloqa tizimi va SMS bildirishnomalar juda samarali.',
    textRu: 'Управлять детским учебным центром стало намного проще. Система связи с родителями и SMS уведомления очень эффективны.',
    textEn: 'Managing a children\'s education center is now much easier. Parent communication and SMS notifications are very effective.',
    avatar: 'NA',
    rating: 5,
  },
];

const avatarColors = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-green-500 to-green-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
];

export default function TestimonialsSection() {
  const { t, i18n } = useTranslation();

  const getText = (item) => {
    if (i18n.language === 'ru') return item.textRu;
    if (i18n.language === 'en') return item.textEn;
    return item.text;
  };

  return (
    <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 text-sm font-semibold mb-4">
            {t('landing.testimonialsTitle')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white">
            {t('landing.testimonialsTitle')}
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 relative"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary-200 dark:text-primary-800 mb-4" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(item.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                "{getText(item)}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                  {item.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
