"use client";

import { useEffect, useRef } from "react";
import { heroVideo } from "@/data/site";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay may be blocked; poster still shows.
      }
    };

    void play();
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[color:var(--navy-deep)]">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={heroVideo.poster}
        >
          <source src={heroVideo.src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--navy)]/70 via-[color:var(--navy)]/40 to-[color:var(--navy)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
        <h1 className="font-display max-w-4xl text-5xl leading-tight font-normal text-white md:text-7xl lg:text-8xl">
          Discover Your Dream Home
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--muted)] md:text-lg">
          Sales, lettings, removals and valuations — your complete moving
          solution across Bradford and West Yorkshire.
        </p>
      </div>
    </section>
  );
}
