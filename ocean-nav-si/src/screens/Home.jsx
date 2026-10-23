import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, Modal, PrimaryButton, SecondaryButton, BottomNav } from "../components.jsx";
import { NAVY, OCEAN, DANGER } from "../theme.js";
import { Menu, Bell, Ship, MapPin, LifeBuoy, ShieldCheck } from "lucide-react";
import { formatDateTime } from "../lib.js";

export default function HomeScreen({ onNavigate }) {
  const { user, trips, sendSos, showToast } = useApp();
  const [sosStep, setSosStep] = useState(null); // null | "confirm" | "sent"
  const activeTrip = trips.find(t => t.status === "Active");
  const hasActiveTrip = !!activeTrip;

  const quickActions = [
    { label: "Start Trip", icon: Ship, bg: "#0A1E3D", iconColor: "white", action: () => onNavigate("startTrip"), disabled: false },
    { label: "View Map", icon: MapPin, bg: "#EAF6F5", iconColor: OCEAN, action: () => onNavigate("map"), disabled: false },
    { label: "Emergency SOS", icon: LifeBuoy, bg: hasActiveTrip ? "#FDECEC" : "#F1F5F9", iconColor: hasActiveTrip ? DANGER : "#94A3B8", badge: "SOS", action: () => hasActiveTrip && setSosStep("confirm"), disabled: !hasActiveTrip },
    { label: "Safety Information", icon: ShieldCheck, bg: "#F1F0FB", iconColor: "#5B4FCF", action: () => onNavigate("safety"), disabled: false },
  ];

  const latestTrip = trips[0];

  const confirmSos = async () => {
    const result = await sendSos();
    if (result?.ok) setSosStep("sent");
    else showToast(result?.error || "Unable to send SOS", "error");
  };

  return (
    <div className="relative h-full flex flex-col bg-slate-50 overflow-hidden">
      <div style={{ background: NAVY }} className="pb-6 rounded-b-3xl">
        <StatusBar dark />
        <div className="flex items-center justify-between px-5 mt-2">
          <Menu size={22} color="white" aria-hidden="true" />
          <button onClick={() => onNavigate("notifications")} aria-label="Notifications">
            <Bell size={20} color="white" />
          </button>
        </div>
        <div className="px-5 mt-3">
          <p className="text-white/70 text-[13px]">Welcome Back,</p>
          <h1 className="text-white text-xl font-bold">{user?.name || "Sailor"}</h1>
          <p className="text-white/60 text-[12px] mt-0.5">Stay safe. Stay informed.</p>
        </div>

        <div className="mx-5 mt-4 rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(120deg,#12406b,#0d5b6b)" }}>
          <div className="p-4 relative z-10">
            <p className="text-white font-bold text-[15px] leading-snug">
              OceanNav SI
              <br />
              Marine Safety
            </p>
            <p className="text-white/70 text-[11px] mt-1">Protecting Every Voyage. Saving Every Life.</p>
          </div>
          <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ShieldCheck size={16} color="white" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 -mt-1">
        <p className="text-[13px] font-semibold text-slate-700 mt-4 mb-2.5">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ label, icon: Icon, bg, iconColor, badge, action, disabled }) => (
            <button
              key={label}
              onClick={action}
              disabled={disabled}
              aria-disabled={disabled || undefined}
              title={disabled ? "Start a trip first to enable SOS" : undefined}
              className={`bg-white rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm border border-slate-100 relative transition-transform ${disabled ? 'opacity-55 cursor-not-allowed' : 'active:scale-[0.97]'}`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: bg }}>
                {badge ? (
                  <span
                    className="text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ background: disabled ? "#94A3B8" : DANGER, borderRadius: 999, width: 24, height: 24 }}
                  >
                    {badge}
                  </span>
                ) : (
                  <Icon size={18} color={iconColor} />
                )}
              </div>
              <span className={`text-[12px] font-medium text-center ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 mb-2.5">
          <p className="text-[13px] font-semibold text-slate-700">Recent Activity</p>
          <button className="text-[12px] font-semibold" style={{ color: OCEAN }} onClick={() => onNavigate("trips")}>
            View All
          </button>
        </div>

        {latestTrip ? (
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#DDEEF6" }}>
              <Ship size={18} color={NAVY} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-slate-800">{latestTrip.route}</p>
              <p className="text-[11px] text-slate-400">{formatDateTime(latestTrip.date)}</p>
            </div>
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: latestTrip.status === "Completed" ? "#E7F8EE" : latestTrip.status === "Active" ? "#E9F1FE" : "#FDF2DE",
                color: latestTrip.status === "Completed" ? "#1E9E5A" : latestTrip.status === "Active" ? "#2E6DEF" : "#C4841D",
              }}
            >
              {latestTrip.status}
            </span>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-100">
            <p className="text-[12.5px] text-slate-400">No trips logged yet.</p>
            <button onClick={() => onNavigate("startTrip")} className="text-[12.5px] font-semibold mt-1" style={{ color: OCEAN }}>
              Log your first trip
            </button>
          </div>
        )}
      </div>

      <Modal open={sosStep === "confirm"} onClose={() => setSosStep(null)} title="Send Emergency SOS?" tone="danger">
        {!hasActiveTrip ? (
          <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
            SOS is only available while a trip is active. Start a trip first.
          </p>
        ) : (
          <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
            This logs an emergency SOS for <strong>{activeTrip.route}</strong> with your account details and last known location, visible immediately in the OceanNav Admin command centre. Only use this in a genuine emergency.
          </p>
        )}
        <div className="space-y-2.5">
          <PrimaryButton onClick={confirmSos} danger disabled={!hasActiveTrip}>
            Confirm SOS Alert
          </PrimaryButton>
          <SecondaryButton onClick={() => setSosStep(null)}>Cancel</SecondaryButton>
        </div>
      </Modal>

      <Modal open={sosStep === "sent"} onClose={() => setSosStep(null)} title="SOS Alert Sent">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: "#FDECEC" }}>
            <LifeBuoy size={28} color={DANGER} />
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Your alert has been logged. Monitors at the OceanNav Admin command centre can see it on the Live Map and in the SOS Alerts panel. Stay where you are if it's safe to do so.
          </p>
        </div>
        <PrimaryButton onClick={() => setSosStep(null)}>Close</PrimaryButton>
      </Modal>

      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}
