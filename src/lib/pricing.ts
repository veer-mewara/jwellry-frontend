import type {
  MetalRates,
  PriceBreakdown,
  Product,
  Purity,
} from "@/types/commerce";

const purityFactors: Record<Purity, number> = {
  "24K": 0.999,
  "22K": 0.916,
  "18K": 0.75,
  "14K": 0.585,
  "925": 0.925,
  "950": 0.95,
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function calculateProductPrice(
  product: Product,
  rates: MetalRates,
): PriceBreakdown {
  const baseRate =
    product.rateOverridePerGram ??
    (product.metal === "gold"
      ? rates.gold24k
      : product.metal === "silver"
        ? rates.silver999
        : rates.platinum999);

  const metalValue = roundMoney(
    baseRate * purityFactors[product.purity] * product.netMetalWeight,
  );
  const makingCharge = roundMoney(
    product.makingCharge.type === "percentage"
      ? metalValue * (product.makingCharge.value / 100)
      : product.makingCharge.value,
  );
  const beforeDiscount = metalValue + makingCharge + product.stoneCharge;
  const discount = roundMoney(
    beforeDiscount * (product.discountPercentage / 100),
  );
  const taxableValue = roundMoney(beforeDiscount - discount);
  const gst = roundMoney(taxableValue * (product.gstRate / 100));

  return {
    metalValue,
    makingCharge,
    stoneCharge: product.stoneCharge,
    discount,
    taxableValue,
    gst,
    total: roundMoney(taxableValue + gst),
  };
}

export function getProductPrice(product: Product): PriceBreakdown {
  return product.pricing ?? calculateProductPrice(product, {
    gold24k: 7000,
    silver999: 95,
    platinum999: 3100,
  });
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
