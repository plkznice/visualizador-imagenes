import React from 'react';
import { FileText, Loader2, Save, CheckCircle } from 'lucide-react';
import { styles } from '../styles/PanelDictation.styles';

interface ReportActionsProps {
  hasContent: boolean;
  studyInstanceUID: string | undefined;
  generatingPdf: boolean;
  savingReport: boolean;
  reportSaved: boolean;
  onGeneratePdf: () => void;
  onSaveReport: () => void;
}

export function ReportActions({
  hasContent,
  studyInstanceUID,
  generatingPdf,
  savingReport,
  reportSaved,
  onGeneratePdf,
  onSaveReport,
}: ReportActionsProps) {
  return (
    <div style={{ ...styles.section, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        onClick={onGeneratePdf}
        disabled={generatingPdf || !hasContent}
        style={{
          ...styles.pdfBtn,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          ...(!hasContent ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
        }}
      >
        {generatingPdf
          ? <><Loader2 size={18} className="animate-spin" /> Generando PDF...</>
          : <><FileText size={18} /> Generar informe PDF</>}
      </button>

      <button
        onClick={onSaveReport}
        disabled={savingReport || !hasContent || !studyInstanceUID}
        style={{
          ...styles.pdfBtn,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: reportSaved ? '#16a34a' : '#1d4ed8',
          ...((!hasContent || !studyInstanceUID) ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
        }}
      >
        {savingReport
          ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
          : reportSaved
            ? <><CheckCircle size={18} /> Informe guardado</>
            : <><Save size={18} /> Guardar en servidor</>}
      </button>
    </div>
  );
}
