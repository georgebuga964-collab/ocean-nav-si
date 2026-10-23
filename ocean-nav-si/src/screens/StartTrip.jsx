import React, { useState } from "react";
import { useApp } from "../context.jsx";
import { StatusBar, BackHeader, Field, PrimaryButton } from "../components.jsx";
import { NAVY, OCEAN, DANGER } from "../theme.js";
import { Compass, MapPin, Ship, Users as UsersIcon, Calendar, Locate, AlertTriangle } from "lucide-react";

export default function StartTripScreen({ onNavigate }) {
  const { trips, addAndActivateTrip, showToast } = useApp();
  const [form, setForm] = useState({ from: "", to: "", boat: "", pax: "", date: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const activeTrip = trips?.find(t => ['Active', 'Emergency', 'Emergency: Acknowledged'].includes(t.status));

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (activeTrip) {
      showToast("Please complete or cancel your existing voyage before starting a new one.", "error");
      return;
    }

    const errs = {};
    if (!form.from.trim()) errs.from = "Starting point is required";
    if (!form.to.trim()) errs.to = "Destination is required";
    if (!form.boat.trim()) errs.boat = "Boat / vessel is required";
    if (!form.pax || Number(form.pax) < 1) errs.pax = "Enter number of passengers";
    if (!form.date) errs.date = "Choose a date and time";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const createdTrip = await addAndActivateTrip({
      route: `${form.from.trim()} \u2192 ${form.to.trim()}`,
      boat: form.boat.trim(),
      pax: Number(form.pax),
      date: new Date(form.date).toISOString(),
    });
    setLoading(false);
    if (!createdTrip) return;
    showToast("Trip saved and tracking started");
    onNavigate("trips");
  };

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      <StatusBar />
      <BackHeader title="Start a Trip" onBack={() => onNavigate("home")} />
      <div className="px-6 mt-4 space-y-3.5 flex-1 overflow-y-auto pb-6">
        {activeTrip && (
          <div className="rounded-xl p-3.5 border border-amber-200 bg-amber-50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-800 text-[12.5px] font-bold">
              <Ship size={16} />
              <span>Voyage In Progress: {activeTrip.route}</span>
            </div>
            <p className="text-[11.5px] text-amber-700 leading-snug">
              You already have a voyage underway. Complete or cancel it before starting a new voyage.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("trips")}
              className="mt-1 text-center py-2 px-3 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
            >
              View Active Voyage
            </button>
          </div>
        )}

        <Field icon={Compass} placeholder="From (e.g. Munda)" value={form.from} onChange={update("from")} error={errors.from} />
        <Field icon={MapPin} placeholder="To (e.g. Gizo)" value={form.to} onChange={update("to")} error={errors.to} />
        <Field icon={Ship} placeholder="Boat / Vessel (e.g. Yamaha 40HP)" value={form.boat} onChange={update("boat")} error={errors.boat} />
        <Field icon={UsersIcon} placeholder="Number of Passengers" type="number" value={form.pax} onChange={update("pax")} error={errors.pax} inputMode="numeric" />
        <div>
          <label htmlFor="trip-date" className="sr-only">Departure date and time</label>
          <div className={`flex items-center gap-3 bg-slate-50 border rounded-xl px-4 py-3.5 ${errors.date ? "border-red-400" : "border-slate-200"}`}>
            <Calendar size={18} className="text-slate-400 shrink-0" aria-hidden="true" />
            <input
              id="trip-date"
              type="datetime-local"
              className="flex-1 bg-transparent outline-none text-[15px] text-slate-800"
              value={form.date}
              onChange={update("date")}
            />
          </div>
          {errors.date && <p className="text-[11.5px] mt-1 ml-1" style={{ color: DANGER }}>{errors.date}</p>}
        </div>

        {/* GPS tracking notice */}
        <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3" style={{ background: `${OCEAN}14` }}>
          <Locate size={15} className="shrink-0 mt-0.5" style={{ color: OCEAN }} />
          <p className="text-[11.5px] leading-snug" style={{ color: NAVY }}>
            Starting this trip activates <span style={{ color: OCEAN, fontWeight: 700 }}>live GPS tracking</span>. Your position will update continuously on the map and be visible to safety monitors.
          </p>
        </div>
      </div>
      <div className="px-6 pb-6">
        <PrimaryButton onClick={submit} loading={loading} disabled={!!activeTrip}>
          Start Trip &amp; Track Location
        </PrimaryButton>
      </div>
    </div>
  );
}
