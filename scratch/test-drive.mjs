import { google } from 'googleapis';
import fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('d:/laporan_khdtk/myrimasa/.env.local', 'utf8');
let serviceAccountJson = '';
let driveFolderId = '';

for (const line of envContent.split('\n')) {
  if (line.startsWith('GOOGLE_SERVICE_ACCOUNT_JSON=')) {
    let raw = line.substring('GOOGLE_SERVICE_ACCOUNT_JSON='.length).trim();
    if (raw.startsWith("'") && raw.endsWith("'")) raw = raw.slice(1, -1);
    serviceAccountJson = raw;
  }
  if (line.startsWith('GOOGLE_DRIVE_FOLDER_ID=')) {
    driveFolderId = line.substring('GOOGLE_DRIVE_FOLDER_ID='.length).trim();
  }
}

console.log('Folder ID:', driveFolderId);

async function testDrive() {
  try {
    const credentials = JSON.parse(serviceAccountJson);
    console.log('Parsed credentials for email:', credentials.client_email);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Checking root folder access...');
    const folderRes = await drive.files.get({
      fileId: driveFolderId,
      fields: 'id, name, capabilities',
      supportsAllDrives: true,
    });
    console.log('Root folder found:', folderRes.data);

    // Test creating a small test text file
    console.log('Uploading test file...');
    const fileRes = await drive.files.create({
      requestBody: {
        name: 'test-upload.txt',
        parents: [driveFolderId],
      },
      media: {
        mimeType: 'text/plain',
        body: 'Halo dari MyRimasa test',
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });
    console.log('Uploaded successfully! File:', fileRes.data);
  } catch (err) {
    console.error('Google Drive Error:', err);
  }
}

testDrive();
