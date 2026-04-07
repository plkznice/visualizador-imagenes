/**
 * Definición de tipos de datos.
 * Centralizar los tipos aquí ayuda a mantener el código organizado y evita dependencias circulares.
 */

/**
 * Rol que asume la IA para procesar el texto de una sección del informe.
 */
export type SectionAiRole =
  | 'use_default'
  | 'fill_from_dictation'
  | 'generate_from_findings'
  | 'manual';

// Palabra clave específica y su texto predefinido asociado
export type OrganKeyword = { keyword: string; text: string };

// Configuración de palabras clave para un órgano en particular
export type OrganPreset = { name: string; keywords: OrganKeyword[] };

/**
 * Representa una sección individual dentro de una plantilla (ej. Hallazgos, Conclusión).
 */
export type TemplateSection = {
  key: string;
  label: string;
  required: boolean;
  aiRole: SectionAiRole;
  defaultValue: string;
  organs?: OrganPreset[];
};

/**
 * Modelo completo de una plantilla de informe médico (ej. Ecografía Abdominal).
 */
export type Template = {
  id: string;
  name: string;
  clinicId: string;
  sections: TemplateSection[];
  normalReport: Record<string, string>;
  criticalKeywords: string[];
};

// Resultado temporal con el contenido HTML generado para cada sección
export type GeneratedSections = Record<string, string>;

// Diferentes estados posibles durante la grabación de audio
export type RecordingState = 'idle' | 'recording' | 'processing';
