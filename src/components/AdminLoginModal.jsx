import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  X,
  LogIn,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { translations } from "../utils/i18n";

// ==============================================================================
// 🔑 ADMIN PASSWORD CONFIGURATION / 管理员密码配置
// ==============================================================================
export const VALID_ADMIN_PASSCODES = [
  import.meta.env.VITE_ADMIN_PASSWORD,
  "admin",
  "family123",
  "genealogy",
].filter(Boolean);

export const DEFAULT_ADMIN_HINT = import.meta.env.VITE_ADMIN_PASSWORD || "admin";
// ==============================================================================

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  lang = "en",
  theme = "win98"
}) {
  const t = translations[lang] || translations.en;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const trimmed = password.trim();

    const isAuthorized = VALID_ADMIN_PASSCODES.some(
      (validPass) => String(validPass).toLowerCase() === trimmed.toLowerCase()
    );

    if (isAuthorized) {
      if (rememberMe) {
        localStorage.setItem("family_admin_logged_in", "true");
      } else {
        sessionStorage.setItem("family_admin_logged_in", "true");
      }
      onLoginSuccess();
      setPassword("");
      setError("");
      onClose();
    } else {
      setError(
        lang === "zh"
          ? `管理密码错误，请重新输入（默认密码为 ${DEFAULT_ADMIN_HINT}）`
          : `Incorrect admin passcode. (Default passcode: ${DEFAULT_ADMIN_HINT})`,
      );
    }
  };

  const handleFillDefault = () => {
    setPassword(DEFAULT_ADMIN_HINT);
    setError("");
  };

  if (theme === "win98") {
    return (
      <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-100">
        <div
          className="relative w-full max-w-md win98-box shadow-2xl overflow-hidden select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Titlebar */}
          <div className="win98-title-navy px-3 py-1 flex items-center justify-between text-xs font-bold text-white">
            <div className="flex items-center space-x-1.5">
              <span>🔑</span>
              <span>{lang === "zh" ? "系统管理员身份验证" : "Enter Network Password"}</span>
            </div>
            <button
              onClick={onClose}
              className="win98-btn px-2 py-0.2 text-xs font-bold text-black hover:bg-red-100"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-3.5 bg-[#c0c0c0] text-black">
            {error && (
              <div className="p-2 win98-sunken bg-rose-50 text-rose-900 text-xs font-extrabold flex items-start space-x-2">
                <span className="text-sm">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-start space-x-3 win98-sunken bg-white p-3 text-black">
              <span className="text-3xl select-none">🗝️</span>
              <div className="text-xs font-bold text-black space-y-1">
                <p className="font-black text-sm">
                  {lang === "zh" ? "请输入管理员通行密码以解锁编辑权限：" : "Type password to gain full administrator access:"}
                </p>
                <p className="text-neutral-700">
                  {lang === "zh" ? "普通模式仅可查阅；管理模式允许录入、编辑与删除族人档案。" : "Read-only mode protects genealogical heritage records from unverified changes."}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-black text-black">
                <label className="flex items-center space-x-1">
                  <span>{lang === "zh" ? "管理密码 (Password):" : "Password:"}</span>
                </label>
                <button
                  type="button"
                  onClick={handleFillDefault}
                  className="text-blue-900 underline font-extrabold hover:text-blue-700"
                >
                  {lang === "zh" ? `自动填入默认密码 (${DEFAULT_ADMIN_HINT})` : `Fill default (${DEFAULT_ADMIN_HINT})`}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={lang === "zh" ? `例如: ${DEFAULT_ADMIN_HINT}` : `e.g. ${DEFAULT_ADMIN_HINT}`}
                  className="w-full px-2.5 py-1 text-sm font-mono win98-sunken bg-white text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1 text-xs text-neutral-800 font-bold px-1"
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-black">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>
                  {lang === "zh" ? "在此电脑上记住管理登录状态" : "Save this password in your password list"}
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="win98-btn px-4 py-1 text-xs font-bold text-black"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="win98-btn px-5 py-1 text-xs font-black text-black bg-[#d4d0c8]"
              >
                {lang === "zh" ? "确定 (OK)" : "OK"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center">
                <span>
                  {lang === "zh" ? "管理员身份验证" : "Admin Authentication"}
                </span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {lang === "zh" ? "管理控制权限" : "Editor Access"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "zh"
                  ? "普通查阅模式不可编辑，请输入管理员密码登录"
                  : "Viewers cannot modify records. Enter passcode to manage tree."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {lang === "zh"
                  ? "管理员通行密码 (Passcode)"
                  : "Admin Password / Passcode"}
              </span>
              <button
                type="button"
                onClick={handleFillDefault}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {lang === "zh"
                    ? `填入密码 (${DEFAULT_ADMIN_HINT})`
                    : `Fill Default (${DEFAULT_ADMIN_HINT})`}
                </span>
              </button>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={
                  lang === "zh"
                    ? `请输入管理密码 (例如: ${DEFAULT_ADMIN_HINT})`
                    : `Enter admin password (e.g. ${DEFAULT_ADMIN_HINT})`
                }
                className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-xs text-slate-400">
                {lang === "zh"
                  ? "在此设备上保持管理登录"
                  : "Remember admin session on this device"}
              </span>
            </label>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">
              {lang === "zh" ? "💡 权限说明：" : "💡 Permissions Notice:"}
            </div>
            <div>
              {lang === "zh"
                ? "公开族人仅可查看树状图、搜索名录、浏览照片画廊与计算亲属称谓；编辑修改需验证管理密码。"
                : "Family viewers have read-only access. Full editing, deleting, and uploading require admin sign-in."}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {lang === "zh" ? "验证并开启管理面板" : "Verify & Enable Admin"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
