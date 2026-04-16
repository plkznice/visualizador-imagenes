/**
 * Componente funcional que muestra el título de un órgano junto a su
 * propio botón de micrófono y un área de texto para editar los hallazgos locales.
 */
import React, { useState } from 'react';
import { Mic, Square, Loader2, Plus } from 'lucide-react';
import { OrganPreset, RecordingState } from '../types/dictation';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { dictateOrgan } from '../services/dictationApi';
import { styles } from '../styles/PanelDictation.styles';

export function OrganMicButton({
  organ, // Datos básicos del órgano y sus keywords esperadas
  value, // Texto consolidado dictado o modificado a mano
  onChange, // Callback para notificar al padre sobre cambios en el valor de texto
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
  const [appendState, setAppendState] = useState<RecordingState>('idle');
  const [error, setError] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { start, stop } = useAudioRecorder();
  const { start: startAppend, stop: stopAppend } = useAudioRecorder();

  // Ajustar altura automáticamente cuando cambia el contenido
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  /**
   * Administra la lógica iterativa de "Grabar" -> "Cortar y procesar" -> "Devolver texto"
   */
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
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error en dictado');
      } finally {
        setState('idle');
      }
    }
  };

  const handleAppendClick = async () => {
    if (appendState === 'idle') {
      setError('');
      setAppendState('recording');
      await startAppend();
    } else if (appendState === 'recording') {
      setAppendState('processing');
      const audio = await stopAppend();
      try {
        const result = await dictateOrgan(apiUrl, apiKey, organ.name, organ.keywords, audio);
        onChange(value.trimEnd() + (value.trim() ? ' ' : '') + result.text);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error en dictado');
      } finally {
        setAppendState('idle');
      }
    }
  };

  return (
    <div style={{ ...styles.organRow, ...(value.trim() ? styles.organRowFilled : {}) }}>
      <div style={styles.organHeader}>
        <span style={styles.organName}>{organ.name}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón agregar (append) */}
          <button
            onClick={handleAppendClick}
            disabled={appendState === 'processing' || state !== 'idle'}
            title="Grabar y agregar al texto"
            style={{
              ...styles.micBtn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              opacity: state !== 'idle' ? 0.4 : 1,
              ...(appendState === 'recording' ? styles.micBtnActive : {}),
            }}
          >
            {appendState === 'processing' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : appendState === 'recording' ? (
              <Square size={14} fill="currentColor" />
            ) : (
              <>
                <Mic size={14} />
                <Plus size={10} style={{ position: 'absolute', bottom: 2, right: 2 }} />
              </>
            )}
          </button>

          {/* Botón grabar (reemplaza) */}
          <button
            onClick={handleClick}
            disabled={state === 'processing' || appendState !== 'idle'}
            style={{
              ...styles.micBtn,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: appendState !== 'idle' ? 0.4 : 1,
              ...(state === 'recording' ? styles.micBtnActive : {}),
            }}
            title="Grabar y reemplazar texto"
          >
            {state === 'processing' ? <Loader2 size={16} className="animate-spin" /> : state === 'recording' ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
          </button>
        </div>
      </div>

      {/* Caja de texto manual de los hallazgos */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...styles.organTextarea, overflow: 'hidden' }}
        placeholder={
          // Damos una pista al usuario sobre qué palabras claves activan al órgano
          organ.keywords.length > 0
            ? organ.keywords.map(kw => kw.keyword).join(' · ')
            : `Hallazgo de ${organ.name}...`
        }
        rows={2}
      />

      {/* Bandera sutil de error si llegara a fallar la conexión con este órgano */}
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}
