import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_PATH = path.resolve(__dirname, '../public/icons/badge-96x96.svg');
const PNG_PATH = path.resolve(__dirname, '../public/icons/badge-96x96.png');

sharp(SVG_PATH)
  .resize(96, 96)
  .png()
  .toFile(PNG_PATH)
  .then(() => console.log('Badge PNG generated.'))
  .catch(console.error);
