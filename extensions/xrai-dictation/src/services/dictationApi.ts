/**
 * Servicios de comunicación con la API externa (Backend XRAI).
 * Separa la lógica de peticiones HTTP de los componentes visuales de React.
 */
import { Template, TemplateSection, GeneratedSections, OrganKeyword } from '../types/dictation';

/**
 * Obtiene la lista de plantillas disponibles para una clínica específica.
 */
export async function fetchTemplates(
  apiUrl: string,
  apiKey: string,
  clinicId: string
): Promise<Template[]> {
  const res = await fetch(`${apiUrl}/api/ext/templates?clinicId=${clinicId}`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) throw new Error('Error al cargar plantillas');
  return res.json();
}

/**
 * Envía el audio grabado para un solo órgano a la IA para que procese el dictado.
 */
export async function dictateOrgan(
  apiUrl: string,
  apiKey: string,
  organName: string,
  keywords: OrganKeyword[],
  audio: Blob
): Promise<{ text: string; transcript: string }> {
  // Utilizamos FormData para enviar el archivo de audio (.webm)
  const fd = new FormData();
  fd.append('organName', organName);
  fd.append('keywords', JSON.stringify(keywords));
  fd.append('audio', new File([audio], 'audio.webm', { type: audio.type }));

  const res = await fetch(`${apiUrl}/api/ext/dictation`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? 'Error en dictado');
  }
  return res.json();
}

/**
 * Envía la grabación completa para todo el informe,
 * encargando a la IA que distribuya el texto en las diferentes secciones y órganos.
 */
export async function dictateFull(
  apiUrl: string,
  apiKey: string,
  sections: TemplateSection[],
  audio: Blob
): Promise<{
  generatedSections: GeneratedSections;
  organFindings: Record<string, string>;
  transcript: string;
}> {
  const fd = new FormData();
  fd.append('sections', JSON.stringify(sections));
  fd.append('audio', new File([audio], 'audio.webm', { type: audio.type }));

  const res = await fetch(`${apiUrl}/api/ext/dictation`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? 'Error en dictado');
  }
  return res.json();
}

/**
 * Envía los datos del informe al servidor para que genere el PDF y lo guarde
 * como DICOM Encapsulated PDF en Orthanc. El PDF se genera server-side.
 */
export async function saveReportToServer(
  apiUrl: string,
  apiKey: string,
  params: {
    studyInstanceUID: string
    clinicId: string
    studyName: string
    htmlContent: string
    conclusion: string
  }
): Promise<void> {
  const fd = new FormData()
  fd.append('studyInstanceUID', params.studyInstanceUID)
  fd.append('clinicId', params.clinicId)
  fd.append('studyName', params.studyName)
  fd.append('htmlContent', params.htmlContent)
  fd.append('conclusion', params.conclusion)

  const res = await fetch(`${apiUrl}/api/ext/save-report`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: fd,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Error guardando el informe')
  }
}

/**
 * Envía el contenido HTML estructurado del reporte para que la API
 * lo convierta en un archivo PDF descargable.
 */
export async function generatePdfReport(
  apiUrl: string,
  apiKey: string,
  studyName: string,
  htmlContent: string,
  conclusion: string
): Promise<Blob> {
  // Creamos el body con los datos del paciente mockeados y el contenido real
  const body = {
    clinicName: 'Bio Imágenes Mendoza',
    clinicAddress: '',
    clinicPhone: '',
    patientName: 'Paciente',
    patientDoc: '-',
    patientAge: '-',
    studyName,
    date: new Date().toLocaleDateString('es-AR'),
    htmlContent,
    conclusion,
    doctorName: 'Médico',
  };

  const res = await fetch(`${apiUrl}/api/ext/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Error generando el PDF');
  return res.blob(); // Devolvemos el archivo binario
}
