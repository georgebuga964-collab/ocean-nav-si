import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, BottomNav, Modal, PrimaryButton, SecondaryButton } from "../components.jsx";
import { NAVY, DANGER } from "../theme.js";
import { Menu, UserCircle, ShieldCheck, BookOpen, Lock, Info, LifeBuoy, User, ChevronRight } from "lucide-react";

export default function ProfileScreen({ onNavigate }) {
  const { user, logout } = useApp();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const rows = [
    { icon: User, label: "Edit Profile", color: "#5B7CFA", action: () => onNavigate("editProfile") },
    { icon: ShieldCheck, label: "Safety Settings", color: "#1E9E5A", action: () => onNavigate("safety") },
    { icon: BookOpen, label: "Help & Support", color: "#2E6DEF", action: () => { } },
    { icon: Lock, label: "Privacy Policy", color: "#C4841D", action: () => { } },
    { icon: Info, label: "Terms & Conditions", color: "#2E6DEF", action: () => { } },
  ];

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <div style={{ background: NAVY }} className="px-5 pt-1 pb-5">
        <StatusBar dark />
        <div className="flex items-center justify-between mt-2">
          <Menu size={20} color="white" aria-hidden="true" />
          <span className="text-white font-semibold text-[15px]">Profile</span>
          <div className="w-5" />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30">
            <UserCircle size={40} color="white" />
          </div>
          <div>
            <p className="text-white font-bold text-[16px]">{user?.name}</p>
            <p className="text-white/70 text-[12.5px] mt-0.5">{user?.phone}</p>
            <p className="text-white/70 text-[12.5px]">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4">
        <div className="rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {rows.map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action} className="w-full flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Icon size={17} color={color} />
                <span className="text-[13.5px] font-medium text-slate-700">{label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setConfirmingLogout(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 mt-3 rounded-xl border border-slate-100 shadow-sm"
        >
          <LifeBuoy size={17} color={DANGER} />
          <span className="text-[13.5px] font-semibold" style={{ color: DANGER }}>
            Logout
          </span>
        </button>
      </div>

      <Modal open={confirmingLogout} onClose={() => setConfirmingLogout(false)} title="Log out?">
        <p className="text-[13px] text-slate-600 mb-5">You'll need to log in again to access your trips and alerts.</p>
        <div className="space-y-2.5">
          <PrimaryButton
            danger
            onClick={() => {
              logout();
              onNavigate("login");
            }}
          >
            Log Out
          </PrimaryButton>
          <SecondaryButton onClick={() => setConfirmingLogout(false)}>Cancel</SecondaryButton>
        </div>
      </Modal>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}
