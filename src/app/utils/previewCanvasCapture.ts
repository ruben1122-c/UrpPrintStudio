export function getPreviewCanvasDataUrl(previewElement: HTMLElement | null) {
  const canvas = previewElement?.querySelector('canvas');

  if (!canvas) {
    return null;
  }

  try {
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl === 'data:,' ? null : dataUrl;
  } catch {
    return null;
  }
}
