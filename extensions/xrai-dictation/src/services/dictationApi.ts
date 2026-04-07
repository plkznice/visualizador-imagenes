import { Template, TemplateSection, GeneratedSections, OrganKeyword } from '../types/dictation';

export async function fetchTemplates(apiUrl: string, apiKey: string, clinicId: string): Promise<Template[]> {
  const res = await fetch(`${apiUrl}/api/ext/templates?clinicId=${clinicId}`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) throw new Error('Error al cargar plantillas');
  return res.json();
}

export async function dictateOrgan(
  apiUrl: string,
  apiKey: string,
  organName: string,
  keywords: OrganKeyword[],
  audio: Blob
): Promise<{ text: string; transcript: string }> {
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

export async function dictateFull(
  apiUrl: string,
  apiKey: string,
  sections: TemplateSection[],
  audio: Blob
): Promise<{ generatedSections: GeneratedSections; organFindings: Record<string, string>; transcript: string }> {
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

export async function generatePdfReport(
  apiUrl: string,
  apiKey: string,
  studyName: string,
  htmlContent: string,
  conclusion: string
): Promise<Blob> {
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
  return res.blob();
}
