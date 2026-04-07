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

export function getXraiConfig(): XraiConfig {
  const cfg = window.config ?? {};
  return {
    apiUrl: cfg.xraiApiUrl ?? 'http://localhost:3001',
    apiKey: cfg.xraiApiKey ?? '',
    clinicId: cfg.xraiClinicId ?? '',
  };
}
