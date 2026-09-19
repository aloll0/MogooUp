import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// Import brand assets
import arabProLogo from "../../assets/arabpro_logo.png";

// Form validation matching backend Zod schema with localized errors
const getRegisterSchema = (t: any) =>
  z.object({
    fullName: z.string().min(2, t("validation.nameMin", "Full name must be at least 2 characters long")),
    email: z.string().email(t("validation.invalidEmail", "Please enter a valid email address")),
    password: z
      .string()
      .min(8, t("validation.passwordMin", "Password must be at least 8 characters long"))
      .regex(/[a-z]/, t("validation.passwordLower", "Must include at least one lowercase letter"))
      .regex(/[A-Z]/, t("validation.passwordUpper", "Must include at least one uppercase letter"))
      .regex(/[0-9]/, t("validation.passwordNumber", "Must include at least one number")),
  });

type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;

export const Register: React.FC = () => {
  const { register: registerApi, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t, i18n } = useTranslation();

  const registerSchema = getRegisterSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null);
    try {
      await registerApi(data.email, data.fullName, data.password);
      setIsSuccess(true);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message || "Registration failed. Please try again.";
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

  if (isSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#000000] text-white px-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#b57ede]/15 rounded-full filter blur-[120px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 100 }}
          className="w-full max-w-md space-y-6 text-center bg-[#0a0614]/90 border border-[#261540] p-8 rounded-2xl shadow-2xl z-10 backdrop-blur-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#031e19] border border-[#064237] text-[#c6ff00]">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">
              {t("auth.registerSuccessTitle", "Registration Successful!")}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-normal">
              {t(
                "auth.pendingApprovalDesc",
                "Your account has been created successfully! It is now pending administrator approval. Once a System Administrator approves your account, you will be able to log in."
              )}
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-xl bg-[#b57ede] hover:bg-[#a668d2] active:scale-[0.98] py-3 px-4 text-sm font-black text-black shadow-[0_0_20px_rgba(181,126,222,0.4)] transition-all cursor-pointer"
          >
            {t("auth.goToLogin", "Go to Login")}
          </button>
        </motion.div>
      </div>
    );
  }

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
              {t("auth.startAdventureTitle", "START YOUR WORKSPACE WITH ARAB PRO!")}
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

      {/* Register Card Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md flex flex-col gap-4">
          {/* Language & Redirect Header aligned with the card */}
          <div className="flex justify-between items-center px-1">
            <Link
              to="/login"
              className="text-xs font-semibold text-zinc-300 hover:text-white transition-all bg-[#0d071a] hover:bg-[#190d33] py-1.5 px-3 rounded-lg border border-[#261540] hover:border-[#b57ede]/40"
            >
              {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
              <span className="font-bold text-[#b57ede] underline">{t("auth.signIn", "Sign In")}</span>
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
            className="w-full space-y-7 bg-[#0a0614]/90 border border-[#261540] p-8 md:p-10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl hover:border-[#b57ede]/40 transition-colors"
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
                  {t("auth.signUpSubtitle", "Create an Arab Pro account")}
                </h2>
                <p className="text-xs text-zinc-400">
                  {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#b57ede] hover:text-[#d3a6f7] hover:underline"
                  >
                    {t("auth.signIn", "Sign in")}
                  </Link>
                </p>
              </motion.div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
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

              {/* Name Field */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="text-xs font-bold uppercase tracking-wider text-[#b57ede]/90"
                >
                  {t("auth.fullNameLabel", "Full Name")}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <User className="h-4 w-4 text-zinc-500 group-focus-within:text-[#b57ede] transition-colors" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    placeholder={t("auth.fullNamePlaceholder", "Full Name")}
                    autoComplete="name"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border bg-black/60 py-2.5 ps-10 pe-4 text-sm text-white outline-hidden transition-all placeholder:text-zinc-600 focus:bg-black focus:ring-2 ${
                      errors.fullName
                        ? "border-red-500/50 focus:ring-red-500/20"
                        : "border-[#261540] focus:border-[#b57ede] focus:ring-[#b57ede]/25"
                    }`}
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-400 font-medium ps-1">{errors.fullName.message}</p>
                )}
              </motion.div>

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
                    placeholder={t("auth.createPasswordPlaceholder", "Create a strong password")}
                    autoComplete="new-password"
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
                      <span>{t("auth.creatingAccount", "Creating account...")}</span>
                    </>
                  ) : (
                    <span>{t("auth.register", "Register")}</span>
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
