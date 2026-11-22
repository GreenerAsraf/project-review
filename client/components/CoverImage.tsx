"use client";

import React, { useState, useEffect } from "react";

interface CoverImageProps {
  screenshotUrl?: string | null;
  category?: string | null;
  alt: string;
  className?: string;
}

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  "Full Stack": "/placeholders/fullstack.svg",
  "Frontend": "/placeholders/frontend.svg",
  "API & Backend": "/placeholders/backend.svg",
  "Mobile": "/placeholders/mobile.svg",
  "UI/UX": "/placeholders/uiux.svg",
};

export function CoverImage({
  screenshotUrl,
  category,
  alt,
  className = "w-full h-44 object-cover",
}: CoverImageProps) {
  const fallbackSrc =
    (category && CATEGORY_PLACEHOLDERS[category]) || "/placeholders/default.svg";

  const [src, setSrc] = useState<string>(
    screenshotUrl && screenshotUrl.trim().length > 0 ? screenshotUrl.trim() : fallbackSrc
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (screenshotUrl && screenshotUrl.trim().length > 0) {
      setSrc(screenshotUrl.trim());
      setHasError(false);
    } else {
      setSrc(fallbackSrc);
      setHasError(false);
    }
  }, [screenshotUrl, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={handleError}
      className={className}
    />
  );
}
