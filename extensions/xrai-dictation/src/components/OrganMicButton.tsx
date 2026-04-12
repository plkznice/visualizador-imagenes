/**
 * Componente funcional que muestra el título de un órgano junto a su
 * propio botón de micrófono y un área de texto para editar los hallazgos locales.
 */
import React, { useState } from 'react';
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
  // Estado local para gobernar solo este botón, sin recargar toda la plantilla entera.
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState('');

  // Utiliza un grabador de forma aislada
  const { start, stop } = useAudioRecorder();

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

  return (
    <div style={{ ...styles.organRow, ...(value.trim() ? styles.organRowFilled : {}) }}>
      <div style={styles.organHeader}>
        <span style={styles.organName}>{organ.name}</span>

        {/* Botón de micrófono interactivo */}
        <button
          onClick={handleClick}
          disabled={state === 'processing'}
          style={{
            ...styles.micBtn,
            // Aplicamos un color rojo de advertencia si está grabando
            ...(state === 'recording' ? styles.micBtnActive : {}),
          }}
          title={state === 'idle' ? 'Grabar' : state === 'recording' ? 'Detener' : 'Procesando...'}
        >
          {state === 'processing' ? '⏳' : state === 'recording' ? '⏹' : '🎤'}
        </button>
      </div>

      {/* Caja de texto manual de los hallazgos */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        style={styles.organTextarea}
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
