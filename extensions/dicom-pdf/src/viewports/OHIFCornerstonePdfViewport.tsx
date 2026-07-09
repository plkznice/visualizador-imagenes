import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useViewportRef } from '@ohif/core';
import './OHIFCornerstonePdfViewport.css';

/** Busca la primera aparición de `needle` dentro de `haystack` a partir de `from`. */
function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/**
 * El plugin DICOMweb de Orthanc ignora el `?accept=application/pdf` singlepart y
 * siempre responde `multipart/related`, con el PDF envuelto en una parte MIME:
 *
 *   --<boundary>\r\n
 *   Content-Type: application/octet-stream\r\n ... \r\n\r\n
 *   %PDF-1.4 ...            ← bytes reales del PDF
 *   \r\n--<boundary>--\r\n
 *
 * Extraemos únicamente los bytes del PDF. Si la respuesta no es multipart, se
 * devuelve el buffer tal cual.
 */
function extractPdfBytes(buffer: ArrayBuffer, contentType: string): Uint8Array {
  const bytes = new Uint8Array(buffer);
  if (!contentType || !contentType.includes('multipart/related')) {
    return bytes;
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch && (boundaryMatch[1] || boundaryMatch[2])?.trim();
  if (!boundary) {
    return bytes;
  }

  const encoder = new TextEncoder();
  // Separador entre los headers de la parte y su cuerpo.
  const headerSep = encoder.encode('\r\n\r\n');
  // Delimitador de cierre de la parte: \r\n--<boundary>
  const closing = encoder.encode(`\r\n--${boundary}`);

  const headerEnd = indexOfBytes(bytes, headerSep);
  if (headerEnd === -1) {
    return bytes;
  }
  const bodyStart = headerEnd + headerSep.length;
  const bodyEnd = indexOfBytes(bytes, closing, bodyStart);

  return bytes.subarray(bodyStart, bodyEnd === -1 ? bytes.length : bodyEnd);
}

function OHIFCornerstonePdfViewport({ displaySets, viewportId = 'pdf-viewport' }) {
  const [url, setUrl] = useState(null);
  const viewportElementRef = useRef(null);
  const viewportRef = useViewportRef(viewportId);

  useEffect(() => {
    document.body.addEventListener('drag', makePdfDropTarget);
    return function cleanup() {
      document.body.removeEventListener('drag', makePdfDropTarget);
      viewportRef.unregister();
    };
  }, []);

  const [style, setStyle] = useState('pdf-yes-click');

  const makePdfScrollable = () => {
    setStyle('pdf-yes-click');
  };

  const makePdfDropTarget = () => {
    setStyle('pdf-no-click');
  };

  if (displaySets && displaySets.length > 1) {
    throw new Error(
      'OHIFCornerstonePdfViewport: only one display set is supported for dicom pdf right now'
    );
  }

  const { renderedUrl } = displaySets[0];

  useEffect(() => {
    let objectUrl: string | null = null;

    const load = async () => {
      const rawUrl = await renderedUrl;
      if (!rawUrl) return;

      try {
        const response = await fetch(rawUrl, {
          headers: { Accept: 'application/pdf' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        const pdfBytes = extractPdfBytes(buffer, response.headers.get('content-type') || '');
        objectUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
        setUrl(objectUrl);
      } catch (e) {
        console.error('PDF load failed:', e);
      }
    };

    load();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [renderedUrl]);

  return (
    <div
      className="bg-primary-black text-foreground h-full w-full"
      onClick={makePdfScrollable}
      ref={el => {
        viewportElementRef.current = el;
        if (el) {
          viewportRef.register(el);
        }
      }}
      data-viewport-id={viewportId}
    >
      {url ? (
        <iframe
          src={url}
          className={style}
          title="PDF Viewer"
          style={{ border: 'none', width: '100%', height: '100%' }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white">Cargando PDF...</div>
      )}
    </div>
  );
}

OHIFCornerstonePdfViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
  viewportId: PropTypes.string,
};

export default OHIFCornerstonePdfViewport;
