import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const CART_STORAGE_KEY = 'urp-cart-v1';

export type CartItem = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  templateId: string | null;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCareer: string;
  graduationYear: number | null;
  exactSouvenir: string | null;
  productOptions: Record<string, string>;
  canvasData: Record<string, unknown>;
  productionNotes: string;
};

type AddCartItemInput = Omit<CartItem, 'id'>;

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function createCartId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeItem(item: CartItem): CartItem {
  return {
    ...item,
    quantity: Math.max(1, Number.parseInt(String(item.quantity), 10) || 1),
    unitPrice: Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : 0,
    productOptions: item.productOptions ?? {},
    canvasData: item.canvasData ?? {},
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed.map(normalizeItem));
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar el carrito local.', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isHydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = Number(
      items.reduce((total, item) => total + item.unitPrice * item.quantity, 0).toFixed(2),
    );

    return {
      items,
      itemCount,
      subtotal,
      addItem: (item) => {
        setItems((current) => [
          ...current,
          normalizeItem({
            ...item,
            id: createCartId(),
          }),
        ]);
      },
      removeItem: (itemId) => {
        setItems((current) => current.filter((item) => item.id !== itemId));
      },
      updateQuantity: (itemId, quantity) => {
        setItems((current) =>
          current.map((item) =>
            item.id === itemId
              ? { ...item, quantity: Math.max(1, Number.parseInt(String(quantity), 10) || 1) }
              : item,
          ),
        );
      },
      clearCart: () => {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider.');
  }

  return context;
}
