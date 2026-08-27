"use client";

import { useEffect, useRef } from "react";
import { HeroSearchPanel } from "@/components/HeroSearchPanel";

const HERO_VIDEO = "/videos/hero-home.mp4?v=2";
const HERO_POSTER = "/videos/hero-poster.jpg?v=2";

export function HeroExperience() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    tryPlay();
    video.addEventListener("canplay", tryPlay);
    return () => video.removeEventListener("canplay", tryPlay);
  }, []);

  return (
    <section className="relative bg-[color:var(--navy)]">
      <div className="relative h-[74svh] min-h-[460px] max-h-[780px] overflow-hidden bg-[color:var(--navy-deep)]">
        <video
          ref={videoRef}
          className="hero-video-bg absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_POSTER}
          aria-hidden
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        {/* Soft cinematic edge polish */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,21,37,0.35)_100%)]"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-[color:var(--navy)] to-transparent"
        />

        <div className="pointer-events-none absolute inset-x-0 top-28 z-10 px-6 text-center md:top-32 md:px-10">
          <p className="text-xs tracking-[0.4em] text-[color:var(--gold)] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-sm">
            The region&apos;s trusted estate agent
          </p>
          <h1 className="font-display hero-shimmer mt-3 max-w-4xl text-4xl leading-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] md:mx-auto md:text-6xl lg:text-7xl">
            Discover Your Dream Home
          </h1>
        </div>
      </div>

      <div className="relative z-20 bg-[color:var(--navy)] px-6 pb-10 pt-8 md:px-10 md:pb-12 md:pt-10">
        <HeroSearchPanel />
      </div>
    </section>
  );
}
