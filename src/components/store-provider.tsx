"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, Product } from "@/types/commerce";
import { getProductPrice } from "@/lib/pricing";

const CART_KEY = "sonaro_cart_v1";
const WISHLIST_KEY = "sonaro_wishlist_v1";
const COUPON_KEY = "sonaro_coupon_v1";
export const MAX_LINE_QUANTITY = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

/** Highest quantity a customer may order of one piece: min(10, stock). */
export function maxQuantityFor(stock: number | undefined) {
  if (stock === undefined || !Number.isFinite(stock)) return MAX_LINE_QUANTITY;
  return Math.max(0, Math.min(MAX_LINE_QUANTITY, Math.floor(stock)));
}

function clampQuantity(quantity: number, stock: number | undefined) {
  const limit = maxQuantityFor(stock);
  const safe = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  // A sold-out line keeps quantity 1; it is flagged as unavailable instead.
  return Math.max(1, Math.min(safe, limit || 1));
}

interface StoreContextValue {
  cart: CartLine[];
  wishlist: number[];
  cartCount: number;
  subtotal: number;
  couponCode: string;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  toggleWishlist: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
  clearCart: () => void;
  /**
   * Removes only lines that are no longer sold (missing from the catalogue or
   * out of stock). Resolves to the number removed, or null if the catalogue
   * could not be checked (the bag is left untouched in that case).
   */
  removeUnavailableItems: () => Promise<number | null>;
  setCouponCode: (code: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface CatalogCartProduct {
  id: number;
  slug: string;
  name: string;
  purity: CartLine["purity"];
  images: Array<{ path: string }>;
  stock_quantity?: number;
  pricing: { total: number };
}

async function reconcileCartWithCatalog(productIds: number[]) {
  if (!API_URL || !productIds.length) return null;

  try {
    const ids = Array.from(new Set(productIds)).join(",");
    const response = await fetch(`${API_URL}/api/products?ids=${ids}&per_page=60`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    // Only a successful response proves a product is gone; otherwise keep the bag.
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: CatalogCartProduct[] };
    if (!Array.isArray(payload.data)) return null;
    return new Map(payload.data.map((product) => [product.id, product]));
  } catch {
    // Keep the saved bag intact if the API is temporarily unreachable.
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storageRead = window.setTimeout(() => {
      const storedCart = readStorage<unknown>(CART_KEY, []);
      const savedCart = Array.isArray(storedCart) ? (storedCart as CartLine[]) : [];
      setCart(savedCart.map((line) => ({
        ...line,
        quantity: clampQuantity(line.quantity, line.stock),
      })));
      setWishlist(readStorage<number[]>(WISHLIST_KEY, []));
      setCouponCode(readStorage<string>(COUPON_KEY, ""));
      setHydrated(true);

      if (!savedCart.length) return;

      void reconcileCartWithCatalog(savedCart.map((line) => line.productId)).then((catalog) => {
        if (!catalog) return;

        setCart((current) => current.flatMap((line) => {
          const product = catalog.get(line.productId);
          if (!product || !product.images[0]?.path) return [];

          return [{
            ...line,
            slug: product.slug,
            name: product.name,
            image: product.images[0].path,
            price: product.pricing.total,
            purity: product.purity,
            stock: product.stock_quantity ?? line.stock,
            quantity: clampQuantity(line.quantity, product.stock_quantity ?? line.stock),
          }];
        }));
      });
    }, 0);
    return () => window.clearTimeout(storageRead);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(COUPON_KEY, couponCode);
  }, [couponCode, hydrated]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    const price = getProductPrice(product).total;
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? {
                ...line,
                stock: product.stock,
                quantity: clampQuantity(line.quantity + Math.max(quantity, 1), product.stock),
              }
            : line,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price,
          purity: product.purity,
          quantity: clampQuantity(Math.max(quantity, 1), product.stock),
          stock: product.stock,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((current) =>
      current.filter((line) => line.productId !== productId),
    );
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) return;
    setCart((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: clampQuantity(quantity, line.stock) }
          : line,
      ),
    );
  }, []);

  const removeUnavailableItems = useCallback(async () => {
    const catalog = await reconcileCartWithCatalog(cart.map((line) => line.productId));
    if (!catalog) return null;
    const unavailable = new Set(
      cart
        .filter((line) => {
          const product = catalog.get(line.productId);
          return !product || (product.stock_quantity ?? 1) <= 0;
        })
        .map((line) => line.productId),
    );
    if (unavailable.size) {
      setCart((current) => current.filter((line) => !unavailable.has(line.productId)));
    }
    return unavailable.size;
  }, [cart]);

  const toggleWishlist = useCallback((productId: number) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      wishlist,
      cartCount: cart.reduce((count, line) => count + line.quantity, 0),
      subtotal: cart.reduce(
        (total, line) => total + line.price * line.quantity,
        0,
      ),
      couponCode,
      addToCart,
      removeFromCart,
      setQuantity,
      toggleWishlist,
      isWishlisted: (productId) => wishlist.includes(productId),
      clearCart: () => {
        setCart([]);
        setCouponCode("");
      },
      removeUnavailableItems,
      setCouponCode,
    }),
    [
      addToCart,
      cart,
      couponCode,
      removeFromCart,
      removeUnavailableItems,
      setQuantity,
      toggleWishlist,
      wishlist,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
