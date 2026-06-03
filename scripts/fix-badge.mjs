import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = path.resolve(__dirname, '../../../identity/logo_simbolo.png');
const output = path.resolve(__dirname, '../public/icons/badge-96x96.png');

async function fixBadge() {
  try {
    const metadata = await sharp(input).metadata();
    
    // Extrai o canal de transparência (Alpha) exato do logo original
    const alpha = await sharp(input).extractChannel('alpha').toBuffer();
    
    // Cria um canvas estritamente branco do mesmo tamanho
    const whiteImage = await sharp({
      create: { 
        width: metadata.width, 
        height: metadata.height, 
        channels: 3, 
        background: { r: 255, g: 255, b: 255 } 
      }
    })
    // Aplica a transparência original (o que era cor vira branco, o que era fundo continua transparente)
    .joinChannel(alpha)
    .png()
    .toBuffer();

    // Redimensiona preservando proporção
    await sharp(whiteImage)
      .resize(96, 96, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
      .toFile(output);
      
    console.log('✅ Badge corrigido com preenchimento sólido original.');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixBadge();
