"use client";

// SafeImage — next/image with graceful fallback handling. If the source fails
// to load (dead Unsplash URL, removed Storage object, network error), it swaps
// to an optional fallbackSrc; if that also fails (or none is given) it renders
// a neutral gradient placeholder instead of the browser's broken-image icon.

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  /** Optional replacement source tried before showing the placeholder. */
  fallbackSrc?: string;
  /** className applied to the placeholder wrapper (defaults to image className). */
  placeholderClassName?: string;
}

export default function SafeImage({
  src,
  fallbackSrc,
  placeholderClassName,
  alt,
  className,
  fill,
  ...rest
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center bg-gradient-to-br from-navy-900/10 to-navy-900/[0.03] ${
          fill ? "absolute inset-0" : ""
        } ${placeholderClassName ?? className ?? ""}`}
      >
        <ImageOff className="w-6 h-6 text-navy-900/20" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
