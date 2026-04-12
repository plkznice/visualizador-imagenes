/**
 * Panel lateral de dictado XRAI para OHIF Viewer.
 * Componente presentacional — toda la lógica vive en useDictation.
 */
import React from 'react';
import { useDictation } from '../hooks/useDictation';
import { OrganMicButton } from './OrganMicButton';
import { styles } from '../styles/PanelDictation.styles';

import { utils, useSystem } from '@ohif/core';

export default function PanelDictation() {
  const { servicesManager } = useSystem();
  
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

  const conclusionRef = React.useRef<HTMLTextAreaElement>(null);
  const [patientInfo, setPatientInfo] = React.useState<{ name: string; dob: string; study: string } | null>(null);

  React.useEffect(() => {
    if (conclusionRef.current) {
      conclusionRef.current.style.height = 'auto';
      conclusionRef.current.style.height = `${conclusionRef.current.scrollHeight}px`;
    }
  }, [conclusion]);

  React.useEffect(() => {
    if (!servicesManager) return;
    const { displaySetService } = servicesManager.services;
    if (!displaySetService) return;

    const extractAndSet = (displaySet: any) => {
      const instance = displaySet?.instances?.[0] || displaySet?.instance;
      if (instance) {
        const name = instance.PatientName ? utils.formatPN(instance.PatientName) : '';
        const dob = instance.PatientBirthDate ? utils.formatDate(instance.PatientBirthDate) : '';
        const study = instance.StudyDescription || '';
        
        if (name || dob || study) {
          setPatientInfo({ name, dob, study });
          return true;
        }
      }
      return false;
    };

    const tryFetchName = () => {
      const dSets = displaySetService.getActiveDisplaySets();
      if (dSets && dSets.length > 0) {
        extractAndSet(dSets[0]);
      }
    };

    tryFetchName();

    const subscription = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      (event: any) => {
        if (event && event.displaySetsAdded && event.displaySetsAdded.length > 0) {
          extractAndSet(event.displaySetsAdded[0]);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [servicesManager]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <span style={{ ...styles.headerTitle, fontSize: '24px' }}>Creación Informe</span>
          {patientInfo && (
            <div style={{ fontSize: '13px', color: '#8896b0', marginTop: '6px', lineHeight: 1.5 }}>
              <div><strong>Paciente:</strong> {patientInfo.name || '-'}</div>
              <div><strong>Fecha nac:</strong> {patientInfo.dob || '-'}</div>
              <div><strong>Estudio:</strong> {selectedTemplate?.name || patientInfo.study || '-'}</div>
            </div>
          )}
        </div>
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
                ref={conclusionRef}
                value={conclusion}
                onChange={e => handleConclusionChange(e.target.value)}
                style={{ ...styles.conclusionTextarea, overflow: 'hidden' }}
                placeholder="Escribí o dictá la conclusión del informe..."
                rows={3}
              />
            </div>
          </div>

          {/* Botón generar informe PDF (movido debajo de la conclusión) */}
          <div style={styles.section}>
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
        </>
      )}

      {!loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}

      {/* Footer sticky con botón Dictar Completo (movido al pie) */}
      {!loading && templates.length > 0 && (
        <div style={styles.pdfSection}>
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
      )}
    </div>
  );
}
