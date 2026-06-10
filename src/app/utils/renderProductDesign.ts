import type { Product, Template } from '@/types/database';

type PreviewShape = 'apparel' | 'horizontal' | 'vertical' | 'badge';

export interface ProductDesignData {
  nombre: string;
  carrera: string;
  foto: string | null;
  [key: string]: string | null;
}

export interface ProductDesignRenderInput {
  data: ProductDesignData;
  exactSouvenir: string;
  product: Product | null;
  productOptions: Record<string, string>;
  template?: Template | null;
}

interface RenderOptions {
  allowExternalImages: boolean;
}

interface CanvasSize {
  height: number;
  width: number;
}

interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

type ShirtColor = 'blanco' | 'negro' | 'verde';

const BRAND_GREEN = '#1b4332';
const BRAND_GREEN_LIGHT = '#2d6a4f';
const TEXT_MUTED = '#6b7280';
const TEXT_SOFT = '#9ca3af';
const PAPER = '#fffdf8';

const SHIRT_MOCKUPS: Record<ShirtColor, string> = {
  blanco: '/mockups/polos/polo-blanco-espalda.png',
  negro: '/mockups/polos/polo-negro-espalda.png',
  verde: '/mockups/polos/polo-verde-espalda.png',
};

const SLUG_SHAPE: Record<string, PreviewShape> = {
  camisetas: 'apparel',
  'tote-bags': 'apparel',
  tazas: 'horizontal',
  posters: 'vertical',
  cuadros: 'vertical',
  'pines-urp': 'badge',
  stickers: 'badge',
};

const FALLBACK_SIZES: Record<PreviewShape, CanvasSize> = {
  apparel: { width: 900, height: 1200 },
  horizontal: { width: 1200, height: 800 },
  vertical: { width: 900, height: 1300 },
  badge: { width: 900, height: 900 },
};

function normalizeOption(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function truncate(str: string, max: number) {
  return str.length > max ? `${str.slice(0, max - 1)}...` : str;
}

function getPreviewYear(data: ProductDesignData) {
  return data['a\u00f1o'] ?? data['a\u00c3\u00b1o'] ?? data.ano ?? '';
}

function getShape(slug?: string | null, template?: Template | null, options?: Record<string, string>): PreviewShape {
  if (slug === 'posters' && template) {
    const isHorizontal = normalizeOption(options?.orientacion ?? options?.['orientación']) === 'horizontal';
    return isHorizontal ? 'horizontal' : 'vertical';
  }

  if (slug === 'posters' && normalizeOption(options?.orientacion ?? options?.['orientación']) === 'horizontal') {
    return 'horizontal';
  }

  return SLUG_SHAPE[slug ?? ''] ?? 'badge';
}

function getCanvasSize(product: Product | null, template: Template | null | undefined, options: Record<string, string>) {
  const templateWidth = Number(template?.canvas_width);
  const templateHeight = Number(template?.canvas_height);

  if (Number.isFinite(templateWidth) && Number.isFinite(templateHeight) && templateWidth > 0 && templateHeight > 0) {
    return {
      width: Math.round(templateWidth),
      height: Math.round(templateHeight),
    };
  }

  const shape = product ? getShape(product.slug, template, options) : 'badge';
  if (product?.slug === 'camisetas') return { width: 900, height: 1200 };

  return FALLBACK_SIZES[shape];
}

function resolveShirtColor(productOptions: Record<string, string>): ShirtColor {
  const rawColor =
    productOptions.color ??
    productOptions['color de polo'] ??
    productOptions['color camiseta'] ??
    productOptions['color de camiseta'];
  const normalized = normalizeOption(rawColor);

  if (normalized.includes('negro')) return 'negro';
  if (normalized.includes('verde')) return 'verde';
  return 'blanco';
}

function formatOptions(options: Record<string, string>) {
  return Object.values(options).filter(Boolean).join(' · ');
}

function getOption(options: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (options[key]) return options[key];
  }

  return '';
}

function getNameFontSize(name: string, base: number) {
  const length = name.trim().length;
  if (length <= 14) return base;
  if (length <= 22) return base * 0.86;
  if (length <= 30) return base * 0.72;
  return base * 0.62;
}

function getCareerFontSize(career: string, base: number) {
  const length = career.trim().length;
  if (length <= 24) return base;
  if (length <= 42) return base * 0.88;
  return base * 0.78;
}

