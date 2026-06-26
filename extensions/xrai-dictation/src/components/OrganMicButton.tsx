/**
 * Muestra un órgano con sus dos botones de micrófono (reemplazar / agregar)
 * y un textarea editable para los hallazgos.
 */
import React from 'react';
import { Mic, Square, Loader2, Plus } from 'lucide-react';
import { OrganPreset } from '../types/dictation';
import { useRecordingFlow } from '../hooks/useRecordingFlow';
import { dictateOrgan } from '../services/dictationApi';
import { styles } from '../styles/PanelDictation.styles';

interface OrganMicButtonProps {
  organ: OrganPreset;
  value: string;
  onChange: (text: string) => void;
  apiUrl: string;
  apiKey: string;
}

export function OrganMicButton({ organ, value, onChange, apiUrl, apiKey }: OrganMicButtonProps) {
  const [error, setError] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const replace = useRecordingFlow({
    onProcess: (audio) => dictateOrgan(apiUrl, apiKey, organ.name, organ.keywords, audio),
    onSuccess: (result) => onChange(result.text),
    onError: setError,
  });

  const append = useRecordingFlow({
    onProcess: (audio) => dictateOrgan(apiUrl, apiKey, organ.name, organ.keywords, audio),
    onSuccess: (result) =>
      onChange(value.trimEnd() + (value.trim() ? ' ' : '') + result.text),
    onError: setError,
  });

  return (
    <div style={{ ...styles.organRow, ...(value.trim() ? styles.organRowFilled : {}) }}>
      <div style={styles.organHeader}>
        <span style={styles.organName}>{organ.name}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Agregar al texto */}
          <button
            onClick={append.toggle}
            disabled={append.state === 'processing' || replace.state !== 'idle'}
            title="Grabar y agregar al texto"
            style={{
              ...styles.micBtn,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              opacity: replace.state !== 'idle' ? 0.4 : 1,
              ...(append.state === 'recording' ? styles.micBtnActive : {}),
            }}
          >
            {append.state === 'processing'
              ? <Loader2 size={16} className="animate-spin" />
              : append.state === 'recording'
                ? <Square size={14} fill="currentColor" />
                : <><Mic size={14} /><Plus size={10} style={{ position: 'absolute', bottom: 2, right: 2 }} /></>}
          </button>

          {/* Reemplazar texto */}
          <button
            onClick={replace.toggle}
            disabled={replace.state === 'processing' || append.state !== 'idle'}
            title="Grabar y reemplazar texto"
            style={{
              ...styles.micBtn,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: append.state !== 'idle' ? 0.4 : 1,
              ...(replace.state === 'recording' ? styles.micBtnActive : {}),
            }}
          >
            {replace.state === 'processing'
              ? <Loader2 size={16} className="animate-spin" />
              : replace.state === 'recording'
                ? <Square size={14} fill="currentColor" />
                : <Mic size={16} />}
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...styles.organTextarea, overflow: 'hidden' }}
        placeholder={
          organ.keywords.length > 0
            ? organ.keywords.map(kw => kw.keyword).join(' · ')
            : `Hallazgo de ${organ.name}...`
        }
        rows={2}
      />

      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}
