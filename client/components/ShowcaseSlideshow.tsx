"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Submission, getFeaturedShowcase } from "@/lib/api";
import { CoverImage } from "@/components/CoverImage";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Award,
  User as UserIcon,
} from "lucide-react";

interface ShowcaseSlideshowProps {
  onSelectProject?: (project: Submission) => void;
}

export function ShowcaseSlideshow({ onSelectProject }: ShowcaseSlideshowProps) {
  const [slides, setSlides] = useState<Submission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch top rated / featured projects
  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        setLoading(true);
        const res = await getFeaturedShowcase();
        if (isMounted && res.featured && res.featured.length > 0) {
          setSlides(res.featured);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch featured projects:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto rotation timer (5 seconds)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (loading) {
    return (
      <div className="w-full h-80 sm:h-96 rounded-3xl bg-slate-900/60 border border-white/10 animate-pulse flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
          <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
          <span>Curating Featured Projects...</span>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null; // Gracefully hidden if no approved projects exist yet
  }

  const current = slides[currentIndex];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[380px] sm:h-[420px] rounded-3xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl group select-none"
    >
      {/* Background Cover Image with Ken Burns Subtle Zoom */}
      <div className="absolute inset-0 overflow-hidden">
        <CoverImage
          key={current.id}
          screenshotUrl={current.screenshotUrl}
          category={current.category}
          alt={current.projectName}
          className="w-full h-full object-cover animate-ken-burns filter brightness-75 scale-100 transition-transform duration-1000"
        />
        {/* Multi-layered cinematic gradient backdrops */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
      </div>

      {/* Slide Content Overlay */}
      <div className="relative z-10 h-full max-w-4xl mx-auto px-6 sm:px-12 flex flex-col justify-end pb-12 sm:pb-14 space-y-4">
        {/* Top Feature Tag & Rating */}
        <div className="flex items-center gap-2.5 animate-slide-in-down">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20">
            <Award className="w-3.5 h-3.5" /> FEATURED SPOTLIGHT
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-blue-300 border border-blue-500/30 backdrop-blur-md">
            {current.category || "Full Stack"}
          </span>
          {current.rating && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 text-amber-400 border border-amber-500/30 backdrop-blur-md">
              <StarRating value={current.rating} readOnly size="sm" />
              <span className="text-xs font-bold text-amber-400">
                {current.rating}.0 / 5
              </span>
            </div>
          )}
        </div>

        {/* Headline / Project Title */}
        <h2
          key={`title-${current.id}`}
          className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight line-clamp-1 drop-shadow-md animate-fade-in-up"
        >
          {current.projectName}
        </h2>

        {/* Narrative Excerpt */}
        <p
          key={`desc-${current.id}`}
          className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          {current.description}
        </p>

        {/* Author details & Action Buttons */}
        <div
          key={`actions-${current.id}`}
          className="flex flex-wrap items-center justify-between gap-4 pt-2 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          {/* Author info */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <UserIcon className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">
              {current.student?.name || "Student Developer"}
            </span>
            <span>•</span>
            <span>Reviewed by Mentor</span>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {current.liveUrl && (
              <a
                href={current.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 backdrop-blur-md transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Demo</span>
              </a>
            )}

            <Button
              onClick={() => onSelectProject && onSelectProject(current)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <span>Explore Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sleek Navigation Arrows (visible on hover or focus) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-20 pointer-events-auto">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? "w-8 h-2 bg-blue-500 shadow-md shadow-blue-500/50"
                  : "w-2 h-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
