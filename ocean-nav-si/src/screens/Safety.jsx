import React from "react";
import { StatusBar, BackHeader } from "../components.jsx";
import { ShieldCheck } from "lucide-react";

export default function SafetyScreen({ onNavigate }) {
  const tips = [
    { title: "Wear a life jacket", body: "Always wear an approved life jacket while underway, regardless of trip length." },
    { title: "Check the weather", body: "Confirm marine forecasts and advisories before departure, especially in Western Province." },
    { title: "File a trip plan", body: "Log your route, vessel, and passenger count in the app before you leave port." },
    { title: "Carry a working radio", body: "VHF radio or satellite communicator should be tested before every voyage." },
    {
      title: "Know your SOS",
      body: "The Emergency SOS button on Home logs an SOS with your account details and location so monitors at the OceanNav Admin command centre can see it.",
    },
  ];
  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <StatusBar />
      <BackHeader title="Safety Information" onBack={() => onNavigate("home")} />
      <div className="flex-1 overflow-y-auto px-6 pt-3 pb-8 space-y-3">
        {tips.map((t) => (
          <div key={t.title} className="border border-slate-100 rounded-xl p-4 shadow-sm flex gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#F1F0FB" }}>
              <ShieldCheck size={16} color="#5B4FCF" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-slate-800">{t.title}</p>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{t.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
