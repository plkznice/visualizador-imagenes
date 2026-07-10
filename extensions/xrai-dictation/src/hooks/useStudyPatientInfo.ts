/**
 * Extrae la información del paciente desde el displaySetService de OHIF.
 * Reemplaza la lógica inline que vivía en el componente PanelDictation.
 */
import { useState, useEffect } from 'react';
import { utils } from '@ohif/core';

export interface StudyPatientInfo {
  name: string;
  dob: string;
  study: string;
  studyInstanceUID: string;
}

export function useStudyPatientInfo(servicesManager: unknown): StudyPatientInfo | null {
  const [patientInfo, setPatientInfo] = useState<StudyPatientInfo | null>(null);

  useEffect(() => {
    const sm = servicesManager as { services?: { displaySetService?: unknown } } | null;
    const displaySetService = sm?.services?.displaySetService as {
      getActiveDisplaySets: () => unknown[];
      subscribe: (event: string, cb: (e: unknown) => void) => { unsubscribe: () => void };
      EVENTS: { DISPLAY_SETS_ADDED: string };
    } | undefined;

    if (!displaySetService) return;

    const extract = (displaySet: unknown): void => {
      const ds = displaySet as Record<string, unknown>;
      const instances = ds?.instances as unknown[] | undefined;
      const instance = (instances?.[0] ?? ds?.instance) as Record<string, unknown> | undefined;
      
      // Si no hay metadatos de instancia DICOM, no podemos extraer la info
      if (!instance) return;

      // Usamos las utilidades de OHIF para formatear el nombre (ej: "Perez^Juan" -> "Juan Perez")
      const name = instance.PatientName
        ? utils.formatPN(instance.PatientName as string)
        : '';
        
      // Formateamos la fecha de nacimiento DICOM (ej: "19800101" -> "01-Jan-1980" dependiendo del locale)
      const dob = instance.PatientBirthDate
        ? utils.formatDate(instance.PatientBirthDate as string)
        : '';
        
      const study = (instance.StudyDescription as string) || '';
      const studyInstanceUID = (instance.StudyInstanceUID as string) || '';

      if (name || dob || study) {
        setPatientInfo({ name, dob, study, studyInstanceUID });
      }
    };

    const existing = displaySetService.getActiveDisplaySets();
    if (existing?.length) extract(existing[0]);

    const sub = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      (event: unknown) => {
        const e = event as { displaySetsAdded?: unknown[] };
        if (e?.displaySetsAdded?.length) extract(e.displaySetsAdded[0]);
      }
    );

    return () => sub.unsubscribe();
  }, [servicesManager]);

  return patientInfo;
}
