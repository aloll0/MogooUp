import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// Import brand assets
import arabProLogo from "../../assets/arab_pro_logo.png";
import taskflowLogo from "../../assets/taskflow_logo.png";
import cosmicBg from "../../assets/cosmic_bg.png";

// Form validation schema generator using translation
const getLoginSchema = (t: any) =>
  z.object({
    email: z.string().email(t("validation.invalidEmail", "Please enter a valid email address")),
    password: z.string().min(1, t("validation.passwordRequired", "Password is required")),
  });

type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const loginSchema = getLoginSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message || "Invalid credentials. Please try again.";
      setApiError(errorMessage);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="flex min-h-screen w-full bg-linear-to-br from-[#160430] via-[#0d021f] to-[#05000e] text-white font-sans overflow-x-hidden selection:bg-purple-500/35 selection:text-white">
      {/* Brand Side Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background cosmic planet image with motion parallax */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.55 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          style={{ backgroundImage: `url(${cosmicBg})` }}
          className="absolute inset-0 bg-cover bg-center mix-blend-lighten pointer-events-none"
        />

        {/* Seamless blending gradient mask */}
        <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-transparent via-[#160430]/35 to-[#160430] pointer-events-none" />

        {/* Nebula gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full filter blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[100px] mix-blend-screen pointer-events-none animate-pulse duration-[6000ms]" />

        {/* Company Header Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 z-10"
        >
          <img src={arabProLogo} alt="Arab Pro Logo" className="h-10 object-contain" />
        </motion.div>

        {/* Cosmic floating elements inside side panel */}
        <div className="my-auto max-w-lg space-y-6 z-10 relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring" as const, stiffness: 60, delay: 0.2 }}
          >
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight bg-linear-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              {t("auth.adventureTitle", "SIGN IN TO YOUR ADVENTURE!")}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-base xl:text-lg text-purple-200/70 leading-relaxed font-light"
          >
            {t(
              "auth.adventureSubtitle",
              "The next-generation project space unifying tasks, sprints, docs, and team collaboration in one extremely fast workspace."
            )}
          </motion.p>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-purple-300/80 z-10 font-mono tracking-widest uppercase font-semibold"
        >
          {t("auth.poweredBy", "POWERED BY ARAB PRO")}
        </motion.div>
      </div>

      {/* Login Card Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-12 relative">
        {/* Glow behind the form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-500/10 rounded-full filter blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md flex flex-col gap-4 z-10">
          {/* Language & Redirect Header aligned with the card */}
          <div className="flex justify-between items-center px-1">
            <Link
              to="/register"
              className="text-xs font-semibold text-purple-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 py-1.5 px-3 rounded-lg border border-white/5 hover:border-white/10"
            >
              {t("auth.createFreeAccount", "Create a free account")}
            </Link>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all py-1.5 px-3 rounded-lg cursor-pointer text-purple-200 hover:text-white"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{i18n.language === "ar" ? "English" : "عربي"}</span>
            </button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full space-y-8 bg-[#1f113a]/30 border border-white/5 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          >
          {/* Header */}
          <div className="space-y-4 text-center">
            <motion.div
              variants={itemVariants}
              className="flex justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 opacity-60 blur-md group-hover:opacity-100 transition duration-500" />
                <img
                  src={taskflowLogo}
                  alt="Taskflow Logo"
                  className="relative h-16 w-16 object-contain rounded-xl"
                />
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-1.5">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {t("auth.signInSubtitle", "Sign in to Taskflow")}
              </h2>
              <p className="text-xs text-zinc-400">
                {t("auth.newToTaskflow", "New to Taskflow?")}{" "}
                <Link
                  to="/register"
                  className="font-semibold text-purple-400 hover:underline"
                >
                  {t("auth.createFreeAccount", "Create a free account")}
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AnimatePresence mode="wait">
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 rounded-lg bg-red-950/20 border border-red-500/30 p-3 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{apiError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-purple-300/80"
              >
                {t("auth.emailLabel", "Email Address")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder", "name@example.com")}
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-black/20 backdrop-blur-md py-2.5 ps-10 pe-4 text-sm text-white outline-hidden transition-all placeholder:text-zinc-500 focus:bg-black/35 focus:ring-2 ${
                    errors.email
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:border-purple-500/60 focus:ring-purple-500/20"
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 font-medium ps-1">{errors.email.message}</p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-purple-300/80"
              >
                {t("auth.passwordLabel", "Password")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder", "Enter password")}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-black/20 backdrop-blur-md py-2.5 ps-10 pe-10 text-sm text-white outline-hidden transition-all placeholder:text-zinc-500 focus:bg-black/35 focus:ring-2 ${
                    errors.password
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:border-purple-500/60 focus:ring-purple-500/20"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-zinc-500 hover:text-purple-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 font-medium ps-1">{errors.password.message}</p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] py-3 px-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(147,51,234,0.35)] hover:shadow-[0_4px_30px_rgba(147,51,234,0.5)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("auth.signingIn", "Signing in...")}</span>
                  </>
                ) : (
                  <span>{t("auth.signIn", "Sign In")}</span>
                )}
              </button>
            </motion.div>
          </form>

          {/* Powered by footer on mobile view */}
          <div className="block lg:hidden text-center text-[10px] text-purple-300/30 font-mono tracking-widest uppercase pt-4 border-t border-white/5">
            {t("auth.poweredBy", "POWERED BY ARAB PRO")}
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
};
