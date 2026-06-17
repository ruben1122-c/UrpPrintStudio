import type { Product } from '@/types/database';

export const CUSTOMIZATION_DRAFT_KEY = 'urp-customization-draft-v1';

export type CustomizationDraftAction = 'download' | 'cart';

export type CustomizationDraftData = {
  nombre: string;
  carrera: string;
  año: string;
  email: string;
  telefono: string;
  cantidad: string;
  foto: string | null;
};

export type CustomizationDraft = {
  product: Product | null;
  data: CustomizationDraftData;
  exactSouvenir: string;
  productOptions: Record<string, string>;
  pendingAction?: CustomizationDraftAction;
};

export function saveCustomizationDraft(draft: CustomizationDraft) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CUSTOMIZATION_DRAFT_KEY, JSON.stringify(draft));
}

export function readCustomizationDraft(): CustomizationDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawDraft = window.sessionStorage.getItem(CUSTOMIZATION_DRAFT_KEY);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as Partial<CustomizationDraft>;
    if (!draft.data || typeof draft.data !== 'object') return null;

    return {
      product: draft.product ?? null,
      data: {
        nombre: draft.data.nombre ?? '',
        carrera: draft.data.carrera ?? '',
        año: draft.data.año ?? '',
        email: draft.data.email ?? '',
        telefono: draft.data.telefono ?? '',
        cantidad: draft.data.cantidad ?? '1',
        foto: draft.data.foto ?? null,
      },
      exactSouvenir: draft.exactSouvenir ?? '',
      productOptions: draft.productOptions ?? {},
      pendingAction: draft.pendingAction,
    };
  } catch {
    return null;
  }
}

export function clearCustomizationDraft() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CUSTOMIZATION_DRAFT_KEY);
}
