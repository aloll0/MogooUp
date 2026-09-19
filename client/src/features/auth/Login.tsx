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
import arabProLogo from "../../assets/arabpro_logo.png";

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
    <div className="flex min-h-screen w-full bg-[#000000] text-white font-sans overflow-x-hidden selection:bg-[#b57ede]/35 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#b57ede]/10 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#031e19]/60 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Brand Side Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-[#05030a] border-r rtl:border-r-0 rtl:border-l border-[#1f1233]">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#160b26_1px,transparent_1px),linear-gradient(to_bottom,#160b26_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        {/* Company Header Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 z-10"
        >
          <img src={arabProLogo} alt="Arab Pro Logo" className="h-12 object-contain" />
        </motion.div>

        {/* Floating presentation copy */}
        <div className="my-auto max-w-lg space-y-6 z-10 relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring" as const, stiffness: 60, delay: 0.2 }}
          >
            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white">
              {t("auth.adventureTitle", "SIGN IN TO YOUR WORKSPACE!")}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-base xl:text-lg text-zinc-300 leading-relaxed font-light"
          >
            {t(
              "auth.adventureSubtitle",
              "The next-generation enterprise workspace unifying tasks, sprints, docs, and team collaboration in one extremely fast environment."
            )}
          </motion.p>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-[#b57ede]/90 z-10 font-mono tracking-widest uppercase font-semibold"
        >
          {t("auth.poweredBy", "ARAB PRO DIGITAL ENTERPRISE")}
        </motion.div>
      </div>

      {/* Login Card Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md flex flex-col gap-4">
          {/* Language & Redirect Header aligned with the card */}
          <div className="flex justify-between items-center px-1">
            <Link
              to="/register"
              className="text-xs font-semibold text-zinc-300 hover:text-white transition-all bg-[#0d071a] hover:bg-[#190d33] py-1.5 px-3 rounded-lg border border-[#261540] hover:border-[#b57ede]/40"
            >
              {t("auth.createFreeAccount", "Create a free account")}
            </Link>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#0d071a] border border-[#261540] hover:border-[#b57ede]/40 hover:bg-[#190d33] transition-all py-1.5 px-3 rounded-lg cursor-pointer text-zinc-300 hover:text-white"
            >
              <Globe className="h-3.5 w-3.5 text-[#b57ede]" />
              <span>{t("auth.langToggle", "English")}</span>
            </button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full space-y-8 bg-[#0a0614]/90 border border-[#261540] p-8 md:p-10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl hover:border-[#b57ede]/40 transition-colors"
          >
            {/* Header */}
            <div className="space-y-4 text-center">
              <motion.div
                variants={itemVariants}
                className="flex justify-center"
                whileHover={{ scale: 1.03 }}
              >
                <div className="relative p-2 rounded-2xl bg-black/40 border border-[#261540]">
                  <img
                    src={arabProLogo}
                    alt="Arab Pro Logo"
                    className="h-14 w-auto max-w-[220px] object-contain"
                  />
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-1.5">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {t("auth.signInSubtitle", "Sign in to Arab Pro")}
                </h2>
                <p className="text-xs text-zinc-400">
                  {t("auth.newToTaskflow", "New to Arab Pro?")}{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-[#b57ede] hover:text-[#d3a6f7] hover:underline"
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
                    className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-500/40 p-3 text-sm text-red-300"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{apiError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-[#b57ede]/90"
                >
                  {t("auth.emailLabel", "Email Address")}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-500 group-focus-within:text-[#b57ede] transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder", "name@example.com")}
                    autoComplete="email"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border bg-black/60 py-2.5 ps-10 pe-4 text-sm text-white outline-hidden transition-all placeholder:text-zinc-600 focus:bg-black focus:ring-2 ${
                      errors.email
                        ? "border-red-500/50 focus:ring-red-500/20"
                        : "border-[#261540] focus:border-[#b57ede] focus:ring-[#b57ede]/25"
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
                  className="text-xs font-bold uppercase tracking-wider text-[#b57ede]/90"
                >
                  {t("auth.passwordLabel", "Password")}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-500 group-focus-within:text-[#b57ede] transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.passwordPlaceholder", "Enter password")}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border bg-black/60 py-2.5 ps-10 pe-10 text-sm text-white outline-hidden transition-all placeholder:text-zinc-600 focus:bg-black focus:ring-2 ${
                      errors.password
                        ? "border-red-500/50 focus:ring-red-500/20"
                        : "border-[#261540] focus:border-[#b57ede] focus:ring-[#b57ede]/25"
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-zinc-500 hover:text-[#b57ede] transition-colors"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b57ede] hover:bg-[#a668d2] active:scale-[0.98] py-3 px-4 text-sm font-black text-black shadow-[0_0_20px_rgba(181,126,222,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>{t("auth.signingIn", "Signing in...")}</span>
                    </>
                  ) : (
                    <span>{t("auth.signIn", "Sign In")}</span>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Powered by footer on mobile view */}
            <div className="block lg:hidden text-center text-[10px] text-[#b57ede]/70 font-mono tracking-widest uppercase pt-4 border-t border-[#261540]">
              {t("auth.poweredBy", "ARAB PRO DIGITAL ENTERPRISE")}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
