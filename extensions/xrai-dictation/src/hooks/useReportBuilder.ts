/**
 * Centraliza la construcción del HTML del informe.
 * Elimina la duplicación que existía en handleGeneratePdf y handleSaveReport.
 */
import { Template, OrganPreset, GeneratedSections } from '../types/dictation';

export function useReportBuilder(
  selectedTemplate: Template | null,
  allOrgans: OrganPreset[],
  organTexts: Record<string, string>,
  conclusion: string
) {
  const buildFindingsHtml = (): string =>
    allOrgans
      .map(o => {
        const text = organTexts[o.name];
        return text ? `<h2>${o.name}</h2><p>${text}</p>` : '';
      })
      .filter(Boolean)
      .join('');

  const buildSectionsHtml = (activeReport: GeneratedSections): string =>
    (selectedTemplate?.sections ?? [])
      .map(s => {
        const content = activeReport[s.key];
        if (!content || s.key === 'CONCLUSION') return '';
        return `<h2>${s.label}</h2>${content}`;
      })
      .filter(Boolean)
      .join('');

  const buildReport = (): GeneratedSections => {
    if (!selectedTemplate) return {};
    const generated: GeneratedSections = {};
    for (const s of selectedTemplate.sections) {
      if (s.aiRole === 'fill_from_dictation') {
        generated[s.key] = buildFindingsHtml();
      } else if (s.aiRole === 'use_default' || s.aiRole === 'manual') {
        generated[s.key] = s.defaultValue;
      }
    }
    return generated;
  };

  const getFinalConclusion = (activeReport: GeneratedSections): string =>
    conclusion.trim() || activeReport['CONCLUSION'] || '';

  return { buildReport, buildSectionsHtml, getFinalConclusion };
}
