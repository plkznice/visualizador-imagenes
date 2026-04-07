import React, { useState, useEffect } from 'react';
import { getXraiConfig } from '../XraiConfig';
import { Template, OrganPreset, GeneratedSections, RecordingState } from '../types/dictation';
import { fetchTemplates, dictateFull, generatePdfReport } from '../services/dictationApi';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { OrganMicButton } from './OrganMicButton';
import { styles } from '../styles/PanelDictation.styles';

export default function PanelDictation() {
  const cfg = getXraiConfig();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [organTexts, setOrganTexts] = useState<Record<string, string>>({});
  const [report, setReport] = useState<GeneratedSections | null>(null);
  const [fullRecState, setFullRecState] = useState<RecordingState>('idle');
  const { start, stop } = useAudioRecorder();

  const [generatingPdf, setGeneratingPdf] = useState(false);

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
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cfg.apiUrl, cfg.apiKey, cfg.clinicId]);

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;

  const allOrgans: OrganPreset[] = selectedTemplate
    ? selectedTemplate.sections
        .filter((s) => s.aiRole === 'fill_from_dictation' && s.organs)
        .flatMap((s) => s.organs!)
    : [];

  const handleOrganChange = (organName: string, text: string) => {
    setOrganTexts((prev) => ({ ...prev, [organName]: text }));
  };

  const buildHallazgosHtml = () =>
    allOrgans
      .map((o) => {
        const t = organTexts[o.name];
        return t ? `<h2>${o.name}</h2><p>${t}</p>` : '';
      })
      .filter(Boolean)
      .join('');

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
        const result = await dictateFull(cfg.apiUrl!, cfg.apiKey!, selectedTemplate.sections, audio);
        setReport(result.generatedSections);
        if (result.organFindings) {
          setOrganTexts(result.organFindings);
        }
      } catch (e: any) {
        setError(e.message);
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
      } else {
        generated[s.key] = '<p>(Generado desde hallazgos)</p>';
      }
    }
    setReport(generated);
  };

  const handleGeneratePdf = async () => {
    if (!report || !selectedTemplate || !cfg.apiUrl || !cfg.apiKey) return;
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

      const conclusion = report['CONCLUSION'] ?? '';

      const blob = await generatePdfReport(
        cfg.apiUrl,
        cfg.apiKey,
        selectedTemplate.name,
        htmlContent,
        conclusion
      );

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const copyReport = () => {
    if (!report || !selectedTemplate) return;
    const lines: string[] = [];
    for (const s of selectedTemplate.sections) {
      const html = report[s.key];
      if (html) {
        lines.push(`${s.label.toUpperCase()}`);
        const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        lines.push(txt, '');
      }
    }
    navigator.clipboard.writeText(lines.join('\n'));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>🧠</span>
        <span style={styles.headerTitle}>XRAI Dictado</span>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {loading && <div style={styles.info}>Cargando plantillas...</div>}

      {!loading && templates.length > 0 && (
        <>
          <div style={styles.section}>
            <label style={styles.label}>Plantilla</label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setOrganTexts({});
                setReport(null);
              }}
              style={styles.select}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.section}>
            <button
              onClick={handleFullDictation}
              disabled={fullRecState === 'processing'}
              style={{
                ...styles.primaryBtn,
                ...(fullRecState === 'recording' ? styles.recordingBtn : {}),
              }}
            >
              {fullRecState === 'idle' && '🎤  Dictar informe completo'}
              {fullRecState === 'recording' && '⏹  Detener dictado'}
              {fullRecState === 'processing' && '⏳  Procesando...'}
            </button>
          </div>

          {allOrgans.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Dictado por órgano</div>
              {allOrgans.map((organ) => (
                <OrganMicButton
                  key={organ.name}
                  organ={organ}
                  value={organTexts[organ.name] ?? ''}
                  onChange={(text) => handleOrganChange(organ.name, text)}
                  apiUrl={cfg.apiUrl!}
                  apiKey={cfg.apiKey!}
                />
              ))}
              <button onClick={handleGenerateFromOrgans} style={styles.secondaryBtn}>
                📄  Generar informe desde órganos
              </button>
            </div>
          )}

          {report && selectedTemplate && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                Vista previa
                <button onClick={copyReport} style={styles.copyBtn}>📋 Copiar</button>
              </div>
              {selectedTemplate.sections.map((s) => {
                const content = report[s.key];
                if (!content) return null;
                return (
                  <div key={s.key} style={styles.reportSection}>
                    <div style={styles.reportSectionTitle}>{s.label}</div>
                    <div
                      style={styles.reportContent}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {report && (
            <div style={styles.pdfSection}>
              <button
                onClick={handleGeneratePdf}
                disabled={generatingPdf}
                style={styles.pdfBtn}
              >
                {generatingPdf ? '⏳  Generando PDF...' : '📄  Generar informe PDF'}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}
    </div>
  );
}
