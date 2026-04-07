export type SectionAiRole =
  | 'use_default'
  | 'fill_from_dictation'
  | 'generate_from_findings'
  | 'manual';

export type OrganKeyword = { keyword: string; text: string };
export type OrganPreset = { name: string; keywords: OrganKeyword[] };

export type TemplateSection = {
  key: string;
  label: string;
  required: boolean;
  aiRole: SectionAiRole;
  defaultValue: string;
  organs?: OrganPreset[];
};

export type Template = {
  id: string;
  name: string;
  clinicId: string;
  sections: TemplateSection[];
  normalReport: Record<string, string>;
  criticalKeywords: string[];
};

export type GeneratedSections = Record<string, string>;

export type RecordingState = 'idle' | 'recording' | 'processing';
