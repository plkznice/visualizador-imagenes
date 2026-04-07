/**
 * Componente Orquestador Principal (Smart Component).
 * Este componente es principalmente "visual" (View). Depende de `useDictation` 
 * para encargarse de toda la inteligencia operacional y estado.
 */
import React from 'react';
import { useDictation } from '../hooks/useDictation';
import { OrganMicButton } from './OrganMicButton';
import { styles } from '../styles/PanelDictation.styles';

export default function PanelDictation() {
  // Extraemos todos los métodos y propiedades computadas provenientes de nuestro orquestador
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
      {/* Título de la Extensión */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>🧠</span>
        <span style={styles.headerTitle}>XRAI Dictado</span>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {loading && <div style={styles.info}>Cargando plantillas...</div>}

      {/* Cuando tenemos plantillas listas, mostramos toda la UI interactiva */}
      {!loading && templates.length > 0 && (
        <>
          {/* Selector principal de la plantilla */}
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

          {/* Botón dominante para hacer un "Pase entero" del dictado */}
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

          {/* Listado dinámico construyendo la colección de órganos editables independientes */}
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

          {/* Renderizado de Previsualización: Presenta de forma estática los resultados ensamblados de la IA */}
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

          {/* Generador Estático Fijo debajo (Floating Bar) */}
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

      {/* Banner inofensivo de estado vacío (Empty State) */}
      {!loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}
    </div>
  );
}
