/** Shown wherever a product has no photo yet (a missing file would show a broken image). */
export const PRODUCT_PLACEHOLDER = "/assets/img/placeholder.png";

/** The product's photo paths, or just the placeholder: lists of images are never empty. */
export function productImages(images: Array<{ path?: string | null }> | null | undefined): string[] {
  const paths = (images ?? []).map((image) => image.path ?? "").filter(Boolean);
  return paths.length ? paths : [PRODUCT_PLACEHOLDER];
}

export function firstImage(images: string[] | null | undefined): string {
  return images?.[0] || PRODUCT_PLACEHOLDER;
}
