/**
 * Hook personalizado para manejar la grabación de audio desde el micrófono.
 * Encapsula la API MediaRecorder del navegador para mantener limpio el código de la UI.
 */
import { useRef, useCallback } from 'react';

export function useAudioRecorder() {
  // Mantenemos la instancia del grabador y los trozos de audio sin provocar re-renders formales
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /**
   * Pide permisos de micrófono y comienza a escuchar el audio.
   */
  const start = useCallback(async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];

    // Cada vez que hay datos disponibles, los guardamos
    mr.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.start();
    mediaRef.current = mr;
  }, []);

  /**
   * Detiene la grabación, libera el recurso de micrófono y devuelve el archivo resultante.
   */
  const stop = useCallback((): Promise<Blob> => {
    return new Promise(resolve => {
      const mr = mediaRef.current;
      if (!mr) {
        resolve(new Blob());
        return;
      }

      mr.onstop = () => {
        // Juntamos todos los fragmentos en un solo archivo WebM
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });

        // Detener todas las pistas libera el micrófono en el navegador (quita el ícono de grabación)
        mr.stream.getTracks().forEach(t => t.stop());
        resolve(blob);
      };

      mr.stop();
    });
  }, []);

  return { start, stop };
}
