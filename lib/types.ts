// Shared TypeScript types for MyRimasa

export type Role = 'employee' | 'admin';
export type SessionType = 'morning' | 'evening' | 'special';
export type ReportStatus = 'submitted' | 'missed';
export type UserStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  status: UserStatus;
  location_id?: string | null;
  location_name?: string | null;
  locations?: Location;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  session_type: SessionType | 'afternoon';
  report_date: string; // ISO date string YYYY-MM-DD
  timestamp: string;
  location_id: string | null;
  routine_activity: string | null;
  incident_activity: string | null;
  field_condition: string | null;
  follow_up: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  maps_url: string | null;
  gps_timestamp: string | null;
  status: ReportStatus;
  created_at: string;
  // Joined fields
  profiles?: Profile;
  locations?: Location;
  report_files?: ReportFile[];
}

export interface ReportFile {
  id: string;
  report_id: string;
  file_name: string;
  file_type: string;
  drive_file_id: string | null;
  drive_url: string | null;
  created_at: string;
}

export interface PresenceWindow {
  session: SessionType;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timeLabel: string;
}

export type PresenceCardStatus =
  | 'locked'      // belum dibuka
  | 'open'        // window aktif, belum presensi
  | 'done'        // sudah presensi
  | 'closed';     // window sudah tutup, tidak presensi

export interface GpsData {
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
  mapsUrl: string;
}

export interface SubmitReportPayload {
  session_type: SessionType;
  location_id: string;
  routine_activity: string;
  incident_activity: string;
  field_condition: string;
  follow_up: string;
  latitude: number;
  longitude: number;
  address?: string;
  gps_timestamp: string;
  files: File[];
}
