import { google } from 'googleapis';
import fs from 'fs';
import { Readable } from 'stream';

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

async function testUpload() {
  try {
    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // Find the folder named 'sandro'
    const listRes = await drive.files.list({
      q: "name='sandro' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name, parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    console.log('Found sandro folder:', listRes.data.files);
    const sandroFolderId = listRes.data.files[0]?.id;

    if (!sandroFolderId) {
      console.log('Folder sandro not found');
      return;
    }

    const testBuffer = Buffer.from('fake image binary content 12345');
    const stream = Readable.from(testBuffer);

    console.log('Uploading test image to sandro folder:', sandroFolderId);
    const uploadRes = await drive.files.create({
      requestBody: {
        name: 'test_photo.jpg',
        parents: [sandroFolderId],
      },
      media: {
        mimeType: 'image/jpeg',
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    console.log('Upload result:', uploadRes.data);

    // Test setting permission
    const permRes = await drive.permissions.create({
      fileId: uploadRes.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });
    console.log('Permission result:', permRes.data);
  } catch (err) {
    console.error('Error uploading to subfolder:', err);
  }
}

testUpload();
