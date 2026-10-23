import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, BottomNav } from "../components.jsx";
import { NAVY, OCEAN, DANGER } from "../theme.js";
import { Menu, AlertTriangle, Info, CheckCircle2, Bell } from "lucide-react";
import { formatDateTimeLong } from "../lib.js";

export default function NotificationsScreen({ onNavigate }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [tab, setTab] = useState("All");
  const filtered = tab === "All" ? notifications : notifications.filter((n) => n.cat === tab);

  const iconFor = (cat) => {
    if (cat === "Alerts") return { icon: AlertTriangle, bg: "#FDECEC", color: DANGER };
    if (cat === "Notices") return { icon: Info, bg: "#E9F1FE", color: "#2E6DEF" };
    return { icon: CheckCircle2, bg: "#E7F8EE", color: "#1E9E5A" };
  };

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <div style={{ background: NAVY }} className="px-5 pt-1 pb-4">
        <StatusBar dark />
        <div className="flex items-center justify-between mt-2">
          <Menu size={20} color="white" aria-hidden="true" />
          <span className="text-white font-semibold text-[15px]">Notifications</span>
          <button onClick={markAllNotificationsRead} className="text-[11px] text-white/70">
            Mark all as read
          </button>
        </div>
      </div>

      <div className="flex px-5 pt-3 gap-5 border-b border-slate-100">
        {["All", "Alerts", "Notices", "Updates"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-[13px] font-semibold border-b-2 ${tab === t ? "border-current" : "border-transparent text-slate-400"}`}
            style={{ color: tab === t ? OCEAN : undefined }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
              style={{ background: "#EFF6F6" }}
            >
              <Bell size={18} color={OCEAN} />
            </div>
            <p className="text-[13.5px] font-semibold text-slate-700">No notifications</p>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
              You're all caught up. When new notices arrive, they show up here.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
          const { icon: Icon, bg, color } = iconFor(n.cat);
          const sosAck = (n.title || '').toLowerCase().includes('sos') && (n.title || '').toLowerCase().includes('acknowledged');
          return (
            <button
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`w-full text-left flex gap-3 border rounded-xl p-3.5 shadow-sm relative ${sosAck ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-100'}`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: sosAck ? '#D1FAE5' : bg }}>
                <Icon size={16} color={sosAck ? '#0F766E' : color} />
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-slate-800">{n.title}</p>
                <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                <p className="text-[10.5px] text-slate-400 mt-1.5">{formatDateTimeLong(n.time)}</p>
              </div>
              {n.unread && <div className="w-2 h-2 rounded-full absolute right-3 top-4" style={{ background: sosAck ? '#10B981' : OCEAN }} />}
            </button>
          );
        })
        )}
      </div>

      <BottomNav active="notifications" onNavigate={onNavigate} />
    </div>
  );
}
