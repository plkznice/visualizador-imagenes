/**
 * Verifica si ya existe un informe guardado para el estudio actual.
 * Se ejecuta una sola vez cuando el studyInstanceUID está disponible.
 */
import { useState, useEffect } from 'react';
import { checkReportExists } from '../services/dictationApi';
import { XraiConfig } from '../XraiConfig';

export function useExistingReport(cfg: XraiConfig, studyInstanceUID: string | undefined) {
  const [exists, setExists] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!studyInstanceUID || !cfg.apiUrl || !cfg.apiKey) return;

    setChecking(true);
    checkReportExists(cfg.apiUrl, cfg.apiKey, studyInstanceUID, cfg.clinicId)
      .then(setExists)
      .catch(() => setExists(false))
      .finally(() => setChecking(false));
  }, [studyInstanceUID, cfg.apiUrl, cfg.apiKey]);

  return { exists, checking };
}
