import { SessionType, PresenceWindow, PresenceCardStatus } from './types';

export const PRESENCE_WINDOWS: Record<SessionType, PresenceWindow> = {
  morning: {
    session: 'morning',
    label: 'Presensi Pagi',
    startHour: 6,
    startMinute: 0,
    endHour: 7,
    endMinute: 45,
    timeLabel: '06.00 - 07.45',
  },
  afternoon: {
    session: 'afternoon',
    label: 'Presensi Siang',
    startHour: 13,
    startMinute: 0,
    endHour: 14,
    endMinute: 0,
    timeLabel: '13.00 - 14.00',
  },
  evening: {
    session: 'evening',
    label: 'Presensi Sore',
    startHour: 16,
    startMinute: 0,
    endHour: 23,
    endMinute: 59,
    timeLabel: '16.00 - 23.59',
  },
};

/**
 * Get local time from UTC date based on timezone offset (in minutes) or default WIB (+7h = -420 min)
 * Note: JS getTimezoneOffset() returns -420 for UTC+7 (WIB), -480 for UTC+8 (WITA), -540 for UTC+9 (WIT)
 */
export function getLocalDate(utcDate: Date = new Date(), timezoneOffsetMinutes?: number): Date {
  if (typeof timezoneOffsetMinutes === 'number') {
    // Convert UTC time to user local time
    const utcMs = utcDate.getTime();
    // getTimezoneOffset() is negative for ahead of UTC (e.g. WIB is -420)
    const localMs = utcMs - (timezoneOffsetMinutes * 60 * 1000);
    return new Date(localMs);
  }

  // Default to WIB (UTC+7) if not specified
  const utcMs = utcDate.getTime();
  const wibOffset = 7 * 60 * 60 * 1000;
  return new Date(utcMs + wibOffset);
}

/**
 * Get today's local date string (YYYY-MM-DD)
 */
export function getTodayLocalDate(timezoneOffsetMinutes?: number): string {
  const local = getLocalDate(new Date(), timezoneOffsetMinutes);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayWib(): string {
  return getTodayLocalDate(-420);
}

/**
 * Determine presence card status for a given session based on user local time
 */
export function getPresenceStatus(
  session: SessionType,
  serverUtcDate: Date,
  todayReport: { id: string; timestamp: string } | null,
  timezoneOffsetMinutes?: number
): PresenceCardStatus {
  const local = getLocalDate(serverUtcDate, timezoneOffsetMinutes);
  const currentHour = local.getUTCHours();
  const currentMinute = local.getUTCMinutes();
  const currentMinutes = currentHour * 60 + currentMinute;

  const win = PRESENCE_WINDOWS[session];
  if (!win) return 'closed';

  const startMinutes = win.startHour * 60 + win.startMinute;
  const endMinutes = win.endHour * 60 + win.endMinute;

  if (todayReport) return 'done';
  if (currentMinutes < startMinutes) return 'locked';
  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return 'open';
  return 'closed';
}

/**
 * Validate if current time is within a session window in user local time
 */
export function isWithinWindow(
  session: SessionType,
  serverUtcDate: Date,
  timezoneOffsetMinutes?: number
): boolean {
  const local = getLocalDate(serverUtcDate, timezoneOffsetMinutes);
  const currentHour = local.getUTCHours();
  const currentMinute = local.getUTCMinutes();
  const currentMinutes = currentHour * 60 + currentMinute;

  const win = PRESENCE_WINDOWS[session];
  if (!win) return false;

  const startMinutes = win.startHour * 60 + win.startMinute;
  const endMinutes = win.endHour * 60 + win.endMinute;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function formatWibTime(isoString: string): string {
  const date = new Date(isoString);
  const wib = getLocalDate(date, -420);
  const h = String(wib.getUTCHours()).padStart(2, '0');
  const m = String(wib.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m} WIB`;
}

export function formatWibDate(isoString: string): string {
  const date = new Date(isoString);
  const wib = getLocalDate(date, -420);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayName = days[wib.getUTCDay()];
  const day = wib.getUTCDate();
  const month = months[wib.getUTCMonth()];
  const year = wib.getUTCFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}
