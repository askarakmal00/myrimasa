import { createAdminClient } from './supabase';

const BUCKET_NAME = 'khdtk-reports';

export interface UploadResult {
  drive_file_id: string;
  drive_url: string;
  file_name: string;
  file_type: string;
}

/**
 * Upload a photo/video directly to Google Drive (via Google Apps Script Web App)
 * or fallback to Supabase Storage.
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  locationName: string,
  employeeName: string,
  uploadDate: Date
): Promise<UploadResult> {
  const gappsUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // 1. If Google Apps Script Web App URL is provided, upload directly to Google Drive (15GB+ quota)
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
      });

      const json = await res.json();
      if (json.success && json.url) {
        console.log(`Uploaded to Google Drive via Apps Script: ${json.url}`);
        return {
          drive_file_id: json.fileId || `gdrive_${Date.now()}`,
          drive_url: json.url,
          file_name: fileName,
          file_type: mimeType,
        };
      } else {
        console.warn('Apps Script upload returned non-success:', json);
      }
    } catch (gappsErr) {
      console.error('Google Apps Script upload failed, falling back to Supabase:', gappsErr);
    }
  }

  // 2. Supabase Storage fallback
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
    console.error('File storage upload failed:', err);
    return {
      drive_file_id: `file_${Date.now()}`,
      drive_url: `https://ikgfexlwalhofuxskrrw.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`,
      file_name: fileName,
      file_type: mimeType,
    };
  }
}
