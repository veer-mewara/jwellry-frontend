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
  const [activeImage, setActiveImage] = useState(images[0] || "/assets/img/placeholder.jpg");
  const [zoomed, setZoomed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    e.currentTarget.style.setProperty('--x', `${x}%`);
    e.currentTarget.style.setProperty('--y', `${y}%`);
  };

  return (
    <div className="genz-product-gallery">
      <style>{`
        .genz-product-gallery {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .genz-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/5;
          overflow: hidden;
          border-radius: 16px;
          background: #f8f8f8;
          cursor: zoom-in;
        }
        .genz-main-image {
          object-fit: cover;
          transition: transform 0.15s ease-out;
          transform-origin: var(--x, 50%) var(--y, 50%);
          will-change: transform;
        }
        .genz-main-image.is-zoomed {
          transform: scale(2.2);
        }
        .genz-thumbnails {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }
        .genz-thumbnails::-webkit-scrollbar {
          display: none;
        }
        .genz-thumbnail-btn {
          position: relative;
          width: 80px;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          flex-shrink: 0;
          opacity: 0.6;
          transition: all 0.2s ease;
          background: #f8f8f8;
        }
        .genz-thumbnail-btn:hover {
          opacity: 1;
        }
        .genz-thumbnail-active {
          border-color: #111;
          opacity: 1;
        }
        .genz-thumbnail-btn img {
          object-fit: cover;
        }
      `}</style>

      <div
        className="genz-image-container"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setZoomed(true)}
        onTouchEnd={() => setZoomed(false)}
      >
        <Image 
          src={activeImage} 
          alt={`${name} main view`} 
          fill 
          priority 
          sizes="(max-width: 850px) 100vw, 50vw" 
          className={`genz-main-image ${zoomed ? 'is-zoomed' : ''}`}
        />
      </div>

      {images.length > 1 && (
        <div className="genz-thumbnails" aria-label="Product image gallery">
          {images.map((image, index) => (
            <button
              type="button"
              className={`genz-thumbnail-btn ${activeImage === image ? 'genz-thumbnail-active' : ''}`}
              key={image}
              onClick={() => {
                setActiveImage(image);
                setZoomed(false);
              }}
              aria-label={`Show ${name} view ${index + 1}`}
              aria-pressed={activeImage === image}
            >
              <Image src={image} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
