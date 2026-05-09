import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  // Habilitamos em dev para testar Push, mas com cautela
  disable: false, 
  register: true,
  skipWaiting: true,
  customWorkerDir: 'src/worker',
  // Ignora arquivos que mudam muito em dev e causam o erro 404
  buildExcludes: [/app-build-manifest\.json$/, /middleware-manifest\.json$/, /_next\/static\/chunks\/.*\.js$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desabilita o lint durante o build para agilizar o teste do PWA se necessário
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);
