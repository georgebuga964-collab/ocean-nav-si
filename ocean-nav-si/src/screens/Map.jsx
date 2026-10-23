import React, { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, BottomNav } from "../components.jsx";
import { NAVY, OCEAN, AQUA } from "../theme.js";
import { Menu, Layers, Locate, Search, Plus, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { FlyTo } from "./MapFlyTo.jsx";

export default function MapScreen({ onNavigate }) {
  const { trips, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const firstFixRef = useRef(false);

  const liveTrip = trips.find((t) => t.status === "Active" || t.status === "Emergency" || t.status === "Emergency: Acknowledged");
  const activeTrip = liveTrip;
  const isAck = liveTrip?.status === "Emergency: Acknowledged";

  const userLocation = useMemo(() => {
    return liveTrip?.lat && liveTrip?.lng
      ? [Number(liveTrip.lat), Number(liveTrip.lng)]
      : null;
  }, [liveTrip]);

  // Center map on the active trip's location when available
  useEffect(() => {
    if (userLocation && !firstFixRef.current) {
      firstFixRef.current = true;
      setFlyTarget({ center: userLocation, zoom: 13 });
    }
  }, [userLocation]);

  const locations = [
    { name: "Gizo", coords: [-8.1030, 156.8402] },
    { name: "Munda", coords: [-8.3285, 157.2662] },
    { name: "Noro", coords: [-8.2269, 157.2023] },
    { name: "Seghe", coords: [-8.5772, 157.8767] },
    { name: "Honiara", coords: [-9.4295, 159.9497] },
    { name: "Auki", coords: [-8.7667, 160.7000] },
  ];

  const filtered = query.trim()
    ? locations.filter((l) => l.name.toLowerCase().includes(query.trim().toLowerCase()))
    : locations;

  const handleSearch = (val) => {
    setQuery(val);
    if (!val.trim()) return;
    const matches = locations.filter((l) => l.name.toLowerCase().includes(val.trim().toLowerCase()));
    if (matches.length === 1) setFlyTarget({ center: matches[0].coords, zoom: 12 });
  };

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div style={{ background: NAVY }} className="px-5 pt-1 pb-3 relative z-20">
        <StatusBar dark />
        <div className="flex items-center justify-between mt-2">
          <Menu size={20} color="white" aria-hidden="true" />
          <span className="text-white font-semibold text-[15px]">OceanNav Live Map</span>
          <Layers size={20} color="white" aria-hidden="true" />
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 bg-white relative z-20 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-slate-400" aria-hidden="true" />
          <label htmlFor="map-search" className="sr-only">Search location</label>
          <input
            id="map-search"
            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-slate-400"
            placeholder="Search location..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {liveTrip && (
        <div
          className="px-4 py-2 z-20 relative flex items-center gap-2.5"
          style={{
            background: isAck ? "#FEF9C3" : liveTrip.status === "Emergency" ? "#FEF2F2" : `${OCEAN}16`,
            borderBottom: `1.5px solid ${isAck ? "#FDE68A" : liveTrip.status === "Emergency" ? "#FECACA" : `${OCEAN}30`}`,
          }}
        >
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${isAck ? "bg-amber-500" : "animate-pulse"}`}
            style={{ background: isAck ? undefined : liveTrip.status === "Emergency" ? "#DC2626" : OCEAN }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-bold truncate" style={{ color: isAck ? "#713F12" : liveTrip.status === "Emergency" ? "#7F1D1D" : NAVY }}>
              {isAck ? `Standby for rescue — ${liveTrip.route}` : liveTrip.status === "Emergency" ? `Emergency: ${liveTrip.route}` : `Active Trip: ${liveTrip.route}`}
            </p>
            <p className="text-[10.5px] text-slate-500">
              {isAck ? "Help is on the way" : liveTrip.lat && liveTrip.lng
                ? `GPS: ${Number(liveTrip.lat).toFixed(4)}, ${Number(liveTrip.lng).toFixed(4)}`
                : "Acquiring GPS…"}
            </p>
          </div>
          <button
            onClick={() => {
              if (liveTrip.lat && liveTrip.lng)
                setFlyTarget({ center: [liveTrip.lat, liveTrip.lng], zoom: 14 });
            }}
            className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg shrink-0"
            style={{ background: isAck ? "#D97706" : liveTrip.status === "Emergency" ? "#DC2626" : OCEAN, color: "white" }}
          >
            Go to
          </button>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={[-9.0, 159.0]}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <FlyTo target={flyTarget} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Static checkpoint markers */}
          {filtered.map((loc) => (
            <Marker
              key={loc.name}
              position={loc.coords}
              eventHandlers={{ click: () => setSelected(loc) }}
            >
              <Popup>
                <strong>{loc.name}</strong><br />
                Safety checkpoint active.
              </Popup>
            </Marker>
          ))}

          {/* Consolidated Live Vessel / Device GPS Marker */}
          {userLocation && (
            <CircleMarker
              center={userLocation}
              radius={12}
              pathOptions={{
                color: isAck ? "#D97706" : liveTrip?.status === "Emergency" ? "#DC2626" : OCEAN,
                fillColor: isAck ? "#F59E0B" : liveTrip?.status === "Emergency" ? "#DC2626" : OCEAN,
                fillOpacity: 0.75,
                weight: 3,
              }}
            >
              <Popup>
                <strong style={{ color: NAVY }}>{liveTrip?.route || "Your Voyage"}</strong><br />
                <span style={{ color: isAck ? "#92400E" : liveTrip?.status === "Emergency" ? "#DC2626" : OCEAN, fontWeight: 700 }}>
                  {isAck ? "● STANDBY — HELP IS ON THE WAY" : liveTrip?.status === "Emergency" ? "● EMERGENCY — SOS" : "● ACTIVE VOYAGE (LIVE)"}
                </span><br />
                {liveTrip?.boat && <>Boat: {liveTrip.boat}<br /></>}
                {liveTrip?.pax && <>Passengers: {liveTrip.pax}<br /></>}
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  GPS: {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                </span>
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>

        {/* Locate me */}
        <button
          className="absolute bottom-5 right-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center z-[1000] active:scale-95 transition-transform"
          aria-label="Center on active voyage location"
          onClick={() => {
            if (userLocation) {
              setFlyTarget({ center: userLocation, zoom: 14 });
            } else {
              showToast("Live tracking is inactive. Start a trip to track your location.", "info");
            }
          }}
        >
          <Locate size={18} style={{ color: userLocation ? OCEAN : "#94A3B8" }} />
        </button>

        {/* New trip */}
        <button
          onClick={() => onNavigate("startTrip")}
          className="absolute bottom-5 right-16 w-10 h-10 rounded-full flex items-center justify-center shadow-md z-[1000] active:scale-95 transition-transform"
          style={{ background: OCEAN }}
          aria-label="Start a new trip"
        >
          <Plus size={20} color="white" />
        </button>

        {/* Info card */}
        <div className="absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-lg p-3.5 flex items-center gap-3 z-[1000] border border-slate-100">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: userLocation ? "#E6F8F5" : "#F1F5F9" }}
          >
            {userLocation ? (
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full animate-ping absolute" style={{ background: AQUA }} />
                <span className="w-3.5 h-3.5 rounded-full relative" style={{ background: OCEAN }} />
              </div>
            ) : (
              <MapPin size={20} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">
              {selected
                ? selected.name
                : userLocation
                  ? `Live Tracking: ${activeTrip.route}`
                  : "Live Tracking Inactive"}
            </p>
            <p className="text-[11.5px] text-slate-400 mt-0.5 leading-snug">
              {selected
                ? "Safety checkpoint active."
                : userLocation
                  ? `Boat: ${activeTrip.boat} • GPS: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`
                  : "Live GPS only activates when a trip is started and stops upon arrival or cancellation."}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-20">
        <BottomNav active="map" onNavigate={onNavigate} />
      </div>
    </div>
  );
}
