/**
 * Hook orquestador principal que maneja todo el estado y lógica de negocio del panel de dictado.
 * Actúa como "cerebro", separando la lógica de manipulación de estado de la parte visual.
 */
import { useState, useEffect, useMemo } from 'react';
import { getXraiConfig } from '../XraiConfig';
import { Template, OrganPreset, GeneratedSections, RecordingState } from '../types/dictation';
import { fetchTemplates, dictateFull, generatePdfReport, saveReportToServer, dictateOrgan } from '../services/dictationApi';
import { useAudioRecorder } from './useAudioRecorder';

export function useDictation() {
  const cfg = useMemo(() => getXraiConfig(), []);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [organTexts, setOrganTexts] = useState<Record<string, string>>({});
  const [conclusion, setConclusion] = useState('');
  const [report, setReport] = useState<GeneratedSections | null>(null);

  const [fullRecState, setFullRecState] = useState<RecordingState>('idle');
  const [conclusionRecState, setConclusionRecState] = useState<RecordingState>('idle');
  const [conclusionAppendState, setConclusionAppendState] = useState<RecordingState>('idle');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);

  const { start, stop } = useAudioRecorder();
  const { start: startConcRec, stop: stopConcRec } = useAudioRecorder();
  const { start: startConcAppend, stop: stopConcAppend } = useAudioRecorder();

  useEffect(() => {
    if (!cfg.apiUrl || !cfg.apiKey || !cfg.clinicId) {
      setError('Configurá xraiApiUrl, xraiApiKey y xraiClinicId en window.config');
      return;
    }
    setLoading(true);
    fetchTemplates(cfg.apiUrl, cfg.apiKey, cfg.clinicId)
      .then(tpls => {
        setTemplates(tpls);
        if (tpls.length > 0) setSelectedId(tpls[0].id);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [cfg.apiUrl, cfg.apiKey, cfg.clinicId]);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const allOrgans: OrganPreset[] = useMemo(
    () =>
      selectedTemplate
        ? selectedTemplate.sections
            .filter(s => s.aiRole === 'fill_from_dictation' && s.organs)
            .flatMap(s => s.organs!)
        : [],
    [selectedTemplate]
  );

  const buildHallazgosHtml = () =>
    allOrgans
      .map(o => {
        const t = organTexts[o.name];
        return t ? `<h2>${o.name}</h2><p>${t}</p>` : '';
      })
      .filter(Boolean)
      .join('');

  // Construye el GeneratedSections a partir de los textos ingresados por órgano
  const buildReportFromOrgans = (): GeneratedSections => {
    if (!selectedTemplate) return {};
    const generated: GeneratedSections = {};
    for (const s of selectedTemplate.sections) {
      if (s.aiRole === 'fill_from_dictation') {
        generated[s.key] = buildHallazgosHtml();
      } else if (s.aiRole === 'use_default' || s.aiRole === 'manual') {
        generated[s.key] = s.defaultValue;
      }
    }
    return generated;
  };

  const handleTemplateChange = (id: string) => {
    setSelectedId(id);
    setOrganTexts({});
    setConclusion('');
    setReport(null);
  };

  const handleOrganChange = (organName: string, text: string) => {
    setOrganTexts(prev => ({ ...prev, [organName]: text }));
  };

  const handleConclusionChange = (text: string) => setConclusion(text);

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
        // Si la IA generó conclusión, la volcamos al campo
        if (result.generatedSections?.['CONCLUSION']) {
          setConclusion(result.generatedSections['CONCLUSION']);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error en dictado');
      } finally {
        setFullRecState('idle');
      }
    }
  };

  const handleConclusionReplace = async () => {
    if (conclusionRecState === 'idle') {
      setError('');
      setConclusionRecState('recording');
      await startConcRec();
    } else if (conclusionRecState === 'recording') {
      setConclusionRecState('processing');
      const audio = await stopConcRec();
      try {
        const result = await dictateOrgan(cfg.apiUrl, cfg.apiKey, 'Conclusión', [], audio);
        setConclusion(result.text);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error dictando conclusión');
      } finally {
        setConclusionRecState('idle');
      }
    }
  };

  const handleConclusionAppend = async () => {
    if (conclusionAppendState === 'idle') {
      setError('');
      setConclusionAppendState('recording');
      await startConcAppend();
    } else if (conclusionAppendState === 'recording') {
      setConclusionAppendState('processing');
      const audio = await stopConcAppend();
      try {
        const result = await dictateOrgan(cfg.apiUrl, cfg.apiKey, 'Conclusión', [], audio);
        setConclusion(prev => prev.trimEnd() + (prev.trim() ? ' ' : '') + result.text);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error dictando conclusión');
      } finally {
        setConclusionAppendState('idle');
      }
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedTemplate) return;
    setGeneratingPdf(true);

    try {
      const activeReport: GeneratedSections = report ?? buildReportFromOrgans();

      const htmlContent = selectedTemplate.sections
        .map(s => {
          const content = activeReport[s.key];
          if (!content || s.key === 'CONCLUSION') return '';
          return `<h2>${s.label}</h2>${content}`;
        })
        .filter(Boolean)
        .join('');

      // Prioridad: campo manual de conclusión > lo que generó la IA
      const finalConclusion = conclusion.trim() || activeReport['CONCLUSION'] || '';

      const blob = await generatePdfReport(
        cfg.apiUrl,
        cfg.apiKey,
        selectedTemplate.name,
        htmlContent,
        finalConclusion
      );

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error generando PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSaveReport = async (studyInstanceUID: string) => {
    if (!selectedTemplate || !studyInstanceUID) return;
    setSavingReport(true);
    setReportSaved(false);
    setError('');

    try {
      const activeReport: GeneratedSections = report ?? buildReportFromOrgans();

      const htmlContent = selectedTemplate.sections
        .map(s => {
          const content = activeReport[s.key];
          if (!content || s.key === 'CONCLUSION') return '';
          return `<h2>${s.label}</h2>${content}`;
        })
        .filter(Boolean)
        .join('');

      const finalConclusion = conclusion.trim() || activeReport['CONCLUSION'] || '';

      await saveReportToServer(cfg.apiUrl, cfg.apiKey, {
        studyInstanceUID,
        clinicId: cfg.clinicId,
        studyName: selectedTemplate.name,
        htmlContent,
        conclusion: finalConclusion,
      });

      setReportSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error guardando el informe');
    } finally {
      setSavingReport(false);
    }
  };

  return {
    cfg,
    templates,
    selectedId,
    loading,
    error,
    organTexts,
    conclusion,
    fullRecState,
    generatingPdf,
    savingReport,
    reportSaved,
    selectedTemplate,
    allOrgans,
    handleTemplateChange,
    handleOrganChange,
    handleConclusionChange,
    handleFullDictation,
    handleConclusionReplace,
    handleConclusionAppend,
    conclusionRecState,
    conclusionAppendState,
    handleGeneratePdf,
    handleSaveReport,
  };
}
