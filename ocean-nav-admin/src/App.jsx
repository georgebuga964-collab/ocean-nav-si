import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
  import {
  ShieldCheck,
  Map,
  Ship,
  LifeBuoy,
  Users,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';

const NAVY = "#0A1E3D";
const OCEAN = "#02BFA5";
const DANGER = "#E14444";

// Values arrive as timestamptz (or as legacy text); never render "Invalid Date".
const formatDateTime = (value, options = {}) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

function AdminLogin({ error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    setMessage(signInError ? signInError.message : 'Signed in. Checking access…');
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">OceanNav Admin</h1>
        <p className="text-sm text-slate-500">Sign in with an administrator account.</p>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg border p-3" />
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border p-3" />
        {(error || message) && <p className="text-sm text-red-600">{error || message}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sosLogs, setSosLogs] = useState([]);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [access, setAccess] = useState('checking');
  const [accessError, setAccessError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const fetchData = useCallback(async () => {
    setFetchError('');
    setLoading(true);
    try {
      const [sosRes, tripsRes, usersRes] = await Promise.all([
        supabase.from('sos_logs').select('*, users(name, phone)').order('time', { ascending: false }),
        supabase.from('trips').select('*, users(name)').order('date', { ascending: false }),
        supabase.from('users').select('id, name, phone, email').order('name'),
      ]);

      const firstError = sosRes.error || tripsRes.error || usersRes.error;
      if (firstError) {
        setFetchError(firstError.message || 'Could not load admin data.');
      }
      if (sosRes.data) setSosLogs(sosRes.data);
      if (tripsRes.data) setTrips(tripsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (err) {
      setFetchError(err?.message || 'Could not reach Supabase. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setAccess('signed-out');
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!role) {
        setAccessError('This account is not an administrator.');
        return setAccess('denied');
      }
      setAccess('granted');
    };
    checkAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAccess());
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (access !== 'granted') return;
    const initialLoad = setTimeout(fetchData, 0);

    // Subscribe to new SOS logs (INSERT + UPDATE)
    const sosSubscription = supabase.channel('admin:sos_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_logs' }, async payload => {
        const { data } = await supabase.from('sos_logs').select('*, users(name, phone)').eq('id', payload.new.id).single();
        if (data) setSosLogs(prev => [data, ...prev]);
        // In-app banner is always surfaced; a browser notification is added
        // only when permission has already been granted.
        setActionError('New SOS alert received — open the SOS Alerts tab.');
        setTimeout(() => setActionError(''), 3500);
        if (window.Notification?.permission === 'granted') {
          new Notification('OceanNav SOS Alert', { body: 'A new SOS has been triggered. Check the dashboard immediately.' });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sos_logs' }, payload => {
        setSosLogs(prev => prev.map(log =>
          log.id === payload.new.id ? { ...log, ...payload.new } : log
        ));
      })
      .subscribe();

    // Subscribe to trip changes (INSERT + UPDATE)
    const tripsSubscription = supabase.channel('admin:trips')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, async payload => {
        // Re-fetch with joined user info so the table row is complete
        const { data } = await supabase
          .from('trips')
          .select('*, users(name)')
          .eq('id', payload.new.id)
          .single();
        if (data) setTrips(prev => [data, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, payload => {
        setTrips(prev => prev.map(t =>
          t.id === payload.new.id ? { ...t, ...payload.new } : t
        ));
      })
      .subscribe();

    // Request browser notification permission
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      clearTimeout(initialLoad);
      supabase.removeChannel(sosSubscription);
      supabase.removeChannel(tripsSubscription);
    };
  }, [access, fetchData]);

  if (access === 'checking') return <div className="min-h-screen grid place-items-center text-slate-600">Checking administrator access…</div>;
  if (access !== 'granted') return <AdminLogin error={accessError} />;

  const signOut = async () => {
    await supabase.auth.signOut();
    setAccess('signed-out');
    setAccessError('');
  };

  const updateSosStatus = async (id, newStatus) => {
    setActionError('');
    const target = sosLogs.find(l => l.id === id);
    const { error } = await supabase.from('sos_logs')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) {
      setSosLogs(prev => prev.map(log => log.id === id ? { ...log, status: newStatus } : log));
      if ((newStatus === 'in progress' || newStatus === 'resolved') && target?.user_id) {
        const isResolved = newStatus === 'resolved';

        // Directly sync the corresponding trip status in Supabase so the live tracking
        // map and DB remain consistent even if the user's vessel/device is offline
        if (isResolved) {
          await supabase.from('trips')
            .update({ status: 'Emergency: Resolved', lat: null, lng: null })
            .eq('user_id', target.user_id)
            .in('status', ['Emergency', 'Emergency: Acknowledged', 'Active']);
          setTrips(prev => prev.map(t =>
            (t.user_id === target.user_id && ['Emergency', 'Emergency: Acknowledged', 'Active'].includes(t.status))
              ? { ...t, status: 'Emergency: Resolved', lat: null, lng: null }
              : t
          ));
        } else if (newStatus === 'in progress') {
          await supabase.from('trips')
            .update({ status: 'Emergency: Acknowledged' })
            .eq('user_id', target.user_id)
            .eq('status', 'Emergency');
          setTrips(prev => prev.map(t =>
            (t.user_id === target.user_id && t.status === 'Emergency')
              ? { ...t, status: 'Emergency: Acknowledged' }
              : t
          ));
        }

        const { error: notifErr } = await supabase.from('notifications').insert([{
          user_id: target.user_id,
          cat: 'Alerts',
          title: isResolved ? 'SOS resolved — you are safe' : 'SOS acknowledged — help is on the way',
          body: isResolved
            ? 'Rescue is complete. Your emergency has been resolved and tracking has stopped. Safe voyage.'
            : 'The OceanNav operations team received your SOS and is dispatching assistance. Stay safe and keep your radio handy.',
          unread: true,
        }]);
        if (notifErr) {
          setActionError((isResolved ? 'Resolved' : 'Acknowledged') + ', but the user notification failed: ' + notifErr.message);
          setTimeout(() => setActionError(''), 4000);
        } else {
          setActionError(isResolved ? 'SOS resolved — user has been notified.' : 'SOS acknowledged — user has been notified.');
          setTimeout(() => setActionError(''), 2500);
        }
      }
    } else {
      setActionError(error.message || 'Failed to update status.');
      setTimeout(() => setActionError(''), 3500);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ShieldCheck },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'trips', label: 'Trips', icon: Ship },
    { id: 'sos', label: 'SOS Alerts', icon: LifeBuoy },
    { id: 'users', label: 'Users', icon: Users },
  ];

  const activeSosCount = sosLogs.filter(l => l.status !== 'resolved').length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <div className="w-64 text-white flex flex-col" style={{ background: NAVY }}>
        <div className="p-6 flex items-center gap-3">
          <ShieldCheck size={28} color={OCEAN} />
          <div>
            <h1 className="font-bold text-lg leading-tight">OceanNav SI</h1>
            <p className="text-xs text-white/60">Admin Command Center</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon size={20} color={activeTab === tab.id ? OCEAN : 'currentColor'} />
              <span className="font-medium">{tab.label}</span>
              {tab.id === 'sos' && activeSosCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeSosCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
              <span className="text-sm font-semibold text-slate-600">AD</span>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          {fetchError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load data: {fetchError}
            </div>
          )}
          {loading && !fetchError && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Loading admin data…
            </div>
          )}
          {actionError && (
            <div role="status" className="mb-4 rounded-xl border bg-white px-4 py-3 text-sm text-slate-700" style={{ borderColor: OCEAN }}>
              {actionError}
            </div>
          )}
          {activeTab === 'dashboard' && (
            <DashboardView sosLogs={sosLogs} trips={trips} users={users} onUpdateSos={updateSosStatus} />
          )}
          {activeTab === 'map' && (
            <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <LiveMapView sosLogs={sosLogs} trips={trips} />
            </div>
          )}
          {activeTab === 'trips' && (
            <TripsView trips={trips} />
          )}
          {activeTab === 'sos' && (
            <SOSView sosLogs={sosLogs} onUpdateSos={updateSosStatus} />
          )}
          {activeTab === 'users' && (
            <UsersView users={users} />
          )}
        </main>
      </div>
    </div>
  );
}

// ---------------- VIEWS ---------------- //

function DashboardView({ sosLogs, trips, users, onUpdateSos }) {
  const activeTrips = trips.filter(t => t.status === 'Active').length;
  const activeSosLogs = sosLogs.filter(l => l.status !== 'resolved');
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active SOS Alerts" value={activeSosLogs.length} icon={LifeBuoy} color={DANGER} />
        <StatCard title="Active Trips" value={activeTrips} icon={Ship} color={OCEAN} />
        <StatCard title="Total Registered Users" value={users.length} icon={Users} color="#3B82F6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">Recent SOS Alerts</h3>
          <div className="space-y-3">
            {activeSosLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} color={DANGER} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">Emergency Alert: {log.users?.name || 'Unknown User'}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(log.time)}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`text-center text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${log.status === 'sent' ? 'bg-red-500' : 'bg-orange-500'}`}>
                    {log.status === 'sent' ? 'Action Required' : log.status}
                  </span>
                  {log.status === 'sent' && (
                     <button onClick={() => onUpdateSos(log.id, 'in progress')} className="text-[10px] font-bold px-2.5 py-1 rounded border border-orange-500 text-orange-600 hover:bg-orange-50">
                       Acknowledge
                     </button>
                  )}
                  {log.status === 'in progress' && (
                     <button onClick={() => onUpdateSos(log.id, 'resolved')} className="text-[10px] font-bold px-2.5 py-1 rounded bg-green-500 text-white hover:bg-green-600">
                       Resolve
                     </button>
                  )}
                </div>
              </div>
            ))}
            {activeSosLogs.length === 0 && <p className="text-sm text-slate-500">No active SOS alerts.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">Recent Trips</h3>
          <div className="space-y-3">
            {trips.slice(0, 5).map(trip => (
              <div key={trip.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Ship size={18} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{trip.route}</p>
                  <p className="text-xs text-slate-500 mt-0.5">By {trip.users?.name || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {trip.status}
                  </span>
                </div>
              </div>
            ))}
            {trips.length === 0 && <p className="text-sm text-slate-500">No trips recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-5">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function LiveMapView({ sosLogs, trips }) {
  const center = [-9.0, 159.0];
  // Live tracking continues through Emergency until the admin resolves it.
  const liveTrips = trips.filter(t => ['Active', 'Emergency', 'Emergency: Acknowledged'].includes(t.status) && t.lat != null && t.lng != null);


  return (
    <MapContainer center={center} zoom={7} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* NDMO Command Centre */}
      <Marker position={[-9.4295, 159.9497]}>
        <Popup><strong>Honiara</strong><br/>NDMO Command Center</Popup>
      </Marker>

      {liveTrips.map(trip => (
        <CircleMarker
          key={trip.id}
          center={[trip.lat, trip.lng]}
          radius={10}
          pathOptions={{ color: '#02BFA5', fillColor: '#02BFA5', fillOpacity: 0.7, weight: 2 }}
        >
          <Popup>
            <strong style={{ color: '#0A1E3D' }}>{trip.route}</strong><br />
            <span style={{ color: trip.status === 'Active' ? '#02BFA5' : trip.status === 'Emergency: Acknowledged' ? '#B45309' : '#C0392B', fontWeight: 600 }}>
              {trip.status === 'Active' ? '\u25CF ACTIVE TRIP' : trip.status === 'Emergency: Acknowledged' ? '\u25CF EMERGENCY \u2014 STANDBY FOR RESCUE' : '\u25CF EMERGENCY \u2014 SOS'}
            </span><br />
            Sailor: {trip.users?.name || 'Unknown'}<br />
            Boat: {trip.boat}<br />
            Passengers: {trip.pax}<br />
            <span style={{ fontSize: 11, color: '#888' }}>
              {Number(trip.lat).toFixed(5)}, {Number(trip.lng).toFixed(5)}
            </span>
          </Popup>
        </CircleMarker>
      ))}

      {/* SOS locations */}
      {sosLogs.filter(l => l.status !== 'resolved' && l.lat && l.lng).map(log => (
        <CircleMarker
          key={log.id}
          center={[log.lat, log.lng]}
          radius={12}
          pathOptions={{ color: '#E14444', fillColor: '#E14444', fillOpacity: 0.85, weight: 3 }}
        >
          <Popup>
            <strong style={{ color: '#E14444' }}>🚨 SOS ALERT</strong><br />
            {log.users?.name || 'Unknown User'}<br />
            Phone: {log.users?.phone || 'N/A'}<br />
            Time: {formatDateTime(log.time)}<br />
            <a
              href={`https://maps.google.com/?q=${log.lat},${log.lng}`}
              target="_blank" rel="noreferrer"
              style={{ color: '#2563eb', fontSize: 11 }}
            >
              Open in Google Maps ↗
            </a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

function TripsView({ trips }) {
  const statusStyle = {
    Active:    { badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',    label: 'In Progress' },
    Scheduled: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500',  label: 'Scheduled' },
    Completed: { badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500',   label: 'Completed' },
    Cancelled: { badge: 'bg-red-100 text-red-700',      dot: 'bg-red-400',     label: 'Cancelled' },
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sailor</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Boat</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pax</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">GPS Location</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Indicator</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {trips.map(trip => {
            const s = statusStyle[trip.status] || { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', label: trip.status };
            return (
              <tr key={trip.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{trip.route}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{trip.users?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{trip.boat}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{trip.pax}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(trip.date)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.badge}`}>
                    {trip.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {trip.status === 'Active' && trip.lat && trip.lng ? (
                    <a
                      href={`https://maps.google.com/?q=${trip.lat},${trip.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      <Navigation size={12} />
                      {Number(trip.lat).toFixed(4)}, {Number(trip.lng).toFixed(4)}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      {trip.status === 'Active' ? 'Acquiring\u2026' : '\u2014'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot} ${trip.status === 'Active' ? 'animate-pulse' : ''}`} />
                    <span className="text-xs text-slate-500 font-medium">{s.label}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {trips.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No trips found</div>}
    </div>
  );
}

function SOSView({ sosLogs, onUpdateSos }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">GPS Location</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sosLogs.map(log => {
            const isResolved = log.status === 'resolved';
            const isSent = log.status === 'sent';
            return (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{formatDateTime(log.time)}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{log.users?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{log.users?.phone || 'N/A'}</td>
                <td className="px-6 py-4">
                  {log.lat && log.lng ? (
                    <a
                      href={`https://maps.google.com/?q=${log.lat},${log.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      <Navigation size={12} />
                      {Number(log.lat).toFixed(4)}, {Number(log.lng).toFixed(4)}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No GPS data</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    isResolved ? 'bg-green-100 text-green-700' : isSent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {log.status === 'sent' ? 'Action Required' : log.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {!isResolved && (
                    <div className="flex gap-2">
                      {isSent && (
                        <button onClick={() => onUpdateSos(log.id, 'in progress')} className="text-[11px] font-bold px-3 py-1.5 rounded bg-orange-100 text-orange-700 hover:bg-orange-200">
                          Acknowledge
                        </button>
                      )}
                      <button onClick={() => onUpdateSos(log.id, 'resolved')} className="text-[11px] font-bold px-3 py-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200">
                        Resolve
                      </button>
                    </div>
                  )}
                  {isResolved && (
                    <span className="text-xs text-slate-400 italic">Resolved</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sosLogs.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No SOS alerts found</div>}
    </div>
  );
}

function UsersView({ users }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-slate-50/50">
              <td className="px-6 py-4 text-sm font-medium text-slate-800">{u.name}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{u.phone}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No users found</div>}
    </div>
  );
}