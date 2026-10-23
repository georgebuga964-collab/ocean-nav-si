/* ------------------------------ Validation ----------------------------- */

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isValidPhone = (v) => /^[+\d][\d\s-]{5,}$/.test(v.trim());
export const isValidPassword = (v) => v.length >= 6;

/* ------------------------------ Formatting ------------------------------ */

const DATE_TIME_OPTIONS = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

// Values are stored as timestamptz; anything unparseable (legacy rows) is
// rendered verbatim instead of "Invalid Date".
export const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-GB", DATE_TIME_OPTIONS);
};

export const formatDateTimeLong = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
