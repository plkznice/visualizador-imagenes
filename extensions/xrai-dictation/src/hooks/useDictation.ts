import { useState, useEffect, useMemo } from 'react';
import { getXraiConfig } from '../XraiConfig';
import { Template, OrganPreset, GeneratedSections, RecordingState } from '../types/dictation';
import { fetchTemplates, dictateFull, generatePdfReport } from '../services/dictationApi';
import { useAudioRecorder } from './useAudioRecorder';

export function useDictation() {
  const cfg = useMemo(() => getXraiConfig(), []);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [organTexts, setOrganTexts] = useState<Record<string, string>>({});
  const [report, setReport] = useState<GeneratedSections | null>(null);
  const [fullRecState, setFullRecState] = useState<RecordingState>('idle');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { start, stop } = useAudioRecorder();

  useEffect(() => {
    if (!cfg.apiUrl || !cfg.apiKey || !cfg.clinicId) {
      setError('Configurá xraiApiUrl, xraiApiKey y xraiClinicId en window.config');
      return;
    }
    setLoading(true);
    fetchTemplates(cfg.apiUrl, cfg.apiKey, cfg.clinicId)
      .then((tpls) => {
        setTemplates(tpls);
        if (tpls.length > 0) setSelectedId(tpls[0].id);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [cfg.apiUrl, cfg.apiKey, cfg.clinicId]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const allOrgans: OrganPreset[] = useMemo(
    () =>
      selectedTemplate
        ? selectedTemplate.sections
            .filter((s) => s.aiRole === 'fill_from_dictation' && s.organs)
            .flatMap((s) => s.organs!)
        : [],
    [selectedTemplate]
  );

  const buildHallazgosHtml = () =>
    allOrgans
      .map((o) => {
        const t = organTexts[o.name];
        return t ? `<h2>${o.name}</h2><p>${t}</p>` : '';
      })
      .filter(Boolean)
      .join('');

  const handleTemplateChange = (id: string) => {
    setSelectedId(id);
    setOrganTexts({});
    setReport(null);
  };

  const handleOrganChange = (organName: string, text: string) => {
    setOrganTexts((prev) => ({ ...prev, [organName]: text }));
  };

  const handleFullDictation = async () => {
    if (!selectedTemplate) return;
    if (fullRecState === 'idle') {
      setError('');
      setFullRecState('recording');
      await start();
    } else if (fullRecState === 'recording') {
      setFullRecState('processing');
      const audio = await stop();
      try {
        const result = await dictateFull(cfg.apiUrl, cfg.apiKey, selectedTemplate.sections, audio);
        setReport(result.generatedSections);
        if (result.organFindings) setOrganTexts(result.organFindings);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error en dictado');
      } finally {
        setFullRecState('idle');
      }
    }
  };

  const handleGenerateFromOrgans = () => {
    if (!selectedTemplate) return;
    const generated: GeneratedSections = {};
    for (const s of selectedTemplate.sections) {
      if (s.aiRole === 'fill_from_dictation') {
        generated[s.key] = buildHallazgosHtml();
      } else if (s.aiRole === 'use_default' || s.aiRole === 'manual') {
        generated[s.key] = s.defaultValue;
      }
      // generate_from_findings: se deja vacío — requiere dictado completo con IA
    }
    setReport(generated);
  };

  const handleGeneratePdf = async () => {
    if (!report || !selectedTemplate) return;
    setGeneratingPdf(true);
    try {
      const htmlContent = selectedTemplate.sections
        .map((s) => {
          const content = report[s.key];
          if (!content || s.key === 'CONCLUSION') return '';
          return `<h2>${s.label}</h2>${content}`;
        })
        .filter(Boolean)
        .join('');

      const blob = await generatePdfReport(
        cfg.apiUrl,
        cfg.apiKey,
        selectedTemplate.name,
        htmlContent,
        report['CONCLUSION'] ?? ''
      );

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error generando PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const copyReport = () => {
    if (!report || !selectedTemplate) return;
    const lines = selectedTemplate.sections.flatMap((s) => {
      const html = report[s.key];
      if (!html) return [];
      const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return [s.label.toUpperCase(), txt, ''];
    });
    navigator.clipboard.writeText(lines.join('\n'));
  };

  return {
    cfg,
    templates,
    selectedId,
    loading,
    error,
    organTexts,
    report,
    fullRecState,
    generatingPdf,
    selectedTemplate,
    allOrgans,
    handleTemplateChange,
    handleOrganChange,
    handleFullDictation,
    handleGenerateFromOrgans,
    handleGeneratePdf,
    copyReport,
  };
}
