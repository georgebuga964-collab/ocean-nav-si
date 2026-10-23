import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import AppContext from "./context.jsx";

const GPS_WRITE_MIN_INTERVAL_MS = 10000;
const GPS_WRITE_MIN_DISTANCE_M = 15;

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [trips, setTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadUserData = useCallback(async (userId) => {
    setDataError(null);
    const tripQuery = userId
      ? supabase.from('trips').select('*').eq('user_id', userId).order('date', { ascending: false })
      : Promise.resolve({ data: [] });

    const notifQuery = userId
      ? supabase.from('notifications').select('*').eq('user_id', userId).order('time', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] });

    let tripsRes;
    let notifsRes;
    try {
      [tripsRes, notifsRes] = await Promise.all([tripQuery, notifQuery]);
    } catch (err) {
      setDataError(err?.message || "Could not reach Supabase. Check your connection.");
      return { ok: false };
    }

    if (tripsRes.error) {
      setDataError(tripsRes.error.message);
      return { ok: false };
    }
    if (notifsRes.error) {
      setDataError(notifsRes.error.message);
      return { ok: false };
    }

    if (tripsRes.data) {
      setTrips(tripsRes.data);
    }

    if (notifsRes.data) {
      setNotifications(notifsRes.data);
    }
    return { ok: true };
  }, []);

  const refreshTrips = useCallback(async () => {
    if (!user?.id) return { ok: false, error: "Not signed in" };
    setLoadingData(true);
    const { data, error } = await supabase.from('trips').select('*').eq('user_id', user.id).order('date', { ascending: false });
    setLoadingData(false);
    if (error || !data) {
      const message = error?.message || "Could not refresh trips";
      setDataError(message);
      return { ok: false, error: message };
    }
    setDataError(null);
    setTrips(data);
    return { ok: true };
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('users')
          .select('id, name, phone, email')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser(profile);
          await loadUserData(profile.id);
        }
      }
      setCheckingSession(false);
    })();
  }, [loadUserData]);

  const signup = async ({ name, phone, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim(), phone: phone.trim() } },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.session) return { ok: true, user: { name: name.trim() }, needsEmailConfirmation: true };
    const { data: profile, error: profileError } = await supabase.from('users')
      .select('id, name, phone, email').eq('id', data.user.id).single();
    if (profileError || !profile) return { ok: false, error: "Account created, but the profile could not be loaded." };
    setUser(profile);
    await loadUserData(profile.id);
    return { ok: true, user: profile };
  };

  const login = async (identifier, password) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    if (authError || !authData.user) return { ok: false, error: authError?.message || "Invalid credentials" };
    const { data: found } = await supabase.from('users')
      .select('id, name, phone, email')
      .eq('id', authData.user.id)
      .single();

    if (!found) return { ok: false, error: "Signed in, but your profile could not be loaded. Try again or contact support." };

    setUser(found);
    await loadUserData(found.id);
    return { ok: true, user: found };
  };

  const logout = async () => {
    stopLocationTracking();
    await supabase.auth.signOut();
    setUser(null);
    setTrips([]);
    setNotifications([]);
    setDataError(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return { ok: false, error: "Not signed in" };

    const name = updates.name.trim();
    const phone = updates.phone.trim();
    const email = updates.email.trim();
    const payload = { name, phone };
    let emailPendingConfirmation = false;

    if (email !== (user.email || "")) {
      const { data: authData, error: authError } = await supabase.auth.updateUser({ email });
      if (authError) return { ok: false, error: authError.message };
      emailPendingConfirmation = authData?.user?.email !== email;
      if (!emailPendingConfirmation) payload.email = email;
    }

    const { data: updatedUser, error } = await supabase.from('users')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    if (updatedUser) setUser(updatedUser);
    return { ok: true, emailPendingConfirmation };
  };

  const addTrip = async (trip) => {
    const tripPayload = {
      user_id: user?.id || null,
      route: trip.route,
      boat: trip.boat,
      pax: Number(trip.pax) || 1,
      date: trip.date,
      status: trip.status || 'Scheduled',
    };

    const { data: newTrip, error } = await supabase.from('trips').insert([tripPayload]).select().single();

    if (error || !newTrip) {
      showToast(error?.message || "Unable to save trip", "error");
      return null;
    }
    setTrips((prev) => [newTrip, ...prev]);
    return newTrip;
  };

  const locationWatcherRef = useRef(null);
  const lastTrackedWriteRef = useRef(0);
  const lastTrackedFixRef = useRef(null);

  const writeTrackedPosition = useCallback(async (tripId, latitude, longitude, { force = false } = {}) => {
    const now = Date.now();
    const lastWrite = lastTrackedWriteRef.current;
    const lastFix = lastTrackedFixRef.current;
    if (lastFix) {
      const movedMeters = Math.hypot(latitude - lastFix.lat, longitude - lastFix.lng) * 111320;
      if (!force && now - lastWrite < GPS_WRITE_MIN_INTERVAL_MS && movedMeters < GPS_WRITE_MIN_DISTANCE_M) {
        return;
      }
    } else if (!force && now - lastWrite < GPS_WRITE_MIN_INTERVAL_MS) {
      return;
    }
    lastTrackedWriteRef.current = now;
    lastTrackedFixRef.current = { lat: latitude, lng: longitude };
    const { error } = await supabase.from('trips')
      .update({ lat: latitude, lng: longitude })
      .eq('id', tripId);
    if (error) {
      console.warn('GPS position sync failed:', error);
    }
  }, []);

  const startLocationTracking = useCallback((tripId) => {
    if (!navigator.geolocation) return;
    if (locationWatcherRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatcherRef.current);
      locationWatcherRef.current = null;
    }
    lastTrackedWriteRef.current = 0;
    lastTrackedFixRef.current = null;
    locationWatcherRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setTrips((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, lat: latitude, lng: longitude } : t))
        );
        await writeTrackedPosition(tripId, latitude, longitude);
      },
      (err) => console.warn('Geolocation watch error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }, [writeTrackedPosition]);

  const stopLocationTracking = useCallback(() => {
    if (locationWatcherRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatcherRef.current);
      locationWatcherRef.current = null;
    }
  }, []);

  const isLiveTripStatus = useCallback((s) => s === 'Active' || s === 'Emergency' || s === 'Emergency: Acknowledged', []);
  useEffect(() => {
    const live = trips.find((t) => isLiveTripStatus(t.status));
    if (live) {
      if (locationWatcherRef.current === null) {
        startLocationTracking(live.id);
      }
    } else {
      if (locationWatcherRef.current !== null) {
        stopLocationTracking();
      }
    }
  }, [trips, startLocationTracking, stopLocationTracking, isLiveTripStatus]);

  const addAndActivateTrip = async (trip) => {
    const tripPayload = {
      user_id: user?.id || null,
      route: trip.route,
      boat: trip.boat,
      pax: Number(trip.pax) || 1,
      date: trip.date,
      status: 'Active',
      lat: trip.lat || null,
      lng: trip.lng || null,
    };

    const { data: newTrip, error } = await supabase.from('trips').insert([tripPayload]).select().single();

    if (error || !newTrip) {
      showToast(error?.message || "Unable to start trip", "error");
      return null;
    }
    const createdTrip = newTrip;

    setTrips((prev) => [createdTrip, ...prev]);

    startLocationTracking(createdTrip.id);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setTrips((prev) =>
            prev.map((t) => (t.id === createdTrip.id ? { ...t, lat, lng } : t))
          );
          await writeTrackedPosition(createdTrip.id, lat, lng, { force: true });
        },
        (err) => console.warn('Initial GPS fix failed:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return createdTrip;
  };

  const updateTripStatus = async (id, newStatus) => {
    const isTerminating = newStatus === 'Completed' || newStatus === 'Cancelled';
    const updatePayload = { status: newStatus };
    if (isTerminating) {
      updatePayload.lat = null;
      updatePayload.lng = null;
      stopLocationTracking();
    }

    const { data, error } = await supabase.from('trips')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const message = error.message || "Unable to update trip";
      showToast(message, "error");
      return { ok: false, error: message };
    } else if (data) {
      setTrips((prev) => prev.map((t) => (t.id === id ? data : t)));
    }

    if (newStatus === 'Active') {
      startLocationTracking(id);
    } else if (isTerminating) {
      stopLocationTracking();
    }
    return { ok: true };
  };

  const markNotificationRead = async (id) => {
    if (!user) return;
    const { data, error } = await supabase.from('notifications')
      .update({ unread: false })
      .eq('id', id)
      .select().single();

    if (error || !data) {
      showToast(error?.message || "Unable to update notification", "error");
      return;
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? data : n)));
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    const { error } = await supabase.from('notifications')
      .update({ unread: false })
      .eq('user_id', user.id);

    if (error) {
      showToast(error.message || "Unable to update notifications", "error");
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const sendSos = async () => {
    if (!user) return { ok: false, error: "Sign in before sending an SOS" };
    const active = trips.find(t => t.status === "Active");
    if (!active) {
      return { ok: false, error: "Start a trip first — SOS is only available while a trip is active." };
    }

    const getPosition = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      });

    const pos = await getPosition();
    const lat = pos?.coords?.latitude ?? null;
    const lng = pos?.coords?.longitude ?? null;

    const { error } = await supabase.from('sos_logs').insert([{
      user_id: user.id,
      status: 'sent',
      lat,
      lng,
    }]);
    if (error) return { ok: false, error: error.message };
    const { error: statusErr } = await supabase.from('trips')
      .update({ status: 'Emergency' })
      .eq('id', active.id)
      .eq('status', 'Active');
    if (statusErr) return { ok: false, error: statusErr.message };
    setTrips(prev => prev.map(t => t.id === active.id ? { ...t, status: 'Emergency', lat: lat ?? t.lat, lng: lng ?? t.lng } : t));
    if (lat != null && lng != null) await writeTrackedPosition(active.id, lat, lng, { force: true });
    return { ok: true };
  };

  const bumpEmergencyAcknowledged = useCallback(() => {
    setTrips((prev) => {
      const target = prev.find((t) => t.status === 'Emergency');
      if (!target) return prev;
      return prev.map((t) => (t.id === target.id ? { ...t, status: 'Emergency: Acknowledged' } : t));
    });
  }, []);

  const resolveEmergencyTrip = useCallback(async () => {
    const live = trips.find((t) => t.status === 'Emergency' || t.status === 'Emergency: Acknowledged');
    if (!live) return;
    stopLocationTracking();
    setTrips((prev) => prev.map((t) => (t.id === live.id ? { ...t, status: 'Emergency: Resolved', lat: null, lng: null } : t)));
    const { error } = await supabase.from('trips')
      .update({ status: 'Emergency: Resolved', lat: null, lng: null })
      .eq('id', live.id);
    if (error) showToast(error.message || 'Unable to resolve trip', 'error');
  }, [trips, stopLocationTracking, showToast]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`app:notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new;
        setNotifications((prev) => {
          if (prev.some(n => n.id === row.id)) return prev;
          return [row, ...prev];
        });
        const title = (row.title || '').toLowerCase();
        const body = (row.body || '').toLowerCase();
        const cat = (row.cat || '').toLowerCase();
        const isSosResolved = (title.includes('sos') && (title.includes('resolved') || body.includes('resolved'))) || (title.includes('rescue') || title.includes('trip resolved'));
        const isSosAck = (title.includes('sos') && (title.includes('acknowledged') || title.includes('received'))) || (cat === 'alerts' && title.includes('sos') && !isSosResolved);
        if (isSosResolved) {
          (async () => { await resolveEmergencyTrip(); })();
          showToast(row.title || 'Rescue complete — trip resolved.', 'success');
        } else if (isSosAck) {
          bumpEmergencyAcknowledged();
          showToast('SOS acknowledged — help is on the way. Keep your radio handy.', 'success');
        } else {
          showToast(row.title || 'New notification', 'info');
        }
      })
      .subscribe();
    const resolveCh = supabase
      .channel(`app:trips-resolve:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new;
        if (!row || (row.status !== 'Emergency: Resolved' && row.status !== 'Completed' && row.status !== 'Cancelled')) return;
        setTrips((prev) => prev.map((t) => (t.id === row.id ? row : t)));
        stopLocationTracking();
        showToast('Trip ended — live tracking stopped.', 'success');
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); supabase.removeChannel(resolveCh); };
  }, [user?.id, showToast, bumpEmergencyAcknowledged, resolveEmergencyTrip, stopLocationTracking]);

  const value = {
    user,
    checkingSession,
    trips,
    notifications,
    toast,
    showToast,
    signup,
    login,
    logout,
    updateProfile,
    addTrip,
    addAndActivateTrip,
    updateTripStatus,
    refreshTrips,
    markNotificationRead,
    markAllNotificationsRead,
    sendSos,
    dataError,
    loadingData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
