import React, { useState } from "react";
import {
  Eye, EyeOff, Bell, ArrowLeft, AlertTriangle, CheckCircle2,
  Loader2, Home as HomeIcon, MapPin, Ship, UserCircle,
} from "lucide-react";
import { NAVY, OCEAN, DANGER, BLUE, OCEAN_BLUE, AQUA, OFF_WHITE } from "./theme.js";

export function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute top-3 left-4 right-4 z-50 rounded-xl px-4 py-3 shadow-lg text-[13px] font-medium text-white flex items-center gap-2 animate-[fadeIn_0.15s_ease-out]"
      style={{ background: isError ? DANGER : NAVY }}
    >
      {isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      <span>{toast.message}</span>
    </div>
  );
}

/* --------------------------------- Modal -------------------------------- */

export function Modal({ open, onClose, title, children, tone = "default" }) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(8,27,54,0.55)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full bg-white rounded-t-3xl p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
        {title && (
          <h3
            className="text-[16px] font-bold mb-2"
            style={{ color: tone === "danger" ? DANGER : NAVY }}
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ UI primitives --------------------------- */

export function PhoneFrame({ children }) {
  return (
    <div className="w-full flex items-center justify-center py-8 bg-slate-100 min-h-screen">
      <div
        className="relative w-[375px] h-[812px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-slate-900 flex flex-col"
        style={{ boxShadow: "0 25px 60px -15px rgba(11,37,69,0.5)" }}
      >
        {children}
      </div>
    </div>
  );
}

export function StatusBar({ dark }) {
  return (
    <div
      className={`flex items-center justify-between px-6 pt-3 pb-1 text-[13px] font-semibold ${dark ? "text-white" : "text-slate-900"
        }`}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
          <rect x="0" y="7" width="3" height="5" rx="0.5" fill="currentColor" />
          <rect x="5" y="5" width="3" height="7" rx="0.5" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          <path
            d="M8 10.5c-2.2 0-4.2-.9-5.6-2.4a.5.5 0 01.02-.7 9.5 9.5 0 0111.16 0 .5.5 0 01.02.7A7.9 7.9 0 018 10.5z"
            fill="currentColor"
          />
        </svg>
        <div className="w-6 h-3 border border-current rounded-sm relative flex items-center px-[1px]">
          <div className="w-full h-full bg-current rounded-[1px] scale-90 origin-left" />
        </div>
      </div>
    </div>
  );
}

export function OceanNavLogo({ size = 84, dark = false, showWordmark = false }) {
  const textColor = dark ? "white" : NAVY;
  return (
    <div className={`flex items-center ${showWordmark ? "gap-3" : "justify-center"}`}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-label="OceanNav SI logo" role="img">
        <defs>
          <linearGradient id="navWave" x1="15" y1="92" x2="88" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor={OCEAN_BLUE} />
            <stop offset="0.55" stopColor={BLUE} />
            <stop offset="1" stopColor={OCEAN} />
          </linearGradient>
          <linearGradient id="navCompass" x1="56" y1="8" x2="72" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor={AQUA} />
            <stop offset="1" stopColor={OCEAN_BLUE} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="45" stroke={dark ? OFF_WHITE : NAVY} strokeWidth="5" opacity="0.96" />
        <path d="M60 6L68 48L60 42L52 48L60 6Z" fill="url(#navCompass)" />
        <path d="M60 42L72 73L60 65L48 73L60 42Z" fill={BLUE} />
        <path d="M16 79C28 61 45 58 57 66C43 65 31 73 25 89C22 94 18 98 13 100C17 94 18 86 16 79Z" fill="url(#navWave)" />
        <path d="M21 91C38 82 50 86 64 93C75 99 86 97 99 89" stroke={OCEAN} strokeWidth="5" strokeLinecap="round" />
        <path d="M25 101C43 93 57 98 70 103C82 107 93 103 103 97" stroke={OCEAN_BLUE} strokeWidth="4" strokeLinecap="round" />
        <path d="M61 85C72 84 84 83 93 78L101 78L94 84C84 89 73 90 61 89Z" fill={dark ? OFF_WHITE : NAVY} />
        <path d="M84 78L88 70L92 78" stroke={dark ? OFF_WHITE : NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M91 30C91 25 95 21 100 21C105 21 109 25 109 30C109 37 100 44 100 44C100 44 91 37 91 30Z" fill={OCEAN} />
        <circle cx="100" cy="30" r="3.5" fill={OFF_WHITE} />
        <path d="M84 39C91 41 96 46 99 51" stroke={OCEAN} strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
      </svg>
      {showWordmark && (
        <div className="leading-none">
          <div className="font-black tracking-tight text-[28px]" style={{ color: textColor }}>
            OCEAN
            <br />
            NAV <span style={{ color: OCEAN }}>SI</span>
          </div>
          <div className="mt-1 text-[8px] font-semibold tracking-[0.18em]" style={{ color: dark ? "rgba(255,255,255,.75)" : NAVY }}>
            NAVIGATE • PROTECT • CONNECT
          </div>
        </div>
      )}
    </div>
  );
}

export function Wave({ className }) {
  return (
    <svg className={className} viewBox="0 0 375 90" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 40 C60 10 110 70 190 40 C260 15 320 65 375 30 L375 90 L0 90 Z"
        fill={OCEAN}
        opacity="0.35"
      />
      <path
        d="M0 55 C70 25 120 80 200 50 C270 25 330 75 375 45 L375 90 L0 90 Z"
        fill={OCEAN}
      />
    </svg>
  );
}

export function Field({
  id,
  icon: Icon,
  placeholder,
  type = "text",
  showToggle,
  value,
  onChange,
  onKeyDown,
  error,
  inputMode,
}) {
  const [visible, setVisible] = useState(false);
  const realType = showToggle ? (visible ? "text" : "password") : type;
  const inputId = id || placeholder.replace(/\s+/g, "-").toLowerCase();
  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>
      <div
        className={`flex items-center gap-3 bg-slate-50 border rounded-xl px-4 py-3.5 ${error ? "border-red-400" : "border-slate-200"
          }`}
      >
        <Icon size={18} className="text-slate-400 shrink-0" aria-hidden="true" />
        <input
          id={inputId}
          className="flex-1 bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400"
          placeholder={placeholder}
          type={realType}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-slate-400"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-[11.5px] mt-1 ml-1" style={{ color: DANGER }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function PrimaryButton({ children, onClick, loading, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-xl text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
      style={{
        background: danger
          ? `linear-gradient(135deg, ${DANGER}, #B92E2E)`
          : `linear-gradient(135deg, ${OCEAN}, #0D47A1)`,
        boxShadow: danger
          ? "0 10px 25px -8px rgba(225,68,68,0.6)"
          : "0 10px 25px -8px rgba(26,166,160,0.6)",
      }}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3.5 rounded-xl font-semibold text-[14px] border border-slate-200 text-slate-600 active:scale-[0.98] transition-transform"
    >
      {children}
    </button>
  );
}

export function BackHeader({ title, onBack }) {
  return (
    <div className="flex items-center px-5 pt-3 pb-1">
      <button onClick={onBack} className="p-1 -ml-1 text-slate-700" aria-label="Go back">
        <ArrowLeft size={22} />
      </button>
      {title && <span className="ml-3 text-[15px] font-semibold text-slate-800">{title}</span>}
    </div>
  );
}

export function BottomNav({ active, onNavigate }) {
  const items = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "map", label: "Map", icon: MapPin },
    { key: "trips", label: "Trips", icon: Ship },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "profile", label: "Profile", icon: UserCircle },
  ];
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 pt-2 pb-2"
      aria-label="Primary"
    >
      <div className="flex justify-between">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="flex flex-col items-center gap-1 flex-1 py-1"
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} color={isActive ? NAVY : "#94A3B8"} />
              <span className="text-[10px] font-medium" style={{ color: isActive ? NAVY : "#94A3B8" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="w-32 h-1 bg-slate-800 rounded-full mx-auto mt-2 opacity-80" />
    </nav>
  );
}
