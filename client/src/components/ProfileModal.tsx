import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Upload, Key, Phone, User, Mail, Image } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { taskflowService } from "../services/taskflowService";
import { useToastStore } from "../stores/useToastStore";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Country {
  nameAr: string;
  nameEn: string;
  code: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { nameAr: "السعودية", nameEn: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { nameAr: "مصر", nameEn: "Egypt", code: "+20", flag: "🇪🇬" },
  { nameAr: "الإمارات", nameEn: "UAE", code: "+971", flag: "🇦🇪" },
  { nameAr: "قطر", nameEn: "Qatar", code: "+974", flag: "🇶🇦" },
  { nameAr: "الكويت", nameEn: "Kuwait", code: "+965", flag: "🇰🇼" },
  { nameAr: "عُمان", nameEn: "Oman", code: "+968", flag: "🇴🇲" },
  { nameAr: "البحرين", nameEn: "Bahrain", code: "+973", flag: "🇧🇭" },
  { nameAr: "الأردن", nameEn: "Jordan", code: "+962", flag: "🇯🇴" },
  { nameAr: "فلسطين", nameEn: "Palestine", code: "+970", flag: "🇵🇸" },
  { nameAr: "لبنان", nameEn: "Lebanon", code: "+961", flag: "🇱🇧" },
  { nameAr: "سوريا", nameEn: "Syria", code: "+963", flag: "🇸🇾" },
  { nameAr: "العراق", nameEn: "Iraq", code: "+964", flag: "🇮🇶" },
  { nameAr: "اليمن", nameEn: "Yemen", code: "+967", flag: "🇾🇪" },
  { nameAr: "المغرب", nameEn: "Morocco", code: "+212", flag: "🇲🇦" },
  { nameAr: "الجزائر", nameEn: "Algeria", code: "+213", flag: "🇩🇿" },
  { nameAr: "تونس", nameEn: "Tunisia", code: "+216", flag: "🇹🇳" },
  { nameAr: "ليبيا", nameEn: "Libya", code: "+218", flag: "🇱🇾" },
  { nameAr: "السودان", nameEn: "Sudan", code: "+249", flag: "🇸🇩" },
  { nameAr: "أمريكا / كندا", nameEn: "USA / Canada", code: "+1", flag: "🇺🇸" },
  { nameAr: "بريطانيا", nameEn: "UK", code: "+44", flag: "🇬🇧" },
  { nameAr: "تركيا", nameEn: "Turkey", code: "+90", flag: "🇹🇷" },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { user, setUser } = useAuth();
  const addToast = useToastStore((state) => state.addToast);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize values when modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.fullName || "");
      setAvatarUrl(user.avatarUrl || "");

      // Parse phone number
      const phone = user.phoneNumber || "";
      let matched = false;
      if (phone.startsWith("+")) {
        // Sort countries by dial code length descending to match longest code first (+971 before +9)
        const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
        for (const country of sortedCountries) {
          if (phone.startsWith(country.code)) {
            setSelectedCountry(country);
            // Slice prefix and any trailing spaces
            setLocalPhone(phone.substring(country.code.length).trim());
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        // Default to Saudi or first country
        setSelectedCountry(COUNTRIES[0]);
        setLocalPhone(phone);
      }

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, user]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit base64 file upload to 4MB)
    if (file.size > 4 * 1024 * 1024) {
      addToast(
        isAr ? "حجم الملف كبير جداً! الحد الأقصى هو 4 ميجابايت" : "File size is too large! Maximum is 4MB",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChoosePreset = () => {
    // Generate a cool dicebear preset
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsPending(true);
    try {
      // 1. Update Profile info
      const fullPhoneString = localPhone.trim() ? `${selectedCountry.code} ${localPhone.trim()}` : "";

      const updatedUser = await taskflowService.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: fullPhoneString,
        avatarUrl: avatarUrl,
      });

      // Update auth context state
      setUser(updatedUser);

      // 2. Update Password if fields are populated
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error(isAr ? "يرجى ملء جميع حقول كلمة المرور" : "Please fill all password fields");
        }
        if (newPassword !== confirmPassword) {
          throw new Error(isAr ? "كلمات المرور الجديدة غير متطابقة" : "New passwords do not match");
        }

        await taskflowService.changePassword({
          currentPassword,
          newPassword,
        });

        addToast(
          isAr ? "تم تحديث الملف الشخصي وتغيير كلمة المرور بنجاح!" : "Profile and password updated successfully!",
          "success"
        );
      } else {
        addToast(
          isAr ? "تم تحديث الملف الشخصي بنجاح!" : "Profile updated successfully!",
          "success"
        );
      }

      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message || err.message || "Failed to update profile";
      addToast(errMsg, "error");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar transition-all text-start relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-extrabold text-zinc-950 dark:text-white">{t("profile.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-755 dark:hover:text-zinc-150 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-zinc-150/40 dark:border-zinc-800/40">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl || "https://api.dicebear.com/7.x/bottts/svg"}
                alt="Profile Preview"
                className="h-20 w-20 rounded-full border-2 border-purple-500/50 object-cover bg-zinc-850 p-0.5"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="flex flex-col gap-2 w-full text-center sm:text-start">
              <span className="text-xs font-bold text-zinc-450 dark:text-zinc-400 block">
                {t("profile.avatarUrl")}
              </span>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t("profile.uploadAvatar")}
                </button>
                <button
                  type="button"
                  onClick={handleChoosePreset}
                  className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Image className="h-3.5 w-3.5" />
                  {t("profile.avatarPreset")}
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* User Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-zinc-455 dark:text-zinc-555 tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {t("profile.fullName")}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/25 py-2 px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 font-semibold"
                  required
                />
              </div>

              {/* Email (Disabled) */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-zinc-455 dark:text-zinc-555 tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {isAr ? "البريد الإلكتروني (غير قابل للتعديل)" : "Email Address (Read Only)"}
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/40 py-2 px-3 text-sm text-zinc-450 dark:text-zinc-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Phone Number with Custom Country Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-zinc-455 dark:text-zinc-555 tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {t("profile.phoneNumber")}
              </label>

              <div className="flex gap-2 relative">
                {/* Custom Dial Code Dropdown */}
                <div ref={dropdownRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="h-full flex items-center gap-1.5 px-3 bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <span>{selectedCountry.flag}</span>
                    <span dir="ltr">{selectedCountry.code}</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full mt-1.5 start-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1 z-50 max-h-56 overflow-y-auto custom-scrollbar">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code + country.nameEn}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-800 dark:text-zinc-200 cursor-pointer ${selectedCountry.code === country.code ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold" : ""
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{isAr ? country.nameAr : country.nameEn}</span>
                          </div>
                          <span dir="ltr" className="font-semibold text-zinc-400 dark:text-zinc-500">
                            {country.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Local Phone input */}
                <input
                  type="tel"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={t("profile.placeholderPhone")}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/25 py-2 px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Change Password Block */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-455 dark:text-zinc-555 tracking-wider flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" />
              <span>{t("profile.changePasswordTitle")}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{t("profile.currentPassword")}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/25 py-2 px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{t("profile.newPassword")}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/25 py-2 px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{t("profile.confirmPassword")}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/25 py-2 px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-350 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {t("profile.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t("profile.saveChanges")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
