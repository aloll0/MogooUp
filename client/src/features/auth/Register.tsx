import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";

// Form validation matching backend Zod schema
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Must include at least one lowercase letter")
    .regex(/[A-Z]/, "Must include at least one uppercase letter")
    .regex(/[0-9]/, "Must include at least one number"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerApi } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-theme">
        <div className="w-full max-w-md space-y-6 text-center bg-white dark:bg-zinc-900/60 dark:border dark:border-zinc-800/80 p-8 rounded-2xl shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Check your email
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We've sent a verification link to your email address. Please click the link to verify your account and activate Mogoo.
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 px-4 text-sm font-semibold text-white shadow-md transition-all active:scale-98"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 font-sans transition-theme">
      {/* Brand Side Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-linear-to-tr from-purple-800 to-indigo-950 text-white flex-col justify-between p-12">
        {/* Animated background highlights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-700 shadow-md">
            <span className="text-xl font-bold">M</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">Mogoo</span>
        </div>

        {/* Hero message */}
        <div className="my-auto max-w-md space-y-6">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            Built for modern teams.
          </h1>
          <p className="text-lg text-purple-100/85 leading-relaxed">
            Collaborate, structure, track progress, and release features in a platform designed to be extremely lightweight and blazingly fast.
          </p>
        </div>

        {/* Copy footnote */}
        <div className="text-sm text-purple-300/60">
          © 2026 Mogoo Systems, Inc. All rights reserved.
        </div>
      </div>

      {/* Registration Card Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900/60 dark:border dark:border-zinc-800/80 p-8 rounded-2xl shadow-xl lg:shadow-none">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create an account
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/20 py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-50 outline-hidden transition-all placeholder:text-zinc-400 focus:bg-white focus:ring-2 dark:focus:bg-zinc-950/50 ${
                    errors.fullName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200/50 dark:border-red-950/80"
                      : "border-zinc-200 focus:border-purple-500 focus:ring-purple-200/50 dark:border-zinc-800"
                  }`}
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/20 py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-50 outline-hidden transition-all placeholder:text-zinc-400 focus:bg-white focus:ring-2 dark:focus:bg-zinc-950/50 ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200/50 dark:border-red-950/80"
                      : "border-zinc-200 focus:border-purple-500 focus:ring-purple-200/50 dark:border-zinc-800"
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-zinc-50/50 dark:bg-zinc-950/20 py-2.5 pl-10 pr-10 text-sm text-zinc-900 dark:text-zinc-50 outline-hidden transition-all placeholder:text-zinc-400 focus:bg-white focus:ring-2 dark:focus:bg-zinc-950/50 ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200/50 dark:border-red-950/80"
                      : "border-zinc-200 focus:border-purple-500 focus:ring-purple-200/50 dark:border-zinc-800"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 py-2.5 px-4 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
