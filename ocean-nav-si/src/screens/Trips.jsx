import React, { useState, useEffect } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, PrimaryButton, SecondaryButton, Modal, BottomNav } from "../components.jsx";
import { NAVY, OCEAN, DANGER, AQUA, OFF_WHITE } from "../theme.js";
import { Ship, Menu, Plus, MapPin, Locate, CheckCircle2, XCircle, PlayCircle, RefreshCw } from "lucide-react";
import { formatDateTime } from "../lib.js";

export default function TripsScreen({ onNavigate }) {
  const { trips, updateTripStatus, showToast, refreshTrips } = useApp();
  const [tab, setTab] = useState("All");
  const [confirmModal, setConfirmModal] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (refreshTrips) refreshTrips();
  }, [refreshTrips]);

  const activeTrip = trips.find((t) => t.status === "Active");
  const emergencyTrip = trips.find((t) => t.status === "Emergency" || t.status === "Emergency: Acknowledged");
  const isAcknowledged = emergencyTrip?.status === "Emergency: Acknowledged";
  const isEmergency = emergencyTrip?.status === "Emergency" || isAcknowledged;

  const statusColor = {
    "Emergency: Acknowledged": { bg: "#FEF9C3", text: "#713F12" },
    "Emergency: Resolved": { bg: "#FEE2E2", text: "#7F1D1D" },
    Emergency: { bg: "#FEE2E2", text: "#C0392B" },
    Completed: { bg: "#E7F8EE", text: "#1E9E5A" },
    Active: { bg: "#E9F1FE", text: "#2E6DEF" },
    Scheduled: { bg: "#FDF2DE", text: "#C4841D" },
    Cancelled: { bg: "#FEE2E2", text: "#B91C1C" },
  };

  const filtered = tab === "All" ? trips : trips.filter((t) => t.status === tab);

  const handleManualRefresh = async () => {
    if (!refreshTrips) return;
    setIsRefreshing(true);
    const result = await refreshTrips();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(result?.ok ? "Trips refreshed from Supabase" : (result?.error || "Could not refresh trips"), result?.ok ? "success" : "error");
    }, 400);
  };

  const handleAction = async (tripId, action) => {
    let newStatus;
    if (action === "start") newStatus = "Active";
    if (action === "end") newStatus = "Completed";
    if (action === "cancel") newStatus = "Cancelled";
    setConfirmModal(null);
    const result = await updateTripStatus(tripId, newStatus);
    if (result?.ok) {
      showToast(`Trip marked as ${newStatus} in Supabase`);
    }
  };

  const actionConfig = {
    start: { label: "Start Trip", icon: PlayCircle, bg: NAVY, text: "white" },
    end: { label: "End Trip (Reached Destination)", icon: CheckCircle2, bg: "#1E9E5A", text: "white" },
    cancel: { label: "Cancel Trip", icon: XCircle, bg: DANGER, text: "white" },
  };

  const actionsForStatus = (status) => {
    if (status === "Scheduled") return ["start", "cancel"];
    if (status === "Active") return ["end", "cancel"];
    if (status === "Emergency" || status === "Emergency: Acknowledged") return [];
    return [];
  };

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <div style={{ background: NAVY }} className="px-5 pt-1 pb-4 shrink-0 shadow-sm">
        <StatusBar dark />
        <div className="flex items-center justify-between mt-2">
          <button onClick={() => onNavigate("home")} aria-label="Go to Home" className="text-white">
            <Menu size={20} color="white" aria-hidden="true" />
          </button>
          <span className="text-white font-semibold text-[15px]">Trip Menu</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              aria-label="Refresh from Supabase"
              className="text-white/80 hover:text-white transition-opacity p-1"
            >
              <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={() => onNavigate("startTrip")} aria-label="Log a new trip" className="p-1">
              <Plus size={20} color="white" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
              <Ship size={15} style={{ color: OCEAN }} />
              <span>Active Trip</span>
            </h2>
            {(activeTrip || emergencyTrip) && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${emergencyTrip ? 'text-red-700 bg-red-50 border-red-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${emergencyTrip ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {emergencyTrip ? 'Emergency' : 'Live Underway'}
              </span>
            )}
          </div>

          {(emergencyTrip || activeTrip) ? (
            (() => {
              const trip = emergencyTrip || activeTrip;
              const isAck = emergencyTrip?.status === "Emergency: Acknowledged";
              const isEm = emergencyTrip?.status === "Emergency" || isAck;
              const isEmergencyMode = !!emergencyTrip;
              return (
                <div
                  className={`rounded-2xl p-4 shadow-lg relative overflow-hidden border ${isAck ? 'border-amber-300/70' : isEmergencyMode ? 'border-red-400/40' : 'border-teal-500/25'}`}
                  style={{
                    background: isAck
                      ? "#FEF9C3"
                      : isEmergencyMode ? "linear-gradient(135deg,#7A1414,#B42318)" : "linear-gradient(135deg,#0A1E3D,#0D2D59 55%,#082042)",
                    color: isAck ? "#713F12" : "#FFFFFF",
                  }}
                >
                  <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: isAck ? "#FDE68A" : "rgba(255,255,255,0.2)" }}>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase ${isAck ? "text-amber-800" : isEmergencyMode ? "text-red-100" : "text-white/80"}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${isAck ? "bg-amber-500" : isEmergencyMode ? "bg-red-300 animate-pulse" : "bg-emerald-300 animate-pulse"}`} />
                      {isAck ? "Standby for rescue — help is on the way" : isEmergencyMode ? "Emergency — SOS Sent" : "Active trip — Live"}
                    </span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isAck ? "bg-amber-100 text-amber-900 border border-amber-200" : isEmergencyMode ? "bg-white/20 text-white" : "bg-white/15 text-white/90"}`}
                    >
                      {isAck ? "Acknowledged" : "Active"}
                    </span>
                  </div>
                  <div className="py-3 space-y-2.5">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: isAck ? "#854D0E" : "rgba(255,255,255,0.7)" }}>Route</p>
                      <h3 className="text-[16px] font-bold tracking-tight mt-0.5" style={{ color: isAck ? "#422006" : "#FFFFFF" }}>{trip.route}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[12px] rounded-xl p-2.5 border" style={{ background: isAck ? "#FFFBEB" : "rgba(255,255,255,0.1)", borderColor: isAck ? "#FDE68A" : "rgba(255,255,255,0.15)" }}>
                      <div className="space-y-0.5">
                        <span className="text-[10.5px] block" style={{ color: isAck ? "#92400E" : "rgba(255,255,255,0.7)" }}>Vessel / Boat</span>
                        <span className="font-semibold truncate block" style={{ color: isAck ? "#422006" : "#FFFFFF" }}>{trip.boat}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10.5px] block" style={{ color: isAck ? "#92400E" : "rgba(255,255,255,0.7)" }}>Passengers</span>
                        <span className="font-semibold block" style={{ color: isAck ? "#422006" : "#FFFFFF" }}>{trip.pax} Person{trip.pax > 1 ? "s" : ""}</span>
                      </div>
                      <div className="col-span-2 space-y-0.5 pt-1 border-t" style={{ borderColor: isAck ? "#FDE68A" : "rgba(255,255,255,0.15)" }}>
                        <span className="text-[10.5px] block" style={{ color: isAck ? "#92400E" : "rgba(255,255,255,0.7)" }}>{isAck ? "Acknowledged — remain on station, rescue is coordinating" : isEmergencyMode ? "SOS sent — wait for help, live tracking continues" : formatDateTime(trip.date)}</span>
                        {(isEmergencyMode && !isAck) && <span className="text-[11.5px] font-medium block" style={{ color: "rgba(255,255,255,0.9)" }}>{formatDateTime(trip.date)}</span>}
                        {isAck && <span className="text-[11.5px] font-medium block" style={{ color: "#422006" }}>{formatDateTime(trip.date)}</span>}
                      </div>
                    </div>
                    {(isEmergencyMode || isAck) && <div className="pt-3 text-[11.5px] leading-snug" style={{ color: isAck ? "#713F12" : "rgba(255,255,255,0.8)" }}>{isAck ? "Help is on the way — stay with the vessel, keep your radio on. This trip will close when the SOS is resolved." : "The ops team has been alerted. Keep your radio handy on this screen."}</div>}
                  </div>
                  {isEmergencyMode ? (
                    <div className="pt-2 text-[11.5px] leading-snug" style={{ color: isAck ? "#713F12" : "rgba(255,255,255,0.8)" }}>SOS acknowledgement will appear under Notifications.</div>
                  ) : (
                    <div className="pt-2 flex gap-2.5">
                      <button
                        onClick={() => setConfirmModal({ tripId: trip.id, action: "end" })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[12.5px] font-bold shadow-md active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <CheckCircle2 size={16} />
                        <span>End Trip</span>
                      </button>
                      <button
                        onClick={() => setConfirmModal({ tripId: trip.id, action: "cancel" })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[12.5px] font-bold shadow-md active:scale-[0.98] transition-all bg-red-600/90 hover:bg-red-600 text-white border border-red-400/25"
                      >
                        <XCircle size={16} />
                        <span>Cancel Trip</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2" style={{ background: "#DDEEF6" }}>
                <Ship size={18} color={NAVY} />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">No Active Trip Underway</p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Start a trip to log route, vessel, passengers &amp; live GPS</p>
              <button
                onClick={() => onNavigate("startTrip")}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white shadow-sm active:scale-[0.97] transition-transform"
                style={{ background: NAVY }}
              >
                <Plus size={14} />
                <span>Start a Trip</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
              Trip History &amp; Logs
            </h3>
            <span className="text-[11.5px] text-slate-400 font-medium">
              {filtered.length} trip{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex gap-2 pb-2.5 overflow-x-auto no-scrollbar">
            {["All", "Active", "Scheduled", "Completed", "Cancelled"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  tab === t
                    ? "text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                style={{ background: tab === t ? NAVY : undefined }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3 mt-1">
            {filtered.length === 0 && (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[13px] text-slate-400">No {tab !== "All" ? tab.toLowerCase() : ""} trips found.</p>
              </div>
            )}

            {filtered.map((t) => {
              const sc = statusColor[t.status] || statusColor["Scheduled"];
              const actions = actionsForStatus(t.status);
              return (
                <div key={t.id} className="border border-slate-100 rounded-xl p-3.5 shadow-sm space-y-3 bg-white">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#DDEEF6" }}>
                      <Ship size={20} color={NAVY} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-semibold text-slate-800 truncate">{t.route}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: (statusColor[t.status] || statusColor["Active"]).bg, color: (statusColor[t.status] || statusColor["Active"]).text }}>
                          {t.status === "Emergency" ? "Active — Emergency" : t.status === "Emergency: Acknowledged" ? "Acknowledged — Standby" : t.status === "Emergency: Resolved" ? "Emergency — Resolved" : t.status}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-400 mt-1">{formatDateTime(t.date)}</p>
                      <p className="text-[11.5px] text-slate-500 mt-0.5">
                        Boat: {t.boat}&nbsp;•&nbsp;Pax: {t.pax}
                      </p>
                      {(t.status === "Active" || t.status === "Emergency" || t.status === "Emergency: Acknowledged") && (
                        <p className={`text-[10.5px] mt-0.5 flex items-center gap-1.5 ${t.status === "Emergency: Acknowledged" ? "text-amber-700" : ""}`} style={t.status === "Emergency: Acknowledged" ? undefined : { color: OCEAN }}>
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${t.status === "Emergency: Acknowledged" ? "bg-amber-500" : ""}`}
                            style={t.status === "Emergency: Acknowledged" ? undefined : { background: OCEAN }}
                          />
                          {t.lat && t.lng
                            ? `GPS ${Number(t.lat).toFixed(4)}, ${Number(t.lng).toFixed(4)}`
                            : t.status === "Emergency: Acknowledged"
                            ? "Standby — help is on the way"
                            : "GPS tracking active…"}
                        </p>
                      )}
                    </div>
                  </div>

                  {actions.length > 0 && (
                    <div className="flex gap-2 pt-1 border-t border-slate-50">
                      {actions.map((action) => {
                        const cfg = actionConfig[action];
                        return (
                          <button
                            key={action}
                            onClick={() => setConfirmModal({ tripId: t.id, action })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold active:scale-[0.97] transition-transform"
                            style={{ background: cfg.bg, color: cfg.text }}
                          >
                            <cfg.icon size={14} />
                            {action === "end" ? "End Trip" : action === "cancel" ? "Cancel Trip" : cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={
          confirmModal?.action === "end"
            ? "Reached Destination?"
            : confirmModal?.action === "cancel"
            ? "Cancel Trip?"
            : confirmModal
            ? `${actionConfig[confirmModal.action]?.label}?`
            : ""
        }
        tone={confirmModal?.action === "cancel" ? "danger" : "default"}
      >
        <p className="text-[13px] text-slate-600 mb-5 leading-relaxed">
          {confirmModal?.action === "start" && "Are you ready to begin this voyage? This will mark your trip as Active and activate live GPS tracking."}
          {confirmModal?.action === "end" && "Confirm you have safely reached your destination. This will save the trip as Completed in Supabase and stop live GPS tracking."}
          {confirmModal?.action === "cancel" && "Are you sure you want to cancel this voyage? This will mark the trip as Cancelled in Supabase and stop GPS tracking."}
        </p>
        <div className="space-y-2.5">
          <PrimaryButton
            onClick={() => handleAction(confirmModal.tripId, confirmModal.action)}
            danger={confirmModal?.action === "cancel"}
          >
            {confirmModal?.action === "end"
              ? "End Trip (Mark Completed)"
              : confirmModal?.action === "cancel"
              ? "Confirm Cancellation"
              : "Confirm"}
          </PrimaryButton>
          <SecondaryButton onClick={() => setConfirmModal(null)}>Go Back</SecondaryButton>
        </div>
      </Modal>

      <BottomNav active="trips" onNavigate={onNavigate} />
    </div>
  );
}
