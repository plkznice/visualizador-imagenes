/**
 * Panel lateral de dictado XRAI.
 * Componente orquestador — compone sub-componentes y delega lógica a hooks.
 */
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useSystem } from '@ohif/core';
import { useDictation } from '../hooks/useDictation';
import { useStudyPatientInfo } from '../hooks/useStudyPatientInfo';
import { useExistingReport } from '../hooks/useExistingReport';
import { OrganMicButton } from './OrganMicButton';
import { PanelHeader } from './PanelHeader';
import { ConclusionSection } from './ConclusionSection';
import { ReportActions } from './ReportActions';
import { RecordingFooter } from './RecordingFooter';
import { styles } from '../styles/PanelDictation.styles';

export default function PanelDictation() {
  // Obtenemos los servicios de OHIF para extraer datos del paciente activo
  const { servicesManager } = useSystem();
  const patientInfo = useStudyPatientInfo(servicesManager);

  // Hook orquestador principal: maneja todos los estados del dictado (plantillas, textos, conclusión, estados de grabación)
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
    conclusionReplaceState,
    conclusionAppendState,
    handleConclusionReplace,
    handleConclusionAppend,
    handleGeneratePdf,
    handleSaveReport,
  } = useDictation();

  // Verificamos si ya existe un informe en el servidor para este estudio para bloquear la edición si es necesario
  const { exists: reportExists, checking: checkingReport } = useExistingReport(
    cfg,
    patientInfo?.studyInstanceUID
  );

  // Verificamos si hay algún texto ingresado para habilitar/deshabilitar los botones de guardado
  const hasContent =
    Object.values(organTexts).some(v => v.trim().length > 0) || conclusion.trim().length > 0;

  return (
    <div style={styles.container}>
      <PanelHeader
        selectedTemplate={selectedTemplate}
        patientInfo={patientInfo}
      />

      {checkingReport && <div style={styles.info}>Verificando informe...</div>}

      {!checkingReport && reportExists && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '32px 16px',
          textAlign: 'center',
        }}>
          <CheckCircle size={48} color="#16a34a" />
          <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600 }}>
            El informe ya fue generado
          </div>
          <div style={{ color: '#8896b0', fontSize: '13px' }}>
            Este estudio ya tiene un informe guardado en el servidor.
          </div>
        </div>
      )}

      {!checkingReport && !reportExists && error && <div style={styles.errorBanner}>{error}</div>}
      {!checkingReport && !reportExists && loading && <div style={styles.info}>Cargando plantillas...</div>}

      {!checkingReport && !reportExists && !loading && templates.length > 0 && (
        <>
          {/* Selector de plantilla de informe */}
          <div style={styles.section}>
            <label style={styles.label}>Plantilla</label>
            <select
              value={selectedId}
              onChange={e => handleTemplateChange(e.target.value)}
              style={styles.select}
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Renderizado dinámico de los campos de dictado por órgano según la plantilla seleccionada */}
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

          {/* Sección de conclusión, siempre visible cuando hay una plantilla */}
          <ConclusionSection
            conclusion={conclusion}
            onConclusionChange={handleConclusionChange}
            replaceState={conclusionReplaceState}
            appendState={conclusionAppendState}
            onReplace={handleConclusionReplace}
            onAppend={handleConclusionAppend}
          />

          {/* Botones de acción final: Generar PDF o Guardar en servidor */}
          <ReportActions
            hasContent={hasContent}
            studyInstanceUID={patientInfo?.studyInstanceUID}
            generatingPdf={generatingPdf}
            savingReport={savingReport}
            reportSaved={reportSaved}
            onGeneratePdf={handleGeneratePdf}
            onSaveReport={() => handleSaveReport(patientInfo?.studyInstanceUID ?? '')}
          />
        </>
      )}

      {!checkingReport && !reportExists && !loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}

      {/* Botón flotante/footer para grabar el informe completo de una sola vez */}
      {!checkingReport && !reportExists && !loading && templates.length > 0 && (
        <RecordingFooter
          state={fullRecState}
          onToggle={handleFullDictation}
        />
      )}
    </div>
  );
}
