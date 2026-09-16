export type Metal = "gold" | "silver" | "platinum";

export type Purity = "24K" | "22K" | "18K" | "14K" | "925" | "950";

export type ProductCategory = string;

export type MakingCharge =
  | { type: "percentage"; value: number }
  | { type: "fixed"; value: number };

export interface Product {
  id: number;
  slug: string;
  sku: string;
  name: string;
  category: ProductCategory;
  categoryName?: string;
  categoryImage?: string | null;
  collection: string;
  collectionSlug?: string | null;
  metal: Metal;
  purity: Purity;
  grossWeight: number;
  netMetalWeight: number;
  makingCharge: MakingCharge;
  stoneCharge: number;
  discountPercentage: number;
  gstRate: number;
  rateOverridePerGram?: number;
  images: string[];
  stock: number;
  summary: string;
  description: string;
  videoUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  specifications: Record<string, string>;
  pricing?: PriceBreakdown;
}

export interface MetalRates {
  gold24k: number;
  silver999: number;
  platinum999: number;
}

export interface PriceBreakdown {
  metalValue: number;
  makingCharge: number;
  stoneCharge: number;
  discount: number;
  taxableValue: number;
  gst: number;
  total: number;
}

export interface CartLine {
  productId: number;
  slug: string;
  name: string;
  image: string;
  price: number;
  purity: Purity;
  quantity: number;
}
