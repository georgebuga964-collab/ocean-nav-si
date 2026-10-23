import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, BackHeader, Field, PrimaryButton, Wave } from "../components.jsx";
import { OCEAN } from "../theme.js";
import { isValidEmail } from "../lib.js";
import { Mail, Lock } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function ForgotPasswordScreen({ onNavigate }) {
  const { showToast } = useApp();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isValidEmail(identifier)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    showToast("Reset link sent — check your inbox");
    onNavigate("login");
  };

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <StatusBar />
      <BackHeader onBack={() => onNavigate("login")} />
      <div className="flex-1 flex flex-col items-center px-9 mt-10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "#EAF6F5" }}>
          <Lock size={30} color={OCEAN} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Forgot Password?</h2>
        <p className="text-slate-500 text-[13px] text-center mt-2 leading-relaxed">
          Enter your email address and we'll send you a reset link.
        </p>

        <div className="w-full mt-7">
          <Field
            icon={Mail}
            placeholder="Email Address"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            error={error}
          />
        </div>

        <div className="w-full mt-6">
          <PrimaryButton onClick={submit} loading={loading}>
            Send Reset Link
          </PrimaryButton>
        </div>

        <button onClick={() => onNavigate("login")} className="mt-5 text-[13px] font-semibold" style={{ color: OCEAN }}>
          Back to Login
        </button>
      </div>
      <Wave className="w-full h-16" />
    </div>
  );
}
