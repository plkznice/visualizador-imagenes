/**
 * Panel lateral de dictado XRAI para OHIF Viewer.
 * Componente presentacional — toda la lógica vive en useDictation.
 */
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
    conclusion,
    fullRecState,
    generatingPdf,
    selectedTemplate,
    allOrgans,
    handleTemplateChange,
    handleOrganChange,
    handleConclusionChange,
    handleFullDictation,
    handleGeneratePdf,
  } = useDictation();

  const hasContent =
    Object.values(organTexts).some(v => v.trim().length > 0) || conclusion.trim().length > 0;

  return (
    <div style={styles.container}>
      {/* Header */}
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
              onChange={e => handleTemplateChange(e.target.value)}
              style={styles.select}
            >
              {templates.map(t => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botón dictar completo */}
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

          {/* Órganos */}
          {allOrgans.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Dictado por órgano</div>
              {allOrgans.map(organ => (
                <OrganMicButton
                  key={organ.name}
                  organ={organ}
                  value={organTexts[organ.name] ?? ''}
                  onChange={text => handleOrganChange(organ.name, text)}
                  apiUrl={cfg.apiUrl}
                  apiKey={cfg.apiKey}
                />
              ))}
            </div>
          )}

          {/* Conclusiones */}
          <div style={styles.section}>
            <div style={styles.conclusionRow}>
              <div style={styles.conclusionHeader}>
                <span style={styles.conclusionLabel}>Conclusión</span>
              </div>
              <textarea
                value={conclusion}
                onChange={e => handleConclusionChange(e.target.value)}
                style={styles.conclusionTextarea}
                placeholder="Escribí o dictá la conclusión del informe..."
                rows={3}
              />
            </div>
          </div>
        </>
      )}

      {!loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}

      {/* Footer sticky con botón PDF */}
      {!loading && templates.length > 0 && (
        <div style={styles.pdfSection}>
          <button
            onClick={handleGeneratePdf}
            disabled={generatingPdf || !hasContent}
            style={{
              ...styles.pdfBtn,
              ...(!hasContent ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
            }}
          >
            {generatingPdf ? '⏳  Generando PDF...' : '📄  Generar informe PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
