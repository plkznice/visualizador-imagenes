import React from 'react';
import { Template } from '../types/dictation';
import { StudyPatientInfo } from '../hooks/useStudyPatientInfo';
import { styles } from '../styles/PanelDictation.styles';

interface PanelHeaderProps {
  selectedTemplate: Template | null;
  patientInfo: StudyPatientInfo | null;
}

export function PanelHeader({ selectedTemplate, patientInfo }: PanelHeaderProps) {
  return (
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
  );
}
