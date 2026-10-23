import React, { useState } from "react";
import { useApp } from "./context.jsx";
import { PhoneFrame, Toast } from "./components.jsx";
import { DANGER } from "./theme.js";
import SplashScreen from "./screens/Splash.jsx";
import LoginScreen from "./screens/AuthLogin.jsx";
import SignupScreen from "./screens/AuthSignup.jsx";
import ForgotPasswordScreen from "./screens/AuthForgot.jsx";
import HomeScreen from "./screens/Home.jsx";
import StartTripScreen from "./screens/StartTrip.jsx";
import SafetyScreen from "./screens/Safety.jsx";
import MapScreen from "./screens/Map.jsx";
import TripsScreen from "./screens/Trips.jsx";
import NotificationsScreen from "./screens/Notifications.jsx";
import EditProfileScreen from "./screens/ProfileEdit.jsx";
import ProfileScreen from "./screens/Profile.jsx";

export default function AppShell() {
  const [screen, setScreen] = useState("splash");
  const { toast, user, checkingSession, dataError } = useApp();

  const protectedScreens = ["home", "map", "trips", "notifications", "profile", "startTrip", "editProfile", "safety"];

  const navigate = (next) => {
    if (protectedScreens.includes(next) && !user && !checkingSession) {
      setScreen("login");
      return;
    }
    setScreen(next);
  };

  const screens = {
    splash: SplashScreen,
    login: LoginScreen,
    signup: SignupScreen,
    forgot: ForgotPasswordScreen,
    home: HomeScreen,
    startTrip: StartTripScreen,
    safety: SafetyScreen,
    map: MapScreen,
    trips: TripsScreen,
    notifications: NotificationsScreen,
    editProfile: EditProfileScreen,
    profile: ProfileScreen,
  };

  const Screen = screens[screen] || SplashScreen;

  return (
    <PhoneFrame>
      <Toast toast={toast} />
      {dataError && (
        <div
          role="alert"
          className="absolute top-0 left-0 right-0 z-40 px-4 py-2 text-[12px] font-medium text-white"
          style={{ background: DANGER }}
        >
          {dataError}
        </div>
      )}
      <Screen onNavigate={navigate} />
    </PhoneFrame>
  );
}