function getFrameColors(frameColor: string) {
  const normalized = normalizeOption(frameColor);

  if (normalized.includes('blanco')) {
    return {
      accent: '#64748b',
      bevel: '#d1d5db',
      frame: '#f8fafc',
      shadow: 'rgba(15, 23, 42, 0.18)',
    };
  }

  if (normalized.includes('verde')) {
    return {
      accent: BRAND_GREEN,
      bevel: BRAND_GREEN_LIGHT,
      frame: BRAND_GREEN,
      shadow: 'rgba(27, 67, 50, 0.28)',
    };
  }

  if (normalized.includes('madera')) {
    return {
      accent: '#7c4a28',
      bevel: '#b77945',
      frame: '#7c4a28',
      shadow: 'rgba(92, 52, 23, 0.25)',
    };
  }

  return {
    accent: BRAND_GREEN,
    bevel: '#374151',
    frame: '#111827',
    shadow: 'rgba(15, 23, 42, 0.28)',
  };
}

function isExternalImage(src: string) {
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (src.startsWith('/')) return false;

  try {
    const currentOrigin = typeof window === 'undefined' ? '' : window.location.origin;
    return new URL(src, typeof window === 'undefined' ? 'http://localhost' : window.location.href).origin !== currentOrigin;
  } catch {
    return false;
  }
}

async function loadImage(src: string | null | undefined, { allowExternalImages }: RenderOptions) {
  if (!src) return null;
  if (src.startsWith('data:image/svg') || src.toLowerCase().endsWith('.svg')) return null;
  if (!allowExternalImages && isExternalImage(src)) return null;

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();

    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, rect: Rect, radius: number) {
  const r = Math.min(radius, rect.width / 2, rect.height / 2);
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.width - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + r);
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height - r);
  ctx.quadraticCurveTo(rect.x + rect.width, rect.y + rect.height, rect.x + rect.width - r, rect.y + rect.height);
  ctx.lineTo(rect.x + r, rect.y + rect.height);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
}

function fillRoundRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number, color: string) {
  ctx.save();
  roundRectPath(ctx, rect, radius);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function strokeRoundRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number, color: string, width: number) {
  ctx.save();
  roundRectPath(ctx, rect, radius);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, { width, height }: CanvasSize) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = BRAND_GREEN;
  ctx.lineWidth = 1;
  const gap = Math.max(10, Math.round(width / 90));

  for (let x = -height; x < width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function setText(ctx: CanvasRenderingContext2D, size: number, weight = 700, family = 'Arial, sans-serif') {
  ctx.font = `${weight} ${size}px ${family}`;
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  color: string,
  weight = 700,
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  setText(ctx, size, weight);
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawWrappedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  size: number,
  lineHeight: number,
  color: string,
  weight = 700,
  maxLines = 2,
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  setText(ctx, size, weight);

  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(index === maxLines - 1 && wrapText(ctx, text, maxWidth).length > maxLines ? truncate(line, 28) : line, centerX, startY + index * lineHeight, maxWidth);
  });
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, product: Product | null, optionsSummary: string, size: CanvasSize) {
  const y = size.height - Math.max(72, size.height * 0.075);
  const width = size.width * 0.72;
  const centerX = size.width / 2;

  ctx.save();
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = Math.max(2, size.width * 0.002);
  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, y - 24);
  ctx.lineTo(centerX + width / 2, y - 24);
  ctx.stroke();

  drawCenteredText(ctx, product ? `${product.name} · URP PrintStudio` : 'URP PrintStudio', centerX, y, width, Math.max(16, size.width * 0.018), TEXT_SOFT, 500);

  if (optionsSummary) {
    drawCenteredText(ctx, optionsSummary, centerX, y + Math.max(24, size.height * 0.024), width, Math.max(15, size.width * 0.016), TEXT_MUTED, 600);
  }
  ctx.restore();
}

