/**
 * Hook orquestador del panel de dictado.
 * Coordina plantillas, textos de órganos, conclusión y acciones de informe.
 * La lógica de grabación vive en useRecordingFlow, la de HTML en useReportBuilder.
 */
import { useState, useEffect, useMemo } from 'react';
import { getXraiConfig } from '../XraiConfig';
import { Template, OrganPreset, GeneratedSections } from '../types/dictation';
import { fetchTemplates, dictateFull, generatePdfReport, saveReportToServer, dictateOrgan } from '../services/dictationApi';
import { useRecordingFlow } from './useRecordingFlow';
import { useReportBuilder } from './useReportBuilder';

export function useDictation() {
  const cfg = useMemo(() => getXraiConfig(), []);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [organTexts, setOrganTexts] = useState<Record<string, string>>({});
  const [conclusion, setConclusion] = useState('');
  const [report, setReport] = useState<GeneratedSections | null>(null);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);

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

  const { buildReport, buildSectionsHtml, getFinalConclusion } = useReportBuilder(
    selectedTemplate,
    allOrgans,
    organTexts,
    conclusion
  );

  const fullDictation = useRecordingFlow({
    onProcess: async (audio) => {
      if (!selectedTemplate) throw new Error('No hay plantilla seleccionada');
      return dictateFull(cfg.apiUrl, cfg.apiKey, selectedTemplate.sections, audio);
    },
    onSuccess: (result) => {
      setReport(result.generatedSections);
      if (result.organFindings) setOrganTexts(result.organFindings);
      if (result.generatedSections?.['CONCLUSION']) {
        setConclusion(result.generatedSections['CONCLUSION']);
      }
    },
    onError: setError,
  });

  const conclusionReplace = useRecordingFlow({
    onProcess: (audio) => dictateOrgan(cfg.apiUrl, cfg.apiKey, 'Conclusión', [], audio),
    onSuccess: (result) => setConclusion(result.text),
    onError: setError,
  });

  const conclusionAppend = useRecordingFlow({
    onProcess: (audio) => dictateOrgan(cfg.apiUrl, cfg.apiKey, 'Conclusión', [], audio),
    onSuccess: (result) =>
      setConclusion(prev => prev.trimEnd() + (prev.trim() ? ' ' : '') + result.text),
    onError: setError,
  });

  const handleTemplateChange = (id: string) => {
    setSelectedId(id);
    setOrganTexts({});
    setConclusion('');
    setReport(null);
  };

  const handleOrganChange = (organName: string, text: string) => {
    setOrganTexts(prev => ({ ...prev, [organName]: text }));
  };

  const handleGeneratePdf = async () => {
    if (!selectedTemplate) return;
    setGeneratingPdf(true);
    try {
      const activeReport = report ?? buildReport();
      const blob = await generatePdfReport(
        cfg.apiUrl,
        cfg.apiKey,
        selectedTemplate.name,
        buildSectionsHtml(activeReport),
        getFinalConclusion(activeReport)
      );
      window.open(URL.createObjectURL(blob), '_blank');
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
      const activeReport = report ?? buildReport();
      await saveReportToServer(cfg.apiUrl, cfg.apiKey, {
        studyInstanceUID,
        clinicId: cfg.clinicId,
        studyName: selectedTemplate.name,
        htmlContent: buildSectionsHtml(activeReport),
        conclusion: getFinalConclusion(activeReport),
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
    fullRecState: fullDictation.state,
    generatingPdf,
    savingReport,
    reportSaved,
    selectedTemplate,
    allOrgans,
    handleTemplateChange,
    handleOrganChange,
    handleConclusionChange: setConclusion,
    handleFullDictation: fullDictation.toggle,
    conclusionReplaceState: conclusionReplace.state,
    conclusionAppendState: conclusionAppend.state,
    handleConclusionReplace: conclusionReplace.toggle,
    handleConclusionAppend: conclusionAppend.toggle,
    handleGeneratePdf,
    handleSaveReport,
  };
}
