/**
 * Panel lateral de dictado XRAI.
 * Componente orquestador — compone sub-componentes y delega lógica a hooks.
 */
import React from 'react';
import { useSystem } from '@ohif/core';
import { useDictation } from '../hooks/useDictation';
import { useStudyPatientInfo } from '../hooks/useStudyPatientInfo';
import { OrganMicButton } from './OrganMicButton';
import { PanelHeader } from './PanelHeader';
import { ConclusionSection } from './ConclusionSection';
import { ReportActions } from './ReportActions';
import { RecordingFooter } from './RecordingFooter';
import { styles } from '../styles/PanelDictation.styles';

export default function PanelDictation() {
  const { servicesManager } = useSystem();
  const patientInfo = useStudyPatientInfo(servicesManager);

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

  const hasContent =
    Object.values(organTexts).some(v => v.trim().length > 0) || conclusion.trim().length > 0;

  return (
    <div style={styles.container}>
      <PanelHeader
        selectedTemplate={selectedTemplate}
        patientInfo={patientInfo}
      />

      {error && <div style={styles.errorBanner}>{error}</div>}
      {loading && <div style={styles.info}>Cargando plantillas...</div>}

      {!loading && templates.length > 0 && (
        <>
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

          <ConclusionSection
            conclusion={conclusion}
            onConclusionChange={handleConclusionChange}
            replaceState={conclusionReplaceState}
            appendState={conclusionAppendState}
            onReplace={handleConclusionReplace}
            onAppend={handleConclusionAppend}
          />

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

      {!loading && templates.length === 0 && !error && (
        <div style={styles.info}>No hay plantillas configuradas en XRAI.</div>
      )}

      {!loading && templates.length > 0 && (
        <RecordingFooter
          state={fullRecState}
          onToggle={handleFullDictation}
        />
      )}
    </div>
  );
}
