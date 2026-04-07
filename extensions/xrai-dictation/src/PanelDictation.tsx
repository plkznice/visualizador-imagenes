import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getXraiConfig } from './XraiConfig';

// ── Types (mirror de XRAI) ────────────────────────────────────────────────────

type SectionAiRole =
  | 'use_default'
  | 'fill_from_dictation'
  | 'generate_from_findings'
  | 'manual';

type OrganKeyword = { keyword: string; text: string };
type OrganPreset = { name: string; keywords: OrganKeyword[] };
type TemplateSection = {
  key: string;
  label: string;
  required: boolean;
  aiRole: SectionAiRole;
  defaultValue: string;
  organs?: OrganPreset[];
};
type Template = {
  id: string;
  name: string;
  clinicId: string;
  sections: TemplateSection[];
  normalReport: Record<string, string>;
  criticalKeywords: string[];
};
type GeneratedSections = Record<string, string>;

// ── Estado de grabación por órgano ───────────────────────────────────────────
type RecordingState = 'idle' | 'recording' | 'processing';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchTemplates(apiUrl: string, apiKey: string, clinicId: string): Promise<Template[]> {
  const res = await fetch(`${apiUrl}/api/ext/templates?clinicId=${clinicId}`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) throw new Error('Error al cargar plantillas');
  return res.json();
}

async function dictateOrgan(
  apiUrl: string,
  apiKey: string,
  organName: string,
  keywords: OrganKeyword[],
  audio: Blob
): Promise<{ text: string; transcript: string }> {
  const fd = new FormData();
  fd.append('organName', organName);
  fd.append('keywords', JSON.stringify(keywords));
  fd.append('audio', new File([audio], 'audio.webm', { type: audio.type }));
  const res = await fetch(`${apiUrl}/api/ext/dictation`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? 'Error en dictado');
  }
  return res.json();
}

async function dictateFull(
  apiUrl: string,
  apiKey: string,
  sections: TemplateSection[],
  audio: Blob
): Promise<{ generatedSections: GeneratedSections; organFindings: Record<string, string>; transcript: string }> {
  const fd = new FormData();
  fd.append('sections', JSON.stringify(sections));
  fd.append('audio', new File([audio], 'audio.webm', { type: audio.type }));
  const res = await fetch(`${apiUrl}/api/ext/dictation`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? 'Error en dictado');
  }
  return res.json();
}

// ── Hook: grabación de audio ──────────────────────────────────────────────────

function useAudioRecorder() {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start();
    mediaRef.current = mr;
  }, []);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const mr = mediaRef.current;
      if (!mr) { resolve(new Blob()); return; }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        mr.stream.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };
      mr.stop();
    });
  }, []);

  return { start, stop };
}

// ── Componente: botón de micrófono por órgano ─────────────────────────────────

