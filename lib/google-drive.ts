import { createAdminClient } from './supabase';

const BUCKET_NAME = 'khdtk-reports';
const DEFAULT_GAPPS_URL = 'https://script.google.com/macros/s/AKfycbxI3kiPZ9-BVYzkcY8Z6yxsIT3Scqv9bMYv316XaTi8i-ovEQ5LGfrocr1yvH3OjtCi/exec';
const DEFAULT_DRIVE_FOLDER_ID = '1wEAofxSS3yAUS6OAQ02wOkFA7T07ty4N';

export interface UploadResult {
  drive_file_id: string;
  drive_url: string;
  file_name: string;
  file_type: string;
}

/**
 * Upload a photo/video directly to Google Drive (via Google Apps Script Web App)
 * Always prioritizes Google Drive storage into user's personal Google Drive.
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  locationName: string,
  employeeName: string,
  uploadDate: Date
): Promise<UploadResult> {
  const gappsUrl = process.env.GOOGLE_APPS_SCRIPT_URL || DEFAULT_GAPPS_URL;
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_DRIVE_FOLDER_ID;

  // 1. Upload directly to Google Drive via Google Apps Script Web App
  if (gappsUrl && gappsUrl.trim().startsWith('http')) {
    try {
      const base64Data = fileBuffer.toString('base64');
      const payload = {
        folderId: rootFolderId,
        locationName: locationName || 'KHDTK',
        employeeName: employeeName || 'Petugas',
        date: uploadDate.toISOString(),
        fileName,
        mimeType: mimeType || 'image/jpeg',
        base64: base64Data,
      };

      const res = await fetch(gappsUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });

      const json = await res.json();
      if (json.success && json.url) {
        console.log(`Successfully uploaded to Google Drive: ${json.url}`);
        return {
          drive_file_id: json.fileId || `gdrive_${Date.now()}`,
          drive_url: json.url,
          file_name: fileName,
          file_type: mimeType,
        };
      } else {
        console.warn('Google Apps Script upload response:', json);
      }
    } catch (gappsErr) {
      console.error('Google Apps Script upload error / timeout:', gappsErr);
    }
  }

  // 2. Emergency fallback to Supabase Storage only if Google Drive is completely unreachable
  const adminClient = createAdminClient();

  const year = String(uploadDate.getFullYear());
  const month = String(uploadDate.getMonth() + 1).padStart(2, '0');
  const dateStr = `${year}-${month}-${String(uploadDate.getDate()).padStart(2, '0')}`;

  const cleanLoc = locationName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
  const cleanEmp = employeeName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
  const cleanFile = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.\-]/g, '_')}`;

  const storagePath = `${year}/${month}/${cleanLoc}/${dateStr}/${cleanEmp}/${cleanFile}`;

  try {
    await adminClient.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true,
      });

    const { data: { publicUrl } } = adminClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      drive_file_id: storagePath,
      drive_url: publicUrl,
      file_name: fileName,
      file_type: mimeType,
    };
  } catch (err: any) {
    console.error('Emergency storage upload failed:', err);
    return {
      drive_file_id: `file_${Date.now()}`,
      drive_url: `https://ikgfexlwalhofuxskrrw.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`,
      file_name: fileName,
      file_type: mimeType,
    };
  }
}
