import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../../../identity');
const DEST_IMG_DIR = path.resolve(__dirname, '../public/images');
const DEST_ICON_DIR = path.resolve(__dirname, '../public/icons');

async function optimize() {
  await fs.mkdir(DEST_IMG_DIR, { recursive: true });
  await fs.mkdir(DEST_ICON_DIR, { recursive: true });

  console.log('Otimizando logos WebP...');
  
  // 1. Otimizar as Logos principais em WebP
  const logos = ['logo.png', 'logo_simbolo.png', 'logo_texto.png'];
  for (const logo of logos) {
    const srcPath = path.join(SRC_DIR, logo);
    try {
      await fs.access(srcPath);
      // WebP format
      await sharp(srcPath)
        .webp({ quality: 90 })
        .toFile(path.join(DEST_IMG_DIR, logo.replace('.png', '.webp')));
        
      // Copy PNG as fallback
      await fs.copyFile(srcPath, path.join(DEST_IMG_DIR, logo));
      console.log(`✅ ${logo} convertido para WebP e copiado PNG.`);
    } catch (e) {
      console.error(`❌ Erro ao processar ${logo}:`, e.message);
    }
  }

  // 2. Gerar PWA Icons a partir do logo_simbolo.png
  console.log('Gerando ícones PWA...');
  const baseIcon = path.join(SRC_DIR, 'logo_simbolo.png');
  const sizes = [192, 384, 512];
  
  for (const size of sizes) {
    try {
      // Regular icons
      await sharp(baseIcon)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(path.join(DEST_ICON_DIR, `icon-${size}x${size}.png`));
        
      console.log(`✅ icon-${size}x${size}.png gerado.`);
    } catch(e) {
      console.error(`❌ Erro ícone ${size}:`, e.message);
    }
  }

  // Maskable Icons (geralmente precisam de um fundo sólido e padding)
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    try {
      // Criar ícone com padding e fundo azul institucional (#0A1C82)
      await sharp(baseIcon)
        .resize(Math.round(size * 0.7), Math.round(size * 0.7), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({
          top: Math.round(size * 0.15),
          bottom: Math.round(size * 0.15),
          left: Math.round(size * 0.15),
          right: Math.round(size * 0.15),
          background: { r: 10, g: 28, b: 130, alpha: 1 } // #0A1C82 brand-blue
        })
        .toFile(path.join(DEST_ICON_DIR, `icon-maskable-${size}x${size}.png`));
      
      console.log(`✅ icon-maskable-${size}x${size}.png gerado.`);
    } catch(e) {
       console.error(`❌ Erro maskable ${size}:`, e.message);
    }
  }
}

optimize().then(() => console.log('Otimização concluída!')).catch(console.error);
