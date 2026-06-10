import type { RefObject } from 'react';
import type { Product, Template } from '@/types/database';
import { ImageWithFallback } from './figma/ImageWithFallback';

export type PreviewShape = 'apparel' | 'horizontal' | 'vertical' | 'badge';

export type PreviewData = {
  nombre: string;
  carrera: string;
  foto: string | null;
  [key: string]: string | null;
};

export type ProductPreviewProps = {
  previewRef: RefObject<HTMLDivElement>;
  product: Product | null;
  template?: Template | null;
  data: PreviewData;
  exactSouvenir: string;
  productOptions: Record<string, string>;
  defaultShape?: PreviewShape;
};

type ShirtColor = 'blanco' | 'negro' | 'verde';

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
  'pines-urp': 'badge',
  stickers: 'badge',
};

const FRAME_CLASS: Record<PreviewShape, string> = {
  apparel: 'w-full max-w-sm min-h-[440px] rounded-3xl',
  horizontal: 'w-full max-w-md min-h-[280px] rounded-[2rem]',
  vertical: 'w-full max-w-xs min-h-[480px] rounded-lg',
  badge: 'w-72 h-72 rounded-full',
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

function getPreviewYear(data: PreviewData) {
  return data['a\u00f1o'] ?? data['a\u00c3\u00b1o'] ?? data.ano ?? '';
}

function getShape(slug?: string | null, template?: Template | null, options?: Record<string, string>): PreviewShape {
  if (slug === 'posters' && template) {
    const isHorizontal = normalizeOption(options?.orientacion ?? options?.['orientaci\u00f3n']) === 'horizontal';
    return isHorizontal ? 'horizontal' : 'vertical';
  }

  if (slug === 'posters' && normalizeOption(options?.orientacion ?? options?.['orientaci\u00f3n']) === 'horizontal') {
    return 'horizontal';
  }

  return SLUG_SHAPE[slug ?? ''] ?? 'badge';
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

function getNameFontSize(name: string) {
  const length = name.trim().length;
  if (length <= 14) return 21;
  if (length <= 22) return 18;
  if (length <= 30) return 15;
  return 13;
}

function getCareerFontSize(career: string) {
  const length = career.trim().length;
  if (length <= 24) return 12;
  if (length <= 42) return 10.5;
  return 9.5;
}

function URPHeader({ souvenir, colorClass = 'text-[#1b4332]' }: { souvenir: string; colorClass?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-current bg-current/10">
        <span className="text-[11px] font-extrabold leading-none">URP</span>
      </div>
      {souvenir && (
        <span className={`text-[9px] font-bold uppercase leading-tight tracking-wide ${colorClass}`}>
          {truncate(souvenir, 28)}
        </span>
      )}
    </div>
  );
}

function ShirtPreview({
  product,
  data,
  souvenir,
  optionsSummary,
  productOptions,
}: {
  product: Product | null;
  data: PreviewData;
  souvenir: string;
  optionsSummary: string;
  productOptions: Record<string, string>;
}) {
  const shirtColor = resolveShirtColor(productOptions);
  const year = getPreviewYear(data);
  const isLightShirt = shirtColor === 'blanco';
  const printColor = isLightShirt ? '#1b4332' : shirtColor === 'verde' ? '#fff7e8' : '#ffffff';
  const labelColor = isLightShirt ? 'rgba(27, 67, 50, 0.76)' : 'rgba(255, 255, 255, 0.78)';
  const name = data.nombre.trim() || 'Tu nombre';
  const career = data.carrera.trim() || 'Tu carrera';
  const nameFontSize = getNameFontSize(name);
  const careerFontSize = getCareerFontSize(career);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-2xl bg-white">
        <img
          src={SHIRT_MOCKUPS[shirtColor]}
          alt={`${product?.name ?? 'Polo'} ${shirtColor} espalda`}
          className="block h-auto w-full select-none"
          draggable={false}
        />

        <div
          className="absolute left-1/2 top-[28%] flex min-h-[36%] w-[46%] -translate-x-1/2 flex-col items-center justify-center text-center"
          style={{
            color: printColor,
            opacity: isLightShirt ? 0.92 : 0.9,
            textShadow: isLightShirt ? '0 0.4px 0 rgba(27, 67, 50, 0.16)' : '0 0.4px 0 rgba(255, 255, 255, 0.12)',
          }}
        >
          <p
            className="w-full text-[8px] font-bold uppercase leading-none tracking-[0.16em]"
            style={{ color: labelColor }}
          >
            Universidad Ricardo Palma
          </p>
          <p
            className="mt-2 w-full font-black uppercase leading-[0.95]"
            style={{
              fontSize: `${nameFontSize}px`,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {name}
          </p>
          <p
            className="mt-1.5 w-full max-w-[92%] font-semibold leading-tight"
            style={{
              fontSize: `${careerFontSize}px`,
              overflowWrap: 'anywhere',
              wordBreak: 'normal',
            }}
          >
            {career}
          </p>
          <p
            className="mt-2 text-[9px] font-bold uppercase leading-none tracking-[0.12em]"
          >
            Promo {year || '20XX'}
          </p>
        </div>
      </div>

      <ProductFooter product={product} optionsSummary={optionsSummary} />
    </div>
  );
}

function ApparelPreview({
  product,
  data,
  souvenir,
  optionsSummary,
}: {
  product: Product | null;
  data: PreviewData;
  souvenir: string;
  optionsSummary: string;
}) {
  const hasImage = Boolean(product?.image_url);
  const year = getPreviewYear(data);

  return (
    <div className="relative flex w-full flex-col items-center">
      {hasImage ? (
        <div className="relative mb-4 h-56 w-full overflow-hidden rounded-xl">
          <ImageWithFallback
            src={product!.image_url!}
            alt={product!.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
            <div className="max-w-[80%] rounded-xl bg-white/90 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
              <URPHeader souvenir={souvenir} />
              {data.foto && (
                <img
                  src={data.foto}
                  alt="Foto personalizada"
                  className="mx-auto mb-2 h-14 w-14 rounded-full border-2 border-[#1b4332] object-cover"
                />
              )}
              <p className="text-sm font-bold leading-tight text-[#1b4332]">
                {truncate(data.nombre || 'Tu nombre', 30)}
              </p>
              <p className="mt-0.5 text-xs text-gray-600">{truncate(data.carrera || 'Tu carrera', 35)}</p>
              {year && (
                <span className="mt-1 inline-block rounded-full bg-[#1b4332] px-3 py-0.5 text-xs font-bold text-white">
                  {year}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center py-6">
          <URPHeader souvenir={souvenir} />
          {data.foto && (
            <img
              src={data.foto}
              alt="Foto personalizada"
              className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-[#1b4332] object-cover"
            />
          )}
          <p className="text-center text-xl font-bold text-[#1b4332]">{data.nombre || 'Tu nombre aqui'}</p>
          <p className="mt-1 text-center text-sm text-gray-600">{data.carrera || 'Tu carrera'}</p>
          <span className="mt-2 rounded-full bg-[#1b4332] px-5 py-1.5 text-sm font-bold text-white">
            {year || '20XX'}
          </span>
        </div>
      )}
      <ProductFooter product={product} optionsSummary={optionsSummary} />
    </div>
  );
}

function MugPreview({
  product,
  data,
  souvenir,
  optionsSummary,
}: {
  product: Product | null;
  data: PreviewData;
  souvenir: string;
  optionsSummary: string;
}) {
  const hasImage = Boolean(product?.image_url);
  const year = getPreviewYear(data);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 flex w-full items-stretch gap-3">
        <div className="w-4 flex-none self-center">
          <div className="h-12 w-4 rounded-r-full border-2 border-[#1b4332] opacity-50" />
        </div>
        <div className={`relative flex min-h-[160px] flex-1 items-center justify-center overflow-hidden rounded-xl border-2 border-[#1b4332]/20 ${hasImage ? '' : 'bg-gradient-to-r from-[#1b4332]/5 to-[#2d6a4f]/10'}`}>
          {hasImage && (
            <img src={product!.image_url!} alt={product!.name} className="absolute inset-0 h-full w-full object-cover opacity-20" />
          )}
          <div className="relative z-10 w-full p-4 text-center">
            <URPHeader souvenir={souvenir} />
            {data.foto && (
              <img
                src={data.foto}
                alt="Foto personalizada"
                className="mx-auto mb-2 h-12 w-12 rounded-full border-2 border-[#1b4332] object-cover"
              />
            )}
            <p className="text-base font-bold leading-tight text-[#1b4332]">{truncate(data.nombre || 'Tu nombre', 28)}</p>
            <p className="mt-0.5 text-xs text-gray-600">{truncate(data.carrera || 'Tu carrera', 32)}</p>
            {year && (
              <span className="mt-1 inline-block rounded-full bg-[#1b4332] px-4 py-0.5 text-xs font-bold text-white">
                {year}
              </span>
            )}
          </div>
        </div>
        <div className="w-2 flex-none self-stretch rounded-r-md bg-[#1b4332]/10" />
      </div>
      <ProductFooter product={product} optionsSummary={optionsSummary} />
    </div>
  );
}

function PosterPreview({
  product,
  data,
  souvenir,
  optionsSummary,
  isHorizontal,
}: {
  product: Product | null;
  data: PreviewData;
  souvenir: string;
  optionsSummary: string;
  isHorizontal: boolean;
}) {
  const hasImage = Boolean(product?.image_url);
  const year = getPreviewYear(data);

  return (
    <div className="flex w-full flex-col items-center">
      <div className={`relative w-full overflow-hidden rounded-lg border-2 border-dashed border-[#1b4332]/30 ${isHorizontal ? 'min-h-[160px]' : 'min-h-[320px]'}`}>
        {hasImage && (
          <img src={product!.image_url!} alt={product!.name} className="absolute inset-0 h-full w-full object-cover opacity-15" />
        )}
        <div className="relative z-10 flex h-full min-h-[inherit] flex-col items-center justify-center p-6">
          <URPHeader souvenir={souvenir} />
          <div className="my-3 h-0.5 w-16 rounded-full bg-[#1b4332]/30" />
          {data.foto && (
            <img
              src={data.foto}
              alt="Foto personalizada"
              className="mx-auto mb-3 h-20 w-20 rounded-full border-4 border-[#1b4332]/40 object-cover"
            />
          )}
          <p className="text-center text-2xl font-bold leading-tight text-[#1b4332]">{data.nombre || 'Tu nombre aqui'}</p>
          <p className="mt-2 text-center text-base text-gray-700">{data.carrera || 'Tu carrera'}</p>
          <span className="mt-4 rounded-full bg-[#1b4332] px-6 py-2 text-lg font-bold text-white">
            {year || '20XX'}
          </span>
        </div>
      </div>
      <ProductFooter product={product} optionsSummary={optionsSummary} />
    </div>
  );
}

function BadgePreview({ product, data, souvenir }: { product: Product | null; data: PreviewData; souvenir: string }) {
  const year = getPreviewYear(data);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-4 border-[#1b4332] bg-white shadow-xl">
        {product?.image_url && (
          <img src={product.image_url} alt={product.name} className="absolute inset-0 h-full w-full object-cover opacity-10" />
        )}
        <div className="relative z-10 p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1b4332] to-[#2d6a4f]">
            <span className="text-xs font-extrabold text-white">URP</span>
          </div>
          {souvenir && (
            <p className="mb-1 text-[9px] font-bold uppercase leading-tight tracking-wide text-[#1b4332]">
              {truncate(souvenir, 30)}
            </p>
          )}
          {data.foto && (
            <img
              src={data.foto}
              alt="Foto personalizada"
              className="mx-auto mb-1 h-10 w-10 rounded-full border border-[#1b4332] object-cover"
            />
          )}
          <p className="text-xs font-bold leading-tight text-[#1b4332]">{truncate(data.nombre || 'Tu nombre', 22)}</p>
          <p className="mt-0.5 text-[9px] text-gray-500">{truncate(data.carrera || '', 24)}</p>
          {year && (
            <span className="mt-1 inline-block rounded-full bg-[#1b4332] px-2 py-0.5 text-[9px] font-bold text-white">
              {year}
            </span>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-gray-400">{product?.name ?? 'Producto'} · URP PrintStudio</p>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-400">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300">
        <span className="text-sm font-bold">URP</span>
      </div>
      <p className="text-sm font-medium">Selecciona un producto para ver la preview</p>
    </div>
  );
}

function ProductFooter({ product, optionsSummary }: { product: Product | null; optionsSummary: string }) {
  return (
    <div className="mt-3 w-full border-t border-gray-100 pt-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-gray-400">
        {product ? `${product.name} · URP PrintStudio` : 'URP PrintStudio'}
      </p>
      {optionsSummary && <p className="mt-0.5 text-[10px] font-medium text-gray-500">{optionsSummary}</p>}
    </div>
  );
}

export function ProductPreview({
  previewRef,
  product,
  template,
  data,
  exactSouvenir,
  productOptions,
  defaultShape = 'badge',
}: ProductPreviewProps) {
  const slug = product?.slug ?? null;
  const shape = product ? getShape(slug, template, productOptions) : defaultShape;
  const frameClass = FRAME_CLASS[shape];
  const optionsSummary = formatOptions(productOptions);
  const isHorizontal = shape === 'horizontal';

  return (
    <div
      ref={previewRef}
      className={`relative mx-auto flex flex-col items-center justify-center overflow-hidden bg-white shadow-lg ${frameClass}`}
      style={{ padding: shape === 'badge' ? '0' : '2rem' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #1b4332 0, #1b4332 1px, transparent 0, transparent 50%)',
          backgroundSize: '10px 10px',
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
        {!product ? (
          <EmptyPreview />
        ) : slug === 'camisetas' ? (
          <ShirtPreview
            product={product}
            data={data}
            souvenir={exactSouvenir}
            optionsSummary={optionsSummary}
            productOptions={productOptions}
          />
        ) : shape === 'apparel' ? (
          <ApparelPreview product={product} data={data} souvenir={exactSouvenir} optionsSummary={optionsSummary} />
        ) : slug === 'posters' ? (
          <PosterPreview
            product={product}
            data={data}
            souvenir={exactSouvenir}
            optionsSummary={optionsSummary}
            isHorizontal={isHorizontal}
          />
        ) : shape === 'horizontal' ? (
          <MugPreview product={product} data={data} souvenir={exactSouvenir} optionsSummary={optionsSummary} />
        ) : shape === 'vertical' ? (
          <PosterPreview
            product={product}
            data={data}
            souvenir={exactSouvenir}
            optionsSummary={optionsSummary}
            isHorizontal={false}
          />
        ) : shape === 'badge' ? (
          <BadgePreview product={product} data={data} souvenir={exactSouvenir} />
        ) : (
          <EmptyPreview />
        )}
      </div>
    </div>
  );
}
