import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, BackHeader, Field, PrimaryButton } from "../components.jsx";
import { OCEAN } from "../theme.js";
import { isValidEmail, isValidPhone, isValidPassword } from "../lib.js";
import { User, Phone, Mail, Lock } from "lucide-react";

export default function SignupScreen({ onNavigate }) {
  const { signup, showToast } = useApp();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!isValidPhone(form.phone)) errs.phone = "Enter a valid phone number";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email address";
    if (!isValidPassword(form.password)) errs.password = "Password must be at least 6 characters";
    if (!agree) errs.agree = "You must agree to continue";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const result = await signup(form);
    setLoading(false);
    if (result.ok && result.needsEmailConfirmation) {
      showToast("Confirm your email, then log in to continue");
      onNavigate("login");
    } else if (result.ok) {
      showToast("Account created — welcome to OceanNav");
      onNavigate("home");
    } else {
      setErrors({ email: result.error });
    }
  };

  const onKeyDown = (e) => e.key === "Enter" && submit();

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <StatusBar />
      <BackHeader onBack={() => onNavigate("login")} />
      <div className="px-8 mt-4">
        <h2 className="text-xl font-bold text-slate-900">Create Account</h2>
        <p className="text-slate-500 text-[13px] mt-1">Join OceanNav SI</p>
      </div>

      <div className="px-8 mt-6 space-y-3.5 flex-1 overflow-y-auto pb-4">
        <Field icon={User} placeholder="Full Name" value={form.name} onChange={update("name")} onKeyDown={onKeyDown} error={errors.name} />
        <Field icon={Phone} placeholder="Phone Number" value={form.phone} onChange={update("phone")} onKeyDown={onKeyDown} error={errors.phone} inputMode="tel" />
        <Field icon={Mail} placeholder="Email Address" value={form.email} onChange={update("email")} onKeyDown={onKeyDown} error={errors.email} inputMode="email" />
        <Field icon={Lock} placeholder="Password" showToggle value={form.password} onChange={update("password")} onKeyDown={onKeyDown} error={errors.password} />
        <label className="flex items-start gap-2 text-[12.5px] text-slate-600 pt-1">
          <input type="checkbox" className="mt-0.5 rounded accent-[#02BFA5]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I agree to the <span className="font-semibold" style={{ color: OCEAN }}>Terms &amp; Conditions</span> and{" "}
            <span className="font-semibold" style={{ color: OCEAN }}>Privacy Policy</span>
          </span>
        </label>
        {errors.agree && <p className="text-[11.5px] -mt-2" style={{ color: DANGER }}>{errors.agree}</p>}
      </div>

      <div className="px-8 mt-2">
        <PrimaryButton onClick={submit} loading={loading}>
          Create Account
        </PrimaryButton>
      </div>

      <div className="text-center my-5 text-[13px] text-slate-500">
        Already have an account?{" "}
        <button onClick={() => onNavigate("login")} className="font-semibold" style={{ color: OCEAN }}>
          Login
        </button>
      </div>
    </div>
  );
}
