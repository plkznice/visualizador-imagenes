import React, { useState } from 'react';
import { OrganPreset, RecordingState } from '../types/dictation';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { dictateOrgan } from '../services/dictationApi';
import { styles } from '../styles/PanelDictation.styles';

export function OrganMicButton({
  organ,
  value,
  onChange,
  apiUrl,
  apiKey,
}: {
  organ: OrganPreset;
  value: string;
  onChange: (text: string) => void;
  apiUrl: string;
  apiKey: string;
}) {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState('');
  const { start, stop } = useAudioRecorder();

  const handleClick = async () => {
    if (state === 'idle') {
      setError('');
      setState('recording');
      await start();
    } else if (state === 'recording') {
      setState('processing');
      const audio = await stop();
      try {
        const result = await dictateOrgan(apiUrl, apiKey, organ.name, organ.keywords, audio);
        onChange(result.text);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setState('idle');
      }
    }
  };

  return (
    <div style={styles.organRow}>
      <div style={styles.organHeader}>
        <span style={styles.organName}>{organ.name}</span>
        <button
          onClick={handleClick}
          disabled={state === 'processing'}
          style={{
            ...styles.micBtn,
            ...(state === 'recording' ? styles.micBtnActive : {}),
          }}
          title={state === 'idle' ? 'Grabar' : state === 'recording' ? 'Detener' : 'Procesando...'}
        >
          {state === 'processing' ? '⏳' : state === 'recording' ? '⏹' : '🎤'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.organTextarea}
        placeholder={
          organ.keywords.length > 0
            ? organ.keywords.map((kw) => kw.keyword).join(' · ')
            : `Hallazgo de ${organ.name}...`
        }
        rows={2}
      />
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}
