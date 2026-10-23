import React from "react";
import { AppProvider } from "./AppProvider.jsx";
import AppShell from "./AppShell.jsx";

export default function OceanNavApp() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}