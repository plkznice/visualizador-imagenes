import React from 'react';
import { Mic, Square, Loader2, Plus } from 'lucide-react';
import { RecordingState } from '../types/dictation';
import { styles } from '../styles/PanelDictation.styles';

interface ConclusionSectionProps {
  conclusion: string;
  onConclusionChange: (text: string) => void;
  replaceState: RecordingState;
  appendState: RecordingState;
  onReplace: () => void;
  onAppend: () => void;
}

export function ConclusionSection({
  conclusion,
  onConclusionChange,
  replaceState,
  appendState,
  onReplace,
  onAppend,
}: ConclusionSectionProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [conclusion]);

  return (
    <div style={styles.section}>
      <div style={styles.conclusionRow}>
        <div style={styles.conclusionHeader}>
          <span style={styles.conclusionLabel}>Conclusión</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onReplace}
              disabled={replaceState === 'processing' || appendState !== 'idle'}
              title="Dictar conclusión (reemplaza)"
              style={{
                ...styles.micBtn,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: appendState !== 'idle' ? 0.4 : 1,
                ...(replaceState === 'recording' ? styles.micBtnActive : {}),
              }}
            >
              {replaceState === 'processing'
                ? <Loader2 size={16} className="animate-spin" />
                : replaceState === 'recording'
                  ? <Square size={14} fill="currentColor" />
                  : <Mic size={16} />}
            </button>

            <button
              onClick={onAppend}
              disabled={appendState === 'processing' || replaceState !== 'idle'}
              title="Dictar y agregar a conclusión"
              style={{
                ...styles.micBtn,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                opacity: replaceState !== 'idle' ? 0.4 : 1,
                ...(appendState === 'recording' ? styles.micBtnActive : {}),
              }}
            >
              {appendState === 'processing'
                ? <Loader2 size={16} className="animate-spin" />
                : appendState === 'recording'
                  ? <Square size={14} fill="currentColor" />
                  : <><Mic size={14} /><Plus size={10} style={{ position: 'absolute', bottom: 2, right: 2 }} /></>}
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={conclusion}
          onChange={e => onConclusionChange(e.target.value)}
          style={{ ...styles.conclusionTextarea, overflow: 'hidden' }}
          placeholder="Escribí o dictá la conclusión del informe..."
          rows={3}
        />
      </div>
    </div>
  );
}
