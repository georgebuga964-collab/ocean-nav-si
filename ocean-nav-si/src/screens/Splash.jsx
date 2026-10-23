import React, { useEffect } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, OceanNavLogo } from "../components.jsx";
import { NAVY, NAVY_DEEP, OCEAN } from "../theme.js";

export default function SplashScreen({ onNavigate }) {
  const { user, checkingSession } = useApp();

  useEffect(() => {
    if (checkingSession) return;
    const target = user ? "home" : "login";
    const t = setTimeout(() => onNavigate(target), 600);
    return () => clearTimeout(t);
  }, [checkingSession, user, onNavigate]);

  return (
    <div
      className="relative h-full flex flex-col"
      style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 58%, #0D47A1 100%)` }}
    >
      <StatusBar dark />
      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
        <OceanNavLogo size={118} dark />
        <h1 className="text-white text-2xl font-bold tracking-wide leading-snug mt-4">
          OCEAN NAV SI
        </h1>
        <p className="text-white/70 text-[13px] mt-4 leading-relaxed">
          Protecting Every Voyage.
          <br />
          Saving Every Life.
        </p>
      </div>
      <div
        className="mx-auto mb-24 w-9 h-9 rounded-full border-2 animate-spin"
        style={{ borderColor: `${OCEAN}55`, borderTopColor: OCEAN }}
      />
      {!checkingSession && (
        <button
          onClick={() => onNavigate(user ? "home" : "login")}
          className="absolute inset-0"
          aria-label={user ? "Continue to home" : "Continue to login"}
        />
      )}
    </div>
  );
}
