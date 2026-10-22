const fs = require('fs');
const path = require('path');

// 1x1 pixel valid PNG buffer or small PNG generator
const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const buffer = Buffer.from(dummyPngBase64, 'base64');

const files = [
  'sample_pothole_before.jpg',
  'sample_pothole_after.jpg',
  'sample_garbage.jpg',
  'sample_water_leak.jpg'
];

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

files.forEach(f => {
  const filePath = path.join(uploadDir, f);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, buffer);
  }
});
console.log('Sample images initialized in uploads directory.');
