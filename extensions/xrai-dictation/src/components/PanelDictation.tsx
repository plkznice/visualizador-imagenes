import React from 'react';
import { useDictation } from '../hooks/useDictation';
import { OrganMicButton } from './OrganMicButton';
import { styles } from '../styles/PanelDictation.styles';

export default function PanelDictation() {
  const {
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
  } = useDictation();

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
              onChange={(e) => handleTemplateChange(e.target.value)}
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
                  apiUrl={cfg.apiUrl}
                  apiKey={cfg.apiKey}
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
