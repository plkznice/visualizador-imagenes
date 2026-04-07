// Configuración de conexión con XRAI
// Estos valores se pueden sobrescribir desde window.config en vercel.js

export function getXraiConfig() {
  const cfg = (window as any).config ?? {};
  return {
    apiUrl: (cfg.xraiApiUrl as string) ?? 'http://localhost:3001',
    apiKey: (cfg.xraiApiKey as string) ?? '',
    clinicId: (cfg.xraiClinicId as string) ?? '',
  };
}