function drawUrpHeader(ctx: CanvasRenderingContext2D, centerX: number, y: number, scale: number, souvenir: string, color = BRAND_GREEN) {
  const radius = 21 * scale;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = `${color}18`;
  ctx.lineWidth = Math.max(2, 2 * scale);
  ctx.beginPath();
  ctx.arc(centerX, y + radius, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawCenteredText(ctx, 'URP', centerX, y + radius, radius * 1.45, 11 * scale, color, 800);

  if (souvenir) {
    drawCenteredText(ctx, truncate(souvenir.toUpperCase(), 28), centerX, y + radius * 2 + 14 * scale, 190 * scale, 9 * scale, color, 800);
  }
  ctx.restore();
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: Rect, radius = 0) {
  const imageRatio = image.width / image.height;
  const rectRatio = rect.width / rect.height;
  const drawWidth = imageRatio > rectRatio ? rect.height * imageRatio : rect.width;
  const drawHeight = imageRatio > rectRatio ? rect.height : rect.width / imageRatio;
  const dx = rect.x + (rect.width - drawWidth) / 2;
  const dy = rect.y + (rect.height - drawHeight) / 2;

  ctx.save();
  if (radius > 0) {
    roundRectPath(ctx, rect, radius);
    ctx.clip();
  }
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
  ctx.restore();
}

function drawImageContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: Rect) {
  const imageRatio = image.width / image.height;
  const rectRatio = rect.width / rect.height;
  const drawWidth = imageRatio > rectRatio ? rect.width : rect.height * imageRatio;
  const drawHeight = imageRatio > rectRatio ? rect.width / imageRatio : rect.height;
  const dx = rect.x + (rect.width - drawWidth) / 2;
  const dy = rect.y + (rect.height - drawHeight) / 2;

  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);

  return { x: dx, y: dy, width: drawWidth, height: drawHeight };
}

function drawCircleImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, centerX: number, centerY: number, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  if (image) {
    drawImageCover(ctx, image, { x: centerX - radius, y: centerY - radius, width: radius * 2, height: radius * 2 });
  } else {
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = BRAND_GREEN;
  ctx.lineWidth = Math.max(2, radius * 0.08);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawYearPill(ctx: CanvasRenderingContext2D, centerX: number, y: number, text: string, scale: number) {
  const width = 88 * scale;
  const height = 26 * scale;
  const rect = { x: centerX - width / 2, y, width, height };
  fillRoundRect(ctx, rect, height / 2, BRAND_GREEN);
  drawCenteredText(ctx, text, centerX, y + height / 2, width * 0.88, 13 * scale, '#ffffff', 800);
}

function drawFallbackShirt(ctx: CanvasRenderingContext2D, rect: Rect, color: ShirtColor) {
  const fill = color === 'negro' ? '#111827' : color === 'verde' ? BRAND_GREEN : '#f8fafc';
  const stroke = color === 'blanco' ? '#d1d5db' : 'rgba(255,255,255,0.18)';

  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(4, rect.width * 0.012);
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.width * 0.26, rect.y + rect.height * 0.14);
  ctx.lineTo(rect.x + rect.width * 0.08, rect.y + rect.height * 0.32);
  ctx.lineTo(rect.x + rect.width * 0.21, rect.y + rect.height * 0.45);
  ctx.lineTo(rect.x + rect.width * 0.3, rect.y + rect.height * 0.36);
  ctx.lineTo(rect.x + rect.width * 0.3, rect.y + rect.height * 0.88);
  ctx.lineTo(rect.x + rect.width * 0.7, rect.y + rect.height * 0.88);
  ctx.lineTo(rect.x + rect.width * 0.7, rect.y + rect.height * 0.36);
  ctx.lineTo(rect.x + rect.width * 0.79, rect.y + rect.height * 0.45);
  ctx.lineTo(rect.x + rect.width * 0.92, rect.y + rect.height * 0.32);
  ctx.lineTo(rect.x + rect.width * 0.74, rect.y + rect.height * 0.14);
  ctx.quadraticCurveTo(rect.x + rect.width * 0.62, rect.y + rect.height * 0.21, rect.x + rect.width * 0.5, rect.y + rect.height * 0.21);
  ctx.quadraticCurveTo(rect.x + rect.width * 0.38, rect.y + rect.height * 0.21, rect.x + rect.width * 0.26, rect.y + rect.height * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

async function drawShirtPreview(ctx: CanvasRenderingContext2D, input: ProductDesignRenderInput, size: CanvasSize, options: RenderOptions) {
  const shirtColor = resolveShirtColor(input.productOptions);
  const isLightShirt = shirtColor === 'blanco';
  const printColor = isLightShirt ? BRAND_GREEN : shirtColor === 'verde' ? '#fff7e8' : '#ffffff';
  const labelColor = isLightShirt ? 'rgba(27, 67, 50, 0.76)' : 'rgba(255, 255, 255, 0.78)';
  const year = getPreviewYear(input.data);
  const name = input.data.nombre.trim() || 'Tu nombre';
  const career = input.data.carrera.trim() || 'Tu carrera';
  const frame: Rect = { x: size.width * 0.12, y: size.height * 0.06, width: size.width * 0.76, height: size.height * 0.76 };
  const mockup = await loadImage(SHIRT_MOCKUPS[shirtColor], options);
  let shirtRect = frame;

  fillRoundRect(ctx, frame, size.width * 0.035, '#ffffff');

  if (mockup) {
    shirtRect = drawImageContain(ctx, mockup, frame);
  } else {
    drawFallbackShirt(ctx, frame, shirtColor);
  }

  const printRect: Rect = {
    x: shirtRect.x + shirtRect.width * 0.27,
    y: shirtRect.y + shirtRect.height * 0.28,
    width: shirtRect.width * 0.46,
    height: shirtRect.height * 0.36,
  };
  const centerX = printRect.x + printRect.width / 2;
  const base = Math.min(printRect.width, printRect.height);

  drawCenteredText(ctx, 'UNIVERSIDAD RICARDO PALMA', centerX, printRect.y + base * 0.06, printRect.width, base * 0.055, labelColor, 800);
  drawWrappedCenteredText(ctx, name.toUpperCase(), centerX, printRect.y + printRect.height * 0.42, printRect.width, getNameFontSize(name, base * 0.15), base * 0.14, printColor, 900, 2);
  drawWrappedCenteredText(ctx, career, centerX, printRect.y + printRect.height * 0.66, printRect.width * 0.92, getCareerFontSize(career, base * 0.075), base * 0.085, printColor, 700, 2);
  drawCenteredText(ctx, `PROMO ${year || '20XX'}`, centerX, printRect.y + printRect.height * 0.86, printRect.width, base * 0.065, printColor, 800);

  drawFooter(ctx, input.product, formatOptions(input.productOptions), size);
}

async function drawApparelPreview(ctx: CanvasRenderingContext2D, input: ProductDesignRenderInput, size: CanvasSize, options: RenderOptions) {
  const year = getPreviewYear(input.data);
  const image = await loadImage(input.product?.image_url, options);
  const photo = await loadImage(input.data.foto, options);
  const mediaRect: Rect = { x: size.width * 0.1, y: size.height * 0.1, width: size.width * 0.8, height: size.height * 0.46 };
  const cardWidth = mediaRect.width * 0.64;
  const cardHeight = mediaRect.height * 0.72;
  const card: Rect = {
    x: mediaRect.x + (mediaRect.width - cardWidth) / 2,
    y: mediaRect.y + (mediaRect.height - cardHeight) / 2,
    width: cardWidth,
    height: cardHeight,
  };

  fillRoundRect(ctx, mediaRect, size.width * 0.035, '#f8fafc');
  if (image) {
    ctx.save();
    drawImageCover(ctx, image, mediaRect, size.width * 0.035);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    roundRectPath(ctx, mediaRect, size.width * 0.035);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  fillRoundRect(ctx, card, size.width * 0.03, 'rgba(255, 255, 255, 0.92)');
  ctx.restore();

  const centerX = card.x + card.width / 2;
  const scale = size.width / 900;
  drawUrpHeader(ctx, centerX, card.y + card.height * 0.1, scale, input.exactSouvenir);

  let nextY = card.y + card.height * 0.46;
  if (input.data.foto) {
    drawCircleImage(ctx, photo, centerX, nextY, 34 * scale);
    nextY += 56 * scale;
  }

  drawCenteredText(ctx, truncate(input.data.nombre || 'Tu nombre', 30), centerX, nextY, card.width * 0.8, 24 * scale, BRAND_GREEN, 800);
  drawCenteredText(ctx, truncate(input.data.carrera || 'Tu carrera', 35), centerX, nextY + 32 * scale, card.width * 0.82, 17 * scale, TEXT_MUTED, 500);
  if (year) drawYearPill(ctx, centerX, nextY + 55 * scale, year, scale);

  drawFooter(ctx, input.product, formatOptions(input.productOptions), size);
}

async function drawMugPreview(ctx: CanvasRenderingContext2D, input: ProductDesignRenderInput, size: CanvasSize, options: RenderOptions) {
  const year = getPreviewYear(input.data);
  const image = await loadImage(input.product?.image_url, options);
  const photo = await loadImage(input.data.foto, options);
  const mug: Rect = { x: size.width * 0.18, y: size.height * 0.22, width: size.width * 0.62, height: size.height * 0.36 };
  const handle: Rect = { x: mug.x - size.width * 0.055, y: mug.y + mug.height * 0.28, width: size.width * 0.07, height: mug.height * 0.34 };
  const rightLip: Rect = { x: mug.x + mug.width, y: mug.y, width: size.width * 0.018, height: mug.height };
  const centerX = mug.x + mug.width / 2;
  const scale = size.width / 1200;

  strokeRoundRect(ctx, handle, handle.width / 2, 'rgba(27, 67, 50, 0.5)', Math.max(5, size.width * 0.005));
  fillRoundRect(ctx, mug, size.width * 0.035, '#f4f8f6');
  strokeRoundRect(ctx, mug, size.width * 0.035, 'rgba(27, 67, 50, 0.2)', Math.max(3, size.width * 0.004));
  fillRoundRect(ctx, rightLip, size.width * 0.006, 'rgba(27, 67, 50, 0.1)');

  if (image) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    drawImageCover(ctx, image, mug, size.width * 0.035);
    ctx.restore();
  }

  drawUrpHeader(ctx, centerX, mug.y + mug.height * 0.1, scale, input.exactSouvenir);

  let y = mug.y + mug.height * 0.46;
  if (input.data.foto) {
    drawCircleImage(ctx, photo, centerX, y, 32 * scale);
    y += 50 * scale;
  }

  drawCenteredText(ctx, truncate(input.data.nombre || 'Tu nombre', 28), centerX, y, mug.width * 0.78, 24 * scale, BRAND_GREEN, 800);
  drawCenteredText(ctx, truncate(input.data.carrera || 'Tu carrera', 32), centerX, y + 30 * scale, mug.width * 0.82, 16 * scale, TEXT_MUTED, 500);
  if (year) drawYearPill(ctx, centerX, y + 50 * scale, year, scale);

  drawFooter(ctx, input.product, formatOptions(input.productOptions), size);
}

async function drawPosterPreview(ctx: CanvasRenderingContext2D, input: ProductDesignRenderInput, size: CanvasSize, options: RenderOptions, isHorizontal: boolean) {
  const year = getPreviewYear(input.data);
  const image = await loadImage(input.product?.image_url, options);
  const photo = await loadImage(input.data.foto, options);
  const poster: Rect = isHorizontal
    ? { x: size.width * 0.1, y: size.height * 0.2, width: size.width * 0.8, height: size.height * 0.36 }
    : { x: size.width * 0.14, y: size.height * 0.08, width: size.width * 0.72, height: size.height * 0.72 };
  const centerX = poster.x + poster.width / 2;
  const centerY = poster.y + poster.height / 2;
  const scale = Math.min(size.width / 900, size.height / 1300);

  fillRoundRect(ctx, poster, size.width * 0.016, '#ffffff');
  ctx.save();
  ctx.setLineDash([12 * scale, 10 * scale]);
  strokeRoundRect(ctx, poster, size.width * 0.016, 'rgba(27, 67, 50, 0.3)', Math.max(3, size.width * 0.005));
  ctx.restore();

  if (image) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    drawImageCover(ctx, image, poster, size.width * 0.016);
    ctx.restore();
  }

  drawUrpHeader(ctx, centerX, centerY - poster.height * 0.34, scale, input.exactSouvenir);
  ctx.save();
  ctx.strokeStyle = 'rgba(27, 67, 50, 0.3)';
  ctx.lineWidth = Math.max(2, size.width * 0.004);
  ctx.beginPath();
  ctx.moveTo(centerX - poster.width * 0.12, centerY - poster.height * 0.12);
  ctx.lineTo(centerX + poster.width * 0.12, centerY - poster.height * 0.12);
  ctx.stroke();
  ctx.restore();

  let y = centerY - poster.height * 0.02;
  if (input.data.foto) {
    drawCircleImage(ctx, photo, centerX, y, Math.min(poster.width, poster.height) * 0.1);
    y += Math.min(poster.width, poster.height) * 0.17;
  }

  drawWrappedCenteredText(ctx, input.data.nombre || 'Tu nombre aqui', centerX, y, poster.width * 0.74, poster.width * 0.055, poster.width * 0.065, BRAND_GREEN, 800, 2);
  drawWrappedCenteredText(ctx, input.data.carrera || 'Tu carrera', centerX, y + poster.height * 0.12, poster.width * 0.78, poster.width * 0.034, poster.width * 0.042, '#374151', 500, 2);
  drawYearPill(ctx, centerX, y + poster.height * 0.24, year || '20XX', scale * 1.35);

  drawFooter(ctx, input.product, formatOptions(input.productOptions), size);
}

function drawCuadroPreview(ctx: CanvasRenderingContext2D, input: ProductDesignRenderInput, size: CanvasSize) {
  const year = getPreviewYear(input.data);
  const name = input.data.nombre.trim() || 'Nombre del estudiante';
  const career = input.data.carrera.trim() || 'Carrera profesional';
  const frameColor = getOption(input.productOptions, ['marco', 'color de marco']) || 'Negro';
  const frameType = getOption(input.productOptions, ['tipo', 'tipo de cuadro']) || 'Académico';
  const selectedSize = getOption(input.productOptions, ['tamaño', 'tamano']) || 'A4';
  const colors = getFrameColors(frameColor);
  const frame: Rect = { x: size.width * 0.18, y: size.height * 0.08, width: size.width * 0.64, height: size.height * 0.76 };
  const mat: Rect = { x: frame.x + frame.width * 0.08, y: frame.y + frame.height * 0.06, width: frame.width * 0.84, height: frame.height * 0.88 };
  const paper: Rect = { x: mat.x + mat.width * 0.08, y: mat.y + mat.height * 0.06, width: mat.width * 0.84, height: mat.height * 0.88 };
  const centerX = paper.x + paper.width / 2;
  const scale = size.width / 900;

  ctx.save();
  ctx.shadowColor = colors.shadow;
  ctx.shadowBlur = 38 * scale;
  ctx.shadowOffsetY = 24 * scale;
  fillRoundRect(ctx, frame, 4 * scale, colors.frame);
  ctx.restore();
  strokeRoundRect(ctx, frame, 4 * scale, colors.bevel, 20 * scale);
  fillRoundRect(ctx, mat, 3 * scale, '#f6f1e8');
  strokeRoundRect(ctx, mat, 2 * scale, 'rgba(0,0,0,0.18)', 2 * scale);
  fillRoundRect(ctx, paper, 1 * scale, PAPER);
  strokeRoundRect(ctx, paper, 1 * scale, '#d1d5db', 1.5 * scale);

  drawCenteredText(ctx, 'UNIVERSIDAD RICARDO PALMA', centerX, paper.y + paper.height * 0.12, paper.width * 0.86, 14 * scale, TEXT_MUTED, 800);
  ctx.save();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(centerX - paper.width * 0.22, paper.y + paper.height * 0.19);
  ctx.lineTo(centerX + paper.width * 0.22, paper.y + paper.height * 0.19);
  ctx.stroke();
  ctx.restore();

  drawCenteredText(ctx, frameType.toUpperCase(), centerX, paper.y + paper.height * 0.4, paper.width * 0.82, 14 * scale, colors.accent, 700);
  drawWrappedCenteredText(ctx, name.toUpperCase(), centerX, paper.y + paper.height * 0.5, paper.width * 0.86, getNameFontSize(name, 34 * scale), 36 * scale, '#030712', 900, 3);
  drawWrappedCenteredText(ctx, career, centerX, paper.y + paper.height * 0.63, paper.width * 0.84, 19 * scale, 24 * scale, '#374151', 600, 3);
  drawCenteredText(ctx, `PROMO ${year || '20XX'}`, centerX, paper.y + paper.height * 0.82, paper.width * 0.78, 17 * scale, colors.accent, 800);
  drawCenteredText(ctx, 'URP PRINTSTUDIO', centerX, paper.y + paper.height * 0.9, paper.width * 0.78, 12 * scale, TEXT_SOFT, 700);

  drawFooter(ctx, input.product, formatOptions(input.productOptions) || selectedSize, size);
}

async function drawBadgePreview(ctx: CanvasRenderingContext2D, input: ProductDesignRenderInput, size: CanvasSize, options: RenderOptions) {
  const year = getPreviewYear(input.data);
  const image = await loadImage(input.product?.image_url, options);
  const photo = await loadImage(input.data.foto, options);
  const centerX = size.width / 2;
  const centerY = size.height * 0.47;
  const radius = Math.min(size.width, size.height) * 0.32;
  const scale = radius / 280;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
  ctx.shadowBlur = 34 * scale;
  ctx.shadowOffsetY = 14 * scale;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  if (image) {
    ctx.globalAlpha = 0.1;
    drawImageCover(ctx, image, { x: centerX - radius, y: centerY - radius, width: radius * 2, height: radius * 2 });
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = BRAND_GREEN;
  ctx.lineWidth = 10 * scale;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  const logoRadius = 42 * scale;
  const gradient = ctx.createLinearGradient(centerX - logoRadius, centerY - radius * 0.48, centerX + logoRadius, centerY - radius * 0.28);
  gradient.addColorStop(0, BRAND_GREEN);
  gradient.addColorStop(1, BRAND_GREEN_LIGHT);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY - radius * 0.38, logoRadius, 0, Math.PI * 2);
  ctx.fill();
  drawCenteredText(ctx, 'URP', centerX, centerY - radius * 0.38, logoRadius * 1.4, 18 * scale, '#ffffff', 900);
  ctx.restore();

  if (input.exactSouvenir) {
    drawCenteredText(ctx, truncate(input.exactSouvenir.toUpperCase(), 30), centerX, centerY - radius * 0.18, radius * 1.45, 16 * scale, BRAND_GREEN, 800);
  }

  let y = centerY - radius * 0.02;
  if (input.data.foto) {
    drawCircleImage(ctx, photo, centerX, y, 36 * scale);
    y += 58 * scale;
  }

  drawWrappedCenteredText(ctx, truncate(input.data.nombre || 'Tu nombre', 22), centerX, y, radius * 1.25, 23 * scale, 24 * scale, BRAND_GREEN, 800, 2);
  drawWrappedCenteredText(ctx, truncate(input.data.carrera || '', 24), centerX, y + 34 * scale, radius * 1.25, 16 * scale, 19 * scale, TEXT_MUTED, 500, 2);
  if (year) drawYearPill(ctx, centerX, y + 62 * scale, year, scale * 1.1);

  drawCenteredText(ctx, `${input.product?.name ?? 'Producto'} · URP PrintStudio`, centerX, size.height - size.height * 0.075, size.width * 0.72, 18 * scale, TEXT_SOFT, 500);
}

function drawEmptyPreview(ctx: CanvasRenderingContext2D, size: CanvasSize) {
  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const radius = Math.min(size.width, size.height) * 0.08;

  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY - radius * 0.9, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawCenteredText(ctx, 'URP', centerX, centerY - radius * 0.9, radius * 1.4, radius * 0.46, TEXT_SOFT, 800);
  drawCenteredText(ctx, 'Selecciona un producto para ver la preview', centerX, centerY + radius * 0.8, size.width * 0.72, Math.max(18, size.width * 0.025), TEXT_SOFT, 600);
}

async function renderCanvas(input: ProductDesignRenderInput, options: RenderOptions) {
  const size = getCanvasSize(input.product, input.template, input.productOptions);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D is not available in this browser.');
  }

  canvas.width = size.width;
  canvas.height = size.height;
  drawBackground(ctx, size);

  if (!input.product) {
    drawEmptyPreview(ctx, size);
    return canvas;
  }

  const shape = getShape(input.product.slug, input.template, input.productOptions);

  if (input.product.slug === 'camisetas') {
    await drawShirtPreview(ctx, input, size, options);
  } else if (shape === 'apparel') {
    await drawApparelPreview(ctx, input, size, options);
  } else if (input.product.slug === 'cuadros') {
    drawCuadroPreview(ctx, input, size);
  } else if (input.product.slug === 'posters') {
    await drawPosterPreview(ctx, input, size, options, shape === 'horizontal');
  } else if (shape === 'horizontal') {
    await drawMugPreview(ctx, input, size, options);
  } else if (shape === 'vertical') {
    await drawPosterPreview(ctx, input, size, options, false);
  } else {
    await drawBadgePreview(ctx, input, size, options);
  }

  return canvas;
}

export async function renderProductDesign(input: ProductDesignRenderInput) {
  const canvas = await renderCanvas(input, { allowExternalImages: true });

  try {
    return canvas.toDataURL('image/png', 0.95);
  } catch {
    const fallbackCanvas = await renderCanvas(input, { allowExternalImages: false });
    return fallbackCanvas.toDataURL('image/png', 0.95);
  }
}
