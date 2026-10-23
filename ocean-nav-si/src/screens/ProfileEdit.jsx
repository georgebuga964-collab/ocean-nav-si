import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, BackHeader, Field, PrimaryButton } from "../components.jsx";
import { isValidEmail, isValidPhone } from "../lib.js";
import { User, Phone, Mail } from "lucide-react";

export default function EditProfileScreen({ onNavigate }) {
  const { user, updateProfile, showToast } = useApp();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", email: user?.email || "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!isValidPhone(form.phone)) errs.phone = "Enter a valid phone number";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email address";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const result = await updateProfile(form);
    setLoading(false);
    if (!result?.ok) {
      setErrors({ email: result?.error || "Unable to update profile" });
      return;
    }
    showToast(result.emailPendingConfirmation
      ? "Confirmation email sent — check your inbox to change the address"
      : "Profile updated");
    onNavigate("profile");
  };

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <StatusBar />
      <BackHeader title="Edit Profile" onBack={() => onNavigate("profile")} />
      <div className="px-6 mt-4 space-y-3.5 flex-1">
        <Field icon={User} placeholder="Full Name" value={form.name} onChange={update("name")} error={errors.name} />
        <Field icon={Phone} placeholder="Phone Number" value={form.phone} onChange={update("phone")} error={errors.phone} inputMode="tel" />
        <Field icon={Mail} placeholder="Email Address" value={form.email} onChange={update("email")} error={errors.email} inputMode="email" />
      </div>
      <div className="px-6 pb-6">
        <PrimaryButton onClick={submit} loading={loading}>
          Save Changes
        </PrimaryButton>
      </div>
    </div>
  );
}
