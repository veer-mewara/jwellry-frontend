import { describe, expect, it } from "vitest";
import { PRODUCT_PLACEHOLDER, firstImage, productImages } from "./product-image";

describe("product images", () => {
  it("keeps the product's own photos in order", () => {
    expect(productImages([{ path: "/a.jpg" }, { path: "/b.jpg" }])).toEqual(["/a.jpg", "/b.jpg"]);
  });

  it.each([[[]], [null], [undefined], [[{ path: "" }, { path: null }]]])(
    "falls back to the placeholder when there is no photo (%j)",
    (images) => {
      expect(productImages(images as never)).toEqual([PRODUCT_PLACEHOLDER]);
    },
  );

  it("skips empty paths but keeps real ones", () => {
    expect(productImages([{ path: "" }, { path: "/b.jpg" }])).toEqual(["/b.jpg"]);
  });

  it("gives the first photo or the placeholder, never undefined", () => {
    expect(firstImage(["/a.jpg"])).toBe("/a.jpg");
    expect(firstImage([])).toBe(PRODUCT_PLACEHOLDER);
    expect(firstImage(undefined)).toBe(PRODUCT_PLACEHOLDER);
  });

  it("points at a file that exists in public/", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    expect(existsSync(join(process.cwd(), "public", PRODUCT_PLACEHOLDER))).toBe(true);
  });
});
