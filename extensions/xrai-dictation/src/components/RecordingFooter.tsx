import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { RecordingState } from '../types/dictation';
import { styles } from '../styles/PanelDictation.styles';

interface RecordingFooterProps {
  state: RecordingState;
  onToggle: () => void;
}

export function RecordingFooter({ state, onToggle }: RecordingFooterProps) {
  return (
    <div style={{ ...styles.pdfSection, display: 'flex', gap: '8px' }}>
      <button
        onClick={onToggle}
        disabled={state !== 'idle'}
        style={{
          ...styles.primaryBtn,
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: state !== 'idle' ? 0.5 : 1,
        }}
      >
        {state === 'processing'
          ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
          : <><Mic size={18} /> Dictar informe</>}
      </button>

      <button
        onClick={onToggle}
        disabled={state !== 'recording'}
        style={{
          ...styles.primaryBtn,
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: state === 'recording' ? '#dc2626' : undefined,
          opacity: state !== 'recording' ? 0.4 : 1,
        }}
      >
        <Square size={16} fill="currentColor" /> Detener
      </button>
    </div>
  );
}