function OrganMicButton({
  organ,
  value,
  onChange,
  apiUrl,
  apiKey,
}: {
  organ: OrganPreset;
  value: string;
  onChange: (text: string) => void;
  apiUrl: string;
  apiKey: string;
}) {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState('');
  const { start, stop } = useAudioRecorder();

  const handleClick = async () => {
    if (state === 'idle') {
      setError('');
      setState('recording');
      await start();
    } else if (state === 'recording') {
      setState('processing');
      const audio = await stop();
      try {
        const result = await dictateOrgan(apiUrl, apiKey, organ.name, organ.keywords, audio);
        onChange(result.text);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setState('idle');
      }
    }
  };

  return (
    <div style={styles.organRow}>
      <div style={styles.organHeader}>
        <span style={styles.organName}>{organ.name}</span>
        <button
          onClick={handleClick}
          disabled={state === 'processing'}
          style={{
            ...styles.micBtn,
            ...(state === 'recording' ? styles.micBtnActive : {}),
          }}
          title={state === 'idle' ? 'Grabar' : state === 'recording' ? 'Detener' : 'Procesando...'}
        >
          {state === 'processing' ? '⏳' : state === 'recording' ? '⏹' : '🎤'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.organTextarea}
        placeholder={`Hallazgo de ${organ.name}...`}
        rows={2}
      />
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function PanelDictation() {
  const cfg = getXraiConfig();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado por órgano: { organName: texto }
  const [organTexts, setOrganTexts] = useState<Record<string, string>>({});

  // Resultado del informe completo
  const [report, setReport] = useState<GeneratedSections | null>(null);
  const [fullRecState, setFullRecState] = useState<RecordingState>('idle');
  const { start, stop } = useAudioRecorder();

  // Carga de templates
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

  // Construir hallazgos HTML a partir de los textos por órgano
  const buildHallazgosHtml = () =>
    allOrgans
      .map((o) => {
        const t = organTexts[o.name];
        return t ? `<h2>${o.name}</h2><p>${t}</p>` : '';
      })
      .filter(Boolean)
      .join('');

  // Dictado completo (graba y manda todo junto)
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
        // Poblar textos por órgano con organFindings
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

  // Generar informe desde textos por órgano (sin re-dictar)
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

  // Copiar informe al portapapeles como texto plano
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
          {/* Selector de plantilla */}
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

          {/* Dictado completo */}
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

          {/* Órganos individuales */}
          {allOrgans.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Dictado por órgano</div>
              {allOrgans.map((organ) => (
                <OrganMicButton
                  key={organ.name}
                  organ={organ}
                  value={organTexts[organ.name] ?? ''}
                  onChange={(text) => handleOrganChange(organ.name, text)}
                  apiUrl={cfg.apiUrl}
                  apiKey={cfg.apiKey}
                />
              ))}
              <button onClick={handleGenerateFromOrgans} style={styles.secondaryBtn}>
                📄  Generar informe desde órganos
              </button>
            </div>
          )}

          {/* Vista previa del informe */}
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
        </>
      )}

      {!loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}
    </div>
  );
}

// ── Estilos inline (no requiere Tailwind) ────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px',
    color: '#e2e8f0',
    fontSize: '13px',
    height: '100%',
    overflowY: 'auto',
    background: '#1a1f2e',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #2d3748',
  },
  headerIcon: { fontSize: '18px' },
  headerTitle: { fontWeight: 700, fontSize: '15px', color: '#fff' },
  section: { marginBottom: '16px' },
  sectionTitle: {
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#90cdf4',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { display: 'block', marginBottom: '4px', fontSize: '12px', color: '#a0aec0' },
  select: {
    width: '100%',
    padding: '6px 8px',
    background: '#2d3748',
    color: '#e2e8f0',
    border: '1px solid #4a5568',
    borderRadius: '6px',
    fontSize: '13px',
  },
  primaryBtn: {
    width: '100%',
    padding: '10px',
    background: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
  },
  recordingBtn: { background: '#e53e3e', animation: 'pulse 1s infinite' },
  secondaryBtn: {
    width: '100%',
    padding: '8px',
    background: '#2d3748',
    color: '#90cdf4',
    border: '1px solid #4a5568',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    marginTop: '8px',
  },
  copyBtn: {
    fontSize: '11px',
    padding: '2px 8px',
    background: '#2d3748',
    color: '#a0aec0',
    border: '1px solid #4a5568',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  organRow: {
    marginBottom: '10px',
    background: '#2d3748',
    borderRadius: '8px',
    padding: '8px',
  },
  organHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  organName: { fontWeight: 600, color: '#e2e8f0', fontSize: '13px' },
  micBtn: {
    background: 'transparent',
    border: '1px solid #4a5568',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '2px 6px',
    color: '#e2e8f0',
  },
  micBtnActive: { background: '#e53e3e', border: '1px solid #e53e3e' },
  organTextarea: {
    width: '100%',
    padding: '6px',
    background: '#1a202c',
    color: '#e2e8f0',
    border: '1px solid #4a5568',
    borderRadius: '6px',
    fontSize: '12px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  reportSection: {
    marginBottom: '12px',
    background: '#2d3748',
    borderRadius: '8px',
    padding: '10px',
  },
  reportSectionTitle: {
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    color: '#90cdf4',
    marginBottom: '6px',
  },
  reportContent: {
    fontSize: '12px',
    lineHeight: 1.6,
    color: '#e2e8f0',
  },
  errorBanner: {
    background: '#742a2a',
    color: '#fc8181',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '12px',
  },
  errorText: { color: '#fc8181', fontSize: '11px', margin: '4px 0 0' },
  info: { color: '#a0aec0', fontSize: '12px', textAlign: 'center', padding: '20px 0' },
};
