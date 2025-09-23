// Script to download required GeoJSON files for geographic charts
// Run this with: node public/geo/download-geo-data.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geoFiles = {
  'world-countries-110m.json': 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
  'us-states-10m.json': 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
  'us-counties-10m.json': 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json',
  'nielsentopo.json': 'https://gist.github.com/simzou/6459889/raw/nielsentopo.json'
};

async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${filename}...`);

    const file = fs.createWriteStream(path.join(__dirname, filename));

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ ${filename} downloaded successfully`);
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlinkSync(path.join(__dirname, filename));
        downloadFile(response.headers.location, filename).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(path.join(__dirname, filename));
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(path.join(__dirname, filename));
      reject(err);
    });
  });
}

async function downloadAllFiles() {
  console.log('🗺️  Downloading GeoJSON files for geographic charts...\n');

  try {
    for (const [filename, url] of Object.entries(geoFiles)) {
      await downloadFile(url, filename);
    }

    console.log('\n🎉 All geographic data files downloaded successfully!');
    console.log('\nFiles downloaded:');
    for (const filename of Object.keys(geoFiles)) {
      const filePath = path.join(__dirname, filename);
      const stats = fs.statSync(filePath);
      console.log(`  - ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  } catch (error) {
    console.error('❌ Error downloading files:', error.message);
    process.exit(1);
  }
}

downloadAllFiles();