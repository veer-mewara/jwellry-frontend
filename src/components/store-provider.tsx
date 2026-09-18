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
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

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
  pricing: { total: number };
}

async function reconcileCartWithCatalog() {
  if (!API_URL) return null;

  try {
    const response = await fetch(`${API_URL}/api/products?per_page=60`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: CatalogCartProduct[] };
    return new Map((payload.data || []).map((product) => [product.id, product]));
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
      setCart(readStorage<CartLine[]>(CART_KEY, []));
      setWishlist(readStorage<number[]>(WISHLIST_KEY, []));
      setCouponCode(readStorage<string>(COUPON_KEY, ""));
      setHydrated(true);

      void reconcileCartWithCatalog().then((catalog) => {
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
            ? { ...line, quantity: line.quantity + Math.max(quantity, 1) }
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
          quantity: Math.max(quantity, 1),
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
        line.productId === productId ? { ...line, quantity } : line,
      ),
    );
  }, []);

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
      setCouponCode,
    }),
    [
      addToCart,
      cart,
      couponCode,
      removeFromCart,
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
