"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [activeImage, setActiveImage] = useState(images[0]);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="productGallery">
      <button
        type="button"
        className={zoomed ? "galleryImage galleryImageMain galleryImageZoomed" : "galleryImage galleryImageMain"}
        onClick={() => setZoomed((value) => !value)}
        aria-label={zoomed ? "Zoom out product image" : "Zoom product image"}
        aria-pressed={zoomed}
      >
        <Image src={activeImage} alt={`${name} main view`} fill priority sizes="(max-width: 850px) 100vw, 50vw" />
        <span className="galleryZoomHint">{zoomed ? "Tap to zoom out" : "Tap to zoom"}</span>
      </button>
      {images.length > 1 && <div className="galleryThumbnails" aria-label="Product image gallery">
        {images.map((image, index) => (
          <button
            type="button"
            className={activeImage === image ? "galleryThumbnail galleryThumbnailActive" : "galleryThumbnail"}
            key={image}
            onClick={() => {
              setActiveImage(image);
              setZoomed(false);
            }}
            aria-label={`Show ${name} view ${index + 1}`}
            aria-pressed={activeImage === image}
          >
            <Image src={image} alt="" fill sizes="(max-width: 850px) 25vw, 12vw" />
          </button>
        ))}
      </div>}
    </div>
  );
}
