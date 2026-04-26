const pad = (n) => String(n).padStart(2, "0");

const formatIcsDate = (date) => {
  const d = new Date(date);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
};

const escapeIcs = (s = "") =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

export const buildIcs = ({ title, description, location, start, end, uid }) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//eTourism//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid || `${Date.now()}@etourism`}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${escapeIcs(description)}`);
  if (location) lines.push(`LOCATION:${escapeIcs(location)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
};

const downloadIcs = (event, filename) => {
  const ics = buildIcs(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const slugify = (s) =>
  String(s || "experience")
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "experience";

export const saveBookingToCalendar = (booking, experience) => {
  const startISO =
    experience?.date_time || booking?.date_time || booking?.experience_date_time;
  if (!startISO) {
    alert("This booking has no scheduled date yet.");
    return;
  }
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) {
    alert("This booking has an invalid date.");
    return;
  }
  const durationMinutes =
    Number(experience?.duration_minutes ?? booking?.duration_minutes) || 60;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const title = experience?.title || booking?.title || "eTourism experience";
  const meetingLink = experience?.meeting_link || booking?.meeting_link || "";
  const description = meetingLink
    ? `Join the live stream: ${meetingLink}`
    : "Live stream link will be available before the event.";
  const filename = `${slugify(title)}.ics`;
  downloadIcs(
    {
      title,
      description,
      location: meetingLink || undefined,
      start,
      end,
      uid: booking?.id ? `booking-${booking.id}@etourism` : undefined,
    },
    filename
  );
};
