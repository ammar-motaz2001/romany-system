/**
 * Format 24h time string to 12h with AM/PM (e.g. "13:00" → "1:00 PM", "09:30" → "9:30 AM").
 * Returns '-' if empty or invalid.
 */
export function formatTimeTo12h(timeStr: string | undefined): string {
  if (!timeStr || typeof timeStr !== 'string') return '-';
  const trimmed = timeStr.trim();
  if (!trimmed) return '-';
  let timePart = trimmed;
  if (trimmed.includes('T')) {
    timePart = trimmed.split('T')[1]?.split('.')[0] ?? trimmed;
  }
  const parts = timePart.split(':').map(p => parseInt(p, 10));
  if (parts.length < 2 || parts.some(n => Number.isNaN(n))) return trimmed;
  const [hours, minutes] = parts;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return trimmed;
  const period = hours < 12 ? 'AM' : 'PM';
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const mm = minutes < 10 ? `0${minutes}` : String(minutes);
  return `${h12}:${mm} ${period}`;
}

/**
 * Parse a time string (HH:mm, HH:mm:ss, or ISO with T) to minutes since midnight.
 * Returns null if invalid or empty.
 */
export function timeStringToMinutes(s: string | undefined): number | null {
  if (!s || typeof s !== 'string') return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  let timePart = trimmed;
  if (trimmed.includes('T')) {
    timePart = trimmed.split('T')[1]?.split('.')[0] ?? trimmed;
  }
  const parts = timePart.split(':').map(p => parseInt(p, 10));
  if (parts.length < 2 || parts.some(n => Number.isNaN(n))) return null;
  const [hours, minutes] = parts;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export interface RecordForLateMinutes {
  checkIn?: string;
  lateMinutes?: number | string;
  status?: string;
}

/**
 * Get late minutes for an attendance record.
 * 1. If record has lateMinutes > 0, use it.
 * 2. Else if status is تأخير/متأخر and we have checkIn + workStartTime, compute from times.
 * 3. Else return 0.
 * workStartTime from إعدادات النظام (e.g. "09:00").
 */
export function getLateMinutesForRecord(
  record: RecordForLateMinutes,
  workStartTime: string | undefined
): number {
  const existing = record.lateMinutes != null && Number(record.lateMinutes) > 0
    ? (typeof record.lateMinutes === 'number' ? record.lateMinutes : parseInt(String(record.lateMinutes), 10) || 0)
    : 0;
  if (existing > 0) return existing;

  const isLateStatus = record.status === 'تأخير' || record.status === 'متأخر';
  if (!isLateStatus || !record.checkIn?.trim() || !workStartTime?.trim()) return 0;

  const checkInMins = timeStringToMinutes(record.checkIn);
  const startMins = timeStringToMinutes(workStartTime);
  if (checkInMins == null || startMins == null) return 0;

  return Math.max(0, checkInMins - startMins);
}

/**
 * Compute work hours (decimal) as the difference between checkOut and checkIn.
 * Returns null if either time is missing or invalid, or if checkOut is before checkIn.
 */
export function computeWorkHoursFromTimes(
  checkIn: string | undefined,
  checkOut: string | undefined
): number | null {
  if (!checkIn?.trim() || !checkOut?.trim()) return null;
  const inMins = timeStringToMinutes(checkIn);
  const outMins = timeStringToMinutes(checkOut);
  if (inMins == null || outMins == null) return null;
  const diffMins = outMins - inMins;
  if (diffMins < 0) return null;
  return diffMins / 60;
}

/**
 * Format decimal hours for display (e.g. 8.5 → "8:30").
 */
export function formatWorkHoursFromDecimal(dec: number): string {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export interface RecordWithWorkTimes {
  checkIn?: string;
  checkOut?: string;
  workHours?: string | number;
}

/**
 * Get work hours for display: difference between الانصراف and الحضور when both exist,
 * otherwise the stored workHours value. Returns null if nothing available.
 */
export function getDisplayWorkHours(record: RecordWithWorkTimes): number | null {
  const computed = computeWorkHoursFromTimes(record.checkIn, record.checkOut);
  if (computed != null) return computed;
  if (record.workHours == null || record.workHours === '') return null;
  const n = typeof record.workHours === 'number' ? record.workHours : parseFloat(String(record.workHours));
  return Number.isNaN(n) ? null : n;
}
