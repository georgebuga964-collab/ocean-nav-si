import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, OceanNavLogo, Field, PrimaryButton, Wave } from "../components.jsx";
import { OCEAN, NAVY } from "../theme.js";
import { isValidEmail } from "../lib.js";
import { Mail, Lock } from "lucide-react";

export default function LoginScreen({ onNavigate }) {
  const { login, showToast } = useApp();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const errs = {};
    if (!isValidEmail(identifier)) errs.identifier = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);
    if (result.ok) {
      showToast(`Welcome back, ${result.user.name.split(" ")[0]}`);
      onNavigate("home");
    } else {
      setErrors({ password: result.error });
    }
  };

  const onKeyDown = (e) => e.key === "Enter" && submit();

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <StatusBar />
      <div className="px-8 pt-8 flex flex-col items-center">
        <OceanNavLogo size={54} />
        <span className="text-[15px] font-black tracking-wide mt-1" style={{ color: NAVY }}>
          OCEAN NAV <span style={{ color: OCEAN }}>SI</span>
        </span>
        <span className="text-[9px] font-semibold tracking-[0.15em] text-slate-500">NAVIGATE • PROTECT • CONNECT</span>
      </div>

      <div className="px-8 mt-9">
        <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
        <p className="text-slate-500 text-[13px] mt-1">Login to your account</p>
      </div>

      <div className="px-8 mt-6 space-y-3.5">
        <Field
          icon={Mail}
          placeholder="Email Address"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onKeyDown={onKeyDown}
          error={errors.identifier}
        />
        <Field
          icon={Lock}
          placeholder="Password"
          showToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          error={errors.password}
        />
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-[13px] text-slate-600">
            <input type="checkbox" className="rounded accent-[#02BFA5]" />
            Remember me
          </label>
          <button onClick={() => onNavigate("forgot")} className="text-[13px] font-semibold" style={{ color: OCEAN }}>
            Forgot Password?
          </button>
        </div>
      </div>

      <div className="px-8 mt-7">
        <PrimaryButton onClick={submit} loading={loading}>
          Login
        </PrimaryButton>
      </div>

      <div className="text-center mt-5 text-[13px] text-slate-500">
        Don't have an account?{" "}
        <button onClick={() => onNavigate("signup")} className="font-semibold" style={{ color: OCEAN }}>
          Create Account
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <Wave className="w-full h-20" />
      </div>
    </div>
  );
}
