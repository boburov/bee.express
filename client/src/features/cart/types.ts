/**
 * Mirrors server/src/cart/cart.service.ts → `serialize()`.
 * Keep in sync if backend shape changes.
 */
export interface CartItem {
  id: string;
  offerId: string;
  qty: number;
  price: number;
  livePrice: number;
  priceChanged: boolean;
  stock: number;
  subtotal: number;
  product: {
    id: string;
    slug: string;
    title: string;
    image: string | null;
  };
  variant: {
    id: string;
    sku: string | null;
  };
}

export interface CartStoreGroup {
  store: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    isOpen: boolean;
    status: string;
  };
  items: CartItem[];
  subtotal: number;
}

export interface Cart {
  id: string | null;
  itemCount: number;
  subtotal: number;
  stores: CartStoreGroup[];
  itemIds: string[];
}
