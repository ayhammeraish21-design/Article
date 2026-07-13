import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Cpu, BookOpen, Atom, Compass, Lock, User, Mail, Loader2, ArrowLeft } from "lucide-react";
import { User as UserType } from "../types";

interface LandingPageProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!isLogin && !username) {
      setError("يرجى إدخال اسم المستخدم");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { email } : { username, email };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ ما");
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center overflow-hidden font-sans select-none px-4 md:px-8">
      {/* Dynamic Background Grid and Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
      
      {/* 3D Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-75"></div>

      {/* Futuristic Floating Header Particles */}
      <div className="absolute top-8 left-8 flex items-center space-x-2 space-x-reverse text-cyan-400 font-mono text-xs tracking-wider opacity-60">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>PORTAL v2.5 // ONLINE</span>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 py-12">
        {/* Left column: Epic Brand introduction */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-7 flex flex-col justify-center text-right space-y-6 md:space-y-8 order-2 lg:order-1"
        >
          <div className="flex items-center justify-start space-x-3 space-x-reverse">
            <div className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-2xl shadow-lg shadow-purple-500/20">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
            <span className="text-sm font-semibold tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full uppercase">
              الجيل الجديد من منصات الأبحاث
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            بوابة البحوث والمقالات <br />
            <span className="bg-gradient-to-l from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              العلمية والأدبية والتقنية
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-2xl">
            مساحة معرفية غامرة تجمع الباحثين والمفكرين لمشاركة المعرفة. ارفع مقالاتك مباشرة من ملفات <span className="text-cyan-400 font-semibold font-mono">Word (.docx)</span> بأي طول، ودع ذكاء <span className="text-purple-400 font-semibold">Gemini</span> الاصطناعي يقوم بتلخيصها واستخراج الكلمات المفتاحية وأهم الخلاصات المعرفية بدقة فائقة.
          </p>

          {/* 3D Features Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-right">
            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl flex items-start space-x-3 space-x-reverse backdrop-blur-md"
            >
              <div className="p-2 bg-purple-950/50 rounded-lg text-purple-400 mt-1">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">تحليل الذكاء الاصطناعي جيني</h3>
                <p className="text-xs text-gray-400 mt-1">استخراج تلقائي للملخص والخلاصات والوسوم وصعوبة القراءة.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl flex items-start space-x-3 space-x-reverse backdrop-blur-md"
            >
              <div className="p-2 bg-cyan-950/50 rounded-lg text-cyan-400 mt-1">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">رفع وتصفح مستندات Word</h3>
                <p className="text-xs text-gray-400 mt-1">ارفع ملفات Word كاملة من أي طول وسيقوم الموقع بترتيبها بصفحات منظمة.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl flex items-start space-x-3 space-x-reverse backdrop-blur-md"
            >
              <div className="p-2 bg-amber-950/50 rounded-lg text-amber-400 mt-1">
                <Atom className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">تصنيفات ومحرك بحث متطور</h3>
                <p className="text-xs text-gray-400 mt-1">تصفح وتصفية للمقالات العلمية، الأدبية، الفلسفية، الطبية والتاريخية.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-emerald-950/50 rounded-lg text-emerald-400 flex items-start space-x-3 space-x-reverse backdrop-blur-md border border-zinc-800/60"
            >
              <div className="p-2 bg-emerald-950/50 rounded-lg text-emerald-400 mt-1">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">واجهة قراءة غامرة ثلاثية الأبعاد</h3>
                <p className="text-xs text-gray-400 mt-1">أوضاع مخصصة لتجربة قراءة نصوص بحوث أكاديمية مريحة للعين.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right column: Interactive Register/Login glassmorphism panel */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateY: -10 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          style={{ perspective: 1000 }}
          className="lg:col-span-5 order-1 lg:order-2"
        >
          <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl shadow-purple-500/5 backdrop-blur-xl relative overflow-hidden group">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-cyan-400"></div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-xs text-gray-500 font-mono uppercase">
                {isLogin ? "Session // Login" : "Database // Register"}
              </span>
              <div className="flex space-x-2 space-x-reverse bg-zinc-900 p-1 rounded-xl border border-zinc-800/60">
                <button
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${isLogin ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-gray-400 hover:text-white"}`}
                >
                  دخول
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${!isLogin ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-gray-400 hover:text-white"}`}
                >
                  حساب جديد
                </button>
              </div>
            </div>

            <div className="text-right mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? "مرحباً بعودتك" : "انضم إلى مجتمع الباحثين"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isLogin ? "أدخل بريدك الإلكتروني للولوج إلى منصة البحوث" : "أنشئ حساباً لبدء رفع بحوثك وقراءة مقالات الآخرين"}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-950/40 border border-red-800/50 text-red-300 p-3.5 rounded-xl text-xs text-right mb-6"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-medium text-gray-400">اسم الكاتب أو الباحث</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="أدخل اسمك الكامل أو اسم الشهرة"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl py-3 pr-10 pl-4 text-sm text-right text-white placeholder-gray-600 outline-none transition-all duration-300"
                    />
                    <User className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-medium text-gray-400">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="example@research.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl py-3 pr-10 pl-4 text-sm text-left text-white placeholder-gray-600 outline-none transition-all duration-300 font-mono"
                    dir="ltr"
                  />
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500" />
                </div>
              </div>

              {!isLogin && (
                <p className="text-[10px] text-gray-500 leading-relaxed text-right pt-1">
                  * بالتسجيل، أنت توافق على مشاركة بحوثك بشكل عام ومجاني لتسهيل تبادل العلوم والمعرفة في البوابة.
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-l from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-black font-bold py-3.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-sm shadow-lg shadow-purple-500/10 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span className="text-black">يرجى الانتظار...</span>
                  </>
                ) : (
                  <span className="text-black">
                    {isLogin ? "دخول إلى المنصة" : "إنشاء حساب وبدء الاستكشاف"}
                  </span>
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-900 text-center text-xs text-gray-500">
              {isLogin ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-cyan-400 font-semibold hover:underline"
              >
                {isLogin ? "سجل الآن" : "سجل الدخول"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-[11px] text-gray-600 z-10 font-mono">
        &copy; 2026 RESEARCH PORTAL // INTEGRATED WITH GOOGLE GEMINI 3.5 FLASH
      </div>
    </div>
  );
}
