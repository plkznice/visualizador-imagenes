/**
 * Este archivo tipa y configura las variables de entorno necesarias para la extensión.
 * Las variables se inyectan a través del objeto global `window.config`.
 */

interface XraiWindowConfig {
  xraiApiUrl?: string;
  xraiApiKey?: string;
  xraiClinicId?: string;
}

declare global {
  interface Window {
    config?: XraiWindowConfig & Record<string, unknown>;
  }
}

export interface XraiConfig {
  apiUrl: string;
  apiKey: string;
  clinicId: string;
}

/**
 * Obtiene la configuración de XRAI.
 * Si algún valor no está definido en `window.config`, provee valores por defecto útiles para desarrollo.
 */
export function getXraiConfig(): XraiConfig {
  const cfg = window.config ?? {};
  return {
    apiUrl: cfg.xraiApiUrl ?? 'http://localhost:3001',
    apiKey: cfg.xraiApiKey ?? '',
    clinicId: cfg.xraiClinicId ?? '',
  };
}
