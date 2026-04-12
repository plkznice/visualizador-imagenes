/**
 * Diccionario centralizado de estilos del panel lateral XRAI.
 * CSS-in-JS con objetos estáticos — sin dependencia de Tailwind.
 */
import type { CSSProperties } from 'react';

const COLOR = {
  bg: '#0f1117',
  surface: '#1a1f2e',
  card: '#1e2535',
  cardHover: '#242c3d',
  border: '#2a3347',
  borderLight: '#334166',
  accent: '#4f8ef7',
  accentDim: '#1e3a6e',
  conclusion: '#f59e0b',
  conclusionDim: '#3d2a06',
  success: '#34d399',
  error: '#f87171',
  errorBg: '#2d1515',
  textPrimary: '#e8edf5',
  textSecondary: '#8896b0',
  textMuted: '#4d5f7a',
};

export const styles: Record<string, CSSProperties> = {
  container: {
    padding: '14px 12px',
    color: COLOR.textPrimary,
    fontSize: '13px',
    height: '100%',
    overflowY: 'auto',
    background: COLOR.bg,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLOR.border}`,
  },
  headerIcon: { fontSize: '16px' },
  headerTitle: { fontWeight: 700, fontSize: '14px', color: COLOR.textPrimary, letterSpacing: '-0.01em' },

  // ── Layout ────────────────────────────────────────────────────────────────
  section: { marginBottom: '18px' },
  sectionTitle: {
    fontWeight: 600,
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: COLOR.textMuted,
    marginBottom: '10px',
  },
  label: { display: 'block', marginBottom: '5px', fontSize: '11px', color: COLOR.textSecondary },

  // ── Selector de plantilla ─────────────────────────────────────────────────
  select: {
    width: '100%',
    padding: '8px 10px',
    background: COLOR.card,
    color: COLOR.textPrimary,
    border: `1px solid ${COLOR.border}`,
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },

  // ── Botón primario (dictar completo) ──────────────────────────────────────
  primaryBtn: {
    width: '100%',
    padding: '10px',
    background: COLOR.accentDim,
    color: COLOR.accent,
    border: `1px solid ${COLOR.accent}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '0.01em',
  },
  recordingBtn: {
    background: '#3d1515',
    color: COLOR.error,
    border: `1px solid ${COLOR.error}`,
  },

  // ── Card de órgano ────────────────────────────────────────────────────────
  organRow: {
    marginBottom: '8px',
    background: COLOR.card,
    borderRadius: '8px',
    padding: '10px',
    borderLeft: `3px solid ${COLOR.border}`,
  },
  organRowFilled: {
    borderLeft: `3px solid ${COLOR.success}`,
  },
  organHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '7px',
  },
  organName: { fontWeight: 600, color: COLOR.textPrimary, fontSize: '13px' },
  micBtn: {
    background: 'transparent',
    border: `1px solid ${COLOR.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '3px 8px',
    color: COLOR.textSecondary,
    lineHeight: 1,
  },
  micBtnActive: {
    background: '#3d1515',
    border: `1px solid ${COLOR.error}`,
    color: COLOR.error,
  },
  organTextarea: {
    width: '100%',
    padding: '6px 8px',
    background: COLOR.surface,
    color: COLOR.textPrimary,
    border: `1px solid ${COLOR.border}`,
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: 1.5,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },

  // ── Card de conclusiones ──────────────────────────────────────────────────
  conclusionRow: {
    background: COLOR.card,
    borderRadius: '8px',
    padding: '10px',
    borderLeft: `3px solid ${COLOR.conclusion}`,
  },
  conclusionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '7px',
  },
  conclusionLabel: { fontWeight: 600, color: COLOR.conclusion, fontSize: '13px' },
  conclusionTextarea: {
    width: '100%',
    padding: '6px 8px',
    background: COLOR.surface,
    color: COLOR.textPrimary,
    border: `1px solid ${COLOR.border}`,
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: 1.5,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },

  // ── Feedback ──────────────────────────────────────────────────────────────
  errorBanner: {
    background: COLOR.errorBg,
    color: COLOR.error,
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '14px',
    fontSize: '12px',
    borderLeft: `3px solid ${COLOR.error}`,
  },
  errorText: { color: COLOR.error, fontSize: '11px', margin: '4px 0 0' },
  info: { color: COLOR.textMuted, fontSize: '12px', textAlign: 'center', padding: '24px 0' },

  // ── Sticky footer con botón PDF ───────────────────────────────────────────
  pdfSection: {
    position: 'sticky' as const,
    bottom: 0,
    background: COLOR.bg,
    paddingTop: '12px',
    paddingBottom: '8px',
    borderTop: `1px solid ${COLOR.border}`,
    marginTop: '8px',
  },
  pdfBtn: {
    width: '100%',
    padding: '11px',
    background: 'linear-gradient(135deg, #5b21b6, #be185d)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '13px',
    letterSpacing: '0.01em',
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
  secondaryBtn: {
    width: '100%',
    padding: '8px',
    background: COLOR.card,
    color: COLOR.accent,
    border: `1px solid ${COLOR.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    marginTop: '8px',
  },
  copyBtn: {
    fontSize: '11px',
    padding: '2px 8px',
    background: COLOR.card,
    color: COLOR.textMuted,
    border: `1px solid ${COLOR.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
  },
  reportSection: {
    marginBottom: '10px',
    background: COLOR.card,
    borderRadius: '8px',
    padding: '10px',
  },
  reportSectionTitle: {
    fontWeight: 700,
    fontSize: '10px',
    textTransform: 'uppercase',
    color: COLOR.accent,
    marginBottom: '6px',
    letterSpacing: '0.06em',
  },
  reportContent: { fontSize: '12px', lineHeight: 1.6, color: COLOR.textPrimary },
};
