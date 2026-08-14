"use client";

import { useState } from "react";

export function ProductImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Main image */}
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-surface-subtle p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={selected}
          src={images[selected]}
          alt={alt}
          className="max-h-72 w-full object-contain transition-opacity duration-200"
        />
      </div>

      {/* Thumbnails — only shown when there are multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={[
                "h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-surface-subtle p-1 transition-colors",
                i === selected
                  ? "border-orange-500"
                  : "border-transparent hover:border-gray-300",
              ].join(" ")}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-contain" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
