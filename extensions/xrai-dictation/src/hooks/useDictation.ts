/**
 * Hook orquestador principal que maneja todo el estado y lógica de negocio del panel de dictado.
 * Actúa como "cerebro", separando la lógica de manipulación de estado de la parte visual.
 */
import { useState, useEffect, useMemo } from 'react';
import { getXraiConfig } from '../XraiConfig';
import { Template, OrganPreset, GeneratedSections, RecordingState } from '../types/dictation';
import { fetchTemplates, dictateFull, generatePdfReport } from '../services/dictationApi';
import { useAudioRecorder } from './useAudioRecorder';

export function useDictation() {
  // 1. Obtenemos la configuración de entorno (se memoriza para evitar recalcular)
  const cfg = useMemo(() => getXraiConfig(), []);

  // 2. Estados principales
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 3. Estados de los datos ingresados y reportes generados
  const [organTexts, setOrganTexts] = useState<Record<string, string>>({});
  const [report, setReport] = useState<GeneratedSections | null>(null);
  
  // 4. Estados transitorios de actividad
  const [fullRecState, setFullRecState] = useState<RecordingState>('idle');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Instanciamos nuestro grabador de audio
  const { start, stop } = useAudioRecorder();

  /**
   * Efecto de inicialización: carga la lista de plantillas desde la API
   * apenas el componente se monta por primera vez.
   */
  useEffect(() => {
    if (!cfg.apiUrl || !cfg.apiKey || !cfg.clinicId) {
      setError('Configurá xraiApiUrl, xraiApiKey y xraiClinicId en window.config');
      return;
    }
    setLoading(true);
    fetchTemplates(cfg.apiUrl, cfg.apiKey, cfg.clinicId)
      .then((tpls) => {
        setTemplates(tpls);
        // Autoseleccionar la primera plantilla si existe
        if (tpls.length > 0) setSelectedId(tpls[0].id);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [cfg.apiUrl, cfg.apiKey, cfg.clinicId]);

  /**
   * Extrae rápidamente la meta-información de la plantilla que está seleccionada actualmente.
   */
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  /**
   * Extrae la lista plana de todos los órganos que se leen en la plantilla actual.
   * Nos sirve para renderizar fácilmente los botones independientes.
   */
  const allOrgans: OrganPreset[] = useMemo(
    () =>
      selectedTemplate
        ? selectedTemplate.sections
            .filter((s) => s.aiRole === 'fill_from_dictation' && s.organs)
            .flatMap((s) => s.organs!)
        : [],
    [selectedTemplate]
  );

  /**
   * Función de utilidad: convierte lo escrito en cada órgano individualmente
   * en un fragmento de HTML consolidado.
   */
  const buildHallazgosHtml = () =>
    allOrgans
      .map((o) => {
        const t = organTexts[o.name];
        return t ? `<h2>${o.name}</h2><p>${t}</p>` : '';
      })
      .filter(Boolean)
      .join('');

  // ---------- Controladores de Acciones (Handlers) ----------

  // Cambiar el select box de la plantilla actual, reseteando la UI
  const handleTemplateChange = (id: string) => {
    setSelectedId(id);
    setOrganTexts({});
    setReport(null);
  };

  // Guardar el texto transcrito (o escrito) de algún órgano específico
  const handleOrganChange = (organName: string, text: string) => {
    setOrganTexts((prev) => ({ ...prev, [organName]: text }));
  };

  /**
   * Manejador del dictado grande (informe entero).
   * Determina si tiene que empezar a grabar o cortar y procesar.
   */
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
        // Si la IA identificó valores concretos por órgano, los copiamos
        if (result.organFindings) setOrganTexts(result.organFindings);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error en dictado');
      } finally {
        setFullRecState('idle');
      }
    }
  };

  /**
   * Compila el informe a partir de lo que se dictó en cada órgano de manera individual
   * evitando hacer una llamada global a la IA otra vez.
   */
  const handleGenerateFromOrgans = () => {
    if (!selectedTemplate) return;
    const generated: GeneratedSections = {};
    for (const s of selectedTemplate.sections) {
      if (s.aiRole === 'fill_from_dictation') {
        generated[s.key] = buildHallazgosHtml();
      } else if (s.aiRole === 'use_default' || s.aiRole === 'manual') {
        generated[s.key] = s.defaultValue;
      }
    }
    setReport(generated);
  };

  /**
   * Agrupa todo el HTML visible y le solicita al backend transformarlo a PDF.
   */
  const handleGeneratePdf = async () => {
    if (!selectedTemplate) return;
    setGeneratingPdf(true);

    try {
      // Usar report si existe (dictado completo), sino construir desde organTexts
      const activeReport: GeneratedSections = report ?? (() => {
        const generated: GeneratedSections = {};
        for (const s of selectedTemplate.sections) {
          if (s.aiRole === 'fill_from_dictation') {
            generated[s.key] = buildHallazgosHtml();
          } else if (s.aiRole === 'use_default' || s.aiRole === 'manual') {
            generated[s.key] = s.defaultValue;
          }
        }
        return generated;
      })();

      const htmlContent = selectedTemplate.sections
        .map((s) => {
          const content = activeReport[s.key];
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
        activeReport['CONCLUSION'] ?? ''
      );

      // Usar URL interna para habilitar visualización nativa en una pestaña nueva del browser
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error generando PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  /**
   * Extrae el texto neto (quitando los tags HTML) del reporte y lo manda al portapapeles.
   */
  const copyReport = () => {
    if (!report || !selectedTemplate) return;
    const lines = selectedTemplate.sections.flatMap((s) => {
      const html = report[s.key];
      if (!html) return [];
      // Expresión regular para quitar los <tags> y normalizar los espacios
      const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return [s.label.toUpperCase(), txt, ''];
    });
    navigator.clipboard.writeText(lines.join('\n'));
  };

  // Exponemos las variables y funciones que la vista (React) necesita para dibujarse
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
