export interface StaffAssignment {
  no: number;
  name: string;
  phone: string;
  locationName: string;
  email: string;
}

export const STAFF_ASSIGNMENTS: StaffAssignment[] = [
  { no: 1, name: 'Triyono', phone: '0895-3211-2001-0', locationName: 'KHDTK Playen', email: 'triyononew266@gmail.com' },
  { no: 2, name: 'Sigit Prasetyo', phone: '0895-6359-4897-7', locationName: 'KHDTK Wonogiri', email: 'sipras820@gmail.com' },
  { no: 3, name: 'Agus Rinoho', phone: '0821-3346-8800', locationName: 'KHDTK Kaliurang', email: 'aguslassoelang88@gmail.com' },
  { no: 4, name: 'Gunawan Widiyono', phone: '0857-5510-4552', locationName: 'KHDTK Sumberwringin', email: 'widigunawan804@gmail.com' },
  { no: 5, name: 'Angga Pradana', phone: '0896-0232-5688', locationName: 'KHDTK Padekanmalang', email: 'anitasiti970@gmail.com' },
  { no: 6, name: 'Yusup Gively Bayu Nurcahyo', phone: '0813-3806-5556', locationName: 'KHDTK Watusipat', email: 'gively.exe@gmail.com' },
  { no: 7, name: 'Ridho Dimas Wijaya', phone: '0821-8557-1752', locationName: 'KHDTK Suban Jeriji', email: 'ridhodimaswijaya@gmail.com' },
  { no: 8, name: 'Heri Yanto', phone: '0821-8667-5824', locationName: 'KHDTK Suban Jeriji', email: 'heriyantoe693@gmail.com' },
  { no: 9, name: 'Zulpan', phone: '0853-5599-0991', locationName: 'KHDTK Kepau Jaya', email: 'izulzulfan358@gmail.com' },
  { no: 10, name: 'Hendri Stiawan', phone: '0852-1852-6720', locationName: 'KHDTK Kepau Jaya', email: 'hendristiawanstiawan0@gmail.com' },
];

/**
 * Get assigned KHDTK location name by email or name
 */
export function getAssignedLocationName(email?: string | null, name?: string | null): string | null {
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const match = STAFF_ASSIGNMENTS.find(s => s.email.toLowerCase() === cleanEmail);
    if (match) return match.locationName;
  }

  if (name) {
    const cleanName = name.trim().toLowerCase();
    const match = STAFF_ASSIGNMENTS.find(s =>
      s.name.toLowerCase() === cleanName ||
      cleanName.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(cleanName)
    );
    if (match) return match.locationName;
  }

  return null;
}
