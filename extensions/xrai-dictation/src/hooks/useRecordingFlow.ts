/**
 * Abstrae el ciclo de vida de una grabación de audio:
 * idle → recording → processing → idle
 *
 * Recibe callbacks para procesar el audio, manejar el resultado y los errores,
 * y devuelve el estado actual y una función toggle para iniciar/detener la grabación.
 */
import { useState, useEffect, useRef } from 'react';
import { RecordingState } from '../types/dictation';
import { useAudioRecorder } from './useAudioRecorder';

interface UseRecordingFlowOptions<T> {
  onProcess: (audio: Blob) => Promise<T>;
  onSuccess: (result: T) => void;
  onError: (message: string) => void;
}

export function useRecordingFlow<T>({
  onProcess,
  onSuccess,
  onError,
}: UseRecordingFlowOptions<T>) {
  const [state, setState] = useState<RecordingState>('idle');
  const { start, stop } = useAudioRecorder();

  // Refs para evitar closures obsoletas cuando los callbacks cambian entre renders
  const onProcessRef = useRef(onProcess);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onProcessRef.current = onProcess;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const toggle = async () => {
    if (state === 'idle') {
      setState('recording');
      await start();
    } else if (state === 'recording') {
      setState('processing');
      const audio = await stop();
      try {
        const result = await onProcessRef.current(audio);
        onSuccessRef.current(result);
      } catch (e: unknown) {
        onErrorRef.current(e instanceof Error ? e.message : 'Error en dictado');
      } finally {
        setState('idle');
      }
    }
  };

  return { state, toggle };
}
