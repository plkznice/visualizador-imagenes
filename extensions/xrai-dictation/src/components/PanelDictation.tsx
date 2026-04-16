/**
 * Panel lateral de dictado XRAI para OHIF Viewer.
 * Componente presentacional — toda la lógica vive en useDictation.
 */
import React from 'react';
import { Mic, Square, Loader2, FileText, Plus, Save, CheckCircle } from 'lucide-react';
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
  } = useDictation();

  const hasContent =
    Object.values(organTexts).some(v => v.trim().length > 0) || conclusion.trim().length > 0;

  const conclusionRef = React.useRef<HTMLTextAreaElement>(null);
  const [patientInfo, setPatientInfo] = React.useState<{ name: string; dob: string; study: string; studyInstanceUID: string } | null>(null);

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
        const studyInstanceUID = instance.StudyInstanceUID || '';

        if (name || dob || study) {
          setPatientInfo({ name, dob, study, studyInstanceUID });
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Mic reemplazar */}
                  <button
                    onClick={handleConclusionReplace}
                    disabled={conclusionRecState === 'processing' || conclusionAppendState !== 'idle'}
                    title="Dictar conclusión (reemplaza)"
                    style={{
                      ...styles.micBtn,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: conclusionAppendState !== 'idle' ? 0.4 : 1,
                      ...(conclusionRecState === 'recording' ? styles.micBtnActive : {}),
                    }}
                  >
                    {conclusionRecState === 'processing' ? <Loader2 size={16} className="animate-spin" /> : conclusionRecState === 'recording' ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
                  </button>

                  {/* Mic agregar */}
                  <button
                    onClick={handleConclusionAppend}
                    disabled={conclusionAppendState === 'processing' || conclusionRecState !== 'idle'}
                    title="Dictar y agregar a conclusión"
                    style={{
                      ...styles.micBtn,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      opacity: conclusionRecState !== 'idle' ? 0.4 : 1,
                      ...(conclusionAppendState === 'recording' ? styles.micBtnActive : {}),
                    }}
                  >
                    {conclusionAppendState === 'processing' ? <Loader2 size={16} className="animate-spin" /> : conclusionAppendState === 'recording' ? <Square size={14} fill="currentColor" /> : (
                      <><Mic size={14} /><Plus size={10} style={{ position: 'absolute', bottom: 2, right: 2 }} /></>
                    )}
                  </button>
                </div>
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

          {/* Botones de informe PDF */}
          <div style={{ ...styles.section, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleGeneratePdf}
              disabled={generatingPdf || !hasContent}
              style={{
                ...styles.pdfBtn,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                ...(!hasContent ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
              }}
            >
              {generatingPdf ? <><Loader2 size={18} className="animate-spin" /> Generando PDF...</> : <><FileText size={18} /> Generar informe PDF</>}
            </button>

            <button
              onClick={() => handleSaveReport(patientInfo?.studyInstanceUID ?? '')}
              disabled={savingReport || !hasContent || !patientInfo?.studyInstanceUID}
              style={{
                ...styles.pdfBtn,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: reportSaved ? '#16a34a' : '#1d4ed8',
                ...((!hasContent || !patientInfo?.studyInstanceUID) ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
              }}
            >
              {savingReport
                ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                : reportSaved
                  ? <><CheckCircle size={18} /> Informe guardado</>
                  : <><Save size={18} /> Guardar en servidor</>
              }
            </button>
          </div>
        </>
      )}

      {!loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}

      {/* Footer sticky con botones Dictar / Detener */}
      {!loading && templates.length > 0 && (
        <div style={{ ...styles.pdfSection, display: 'flex', gap: '8px' }}>
          <button
            onClick={handleFullDictation}
            disabled={fullRecState !== 'idle'}
            style={{
              ...styles.primaryBtn,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: fullRecState !== 'idle' ? 0.5 : 1,
            }}
          >
            {fullRecState === 'processing'
              ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
              : <><Mic size={18} /> Dictar informe</>}
          </button>

          <button
            onClick={handleFullDictation}
            disabled={fullRecState !== 'recording'}
            style={{
              ...styles.primaryBtn,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: fullRecState === 'recording' ? '#dc2626' : undefined,
              opacity: fullRecState !== 'recording' ? 0.4 : 1,
            }}
          >
            <Square size={16} fill="currentColor" /> Detener
          </button>
        </div>
      )}
    </div>
  );
}
