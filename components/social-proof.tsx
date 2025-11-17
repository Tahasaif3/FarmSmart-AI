"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export function SocialProof() {
  const logos = Array.from({ length: 8 }, (_, i) => `/logos/logo0${i + 1}.svg`);
  const [isHovered, setIsHovered] = useState(false);

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos];

  return (
    <section className="w-full py-16 px-4 md:px-6 overflow-hidden">
      <div className="text-center mb-12">
        <p className="text-emerald-200/90 text-sm font-semibold tracking-wider uppercase">
          Trusted by innovators
        </p>
        <h2 className="mt-2 text-white text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
          Powering the future of agriculture
        </h2>
      </div>

      {/* Desktop: Animated Marquee */}
      <div className="hidden md:block">
        <div
          className="flex w-max animate-scroll-x"
          style={{
            animationDuration: isHovered ? "paused" : "40s",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {duplicatedLogos.map((src, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center mx-6 first:ml-0 last:mr-0 group"
            >
              <div className="relative w-32 h-16 md:w-40 md:h-20 flex items-center justify-center">
                {/* Glowing glass card */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300" />
                <Image
                  src={src}
                  alt={`Partner ${i + 1}`}
                  width={160}
                  height={80}
                  className="relative z-10 w-full h-full object-contain grayscale opacity-70 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Static grid with subtle hover */}
      <div className="md:hidden grid grid-cols-3 sm:grid-cols-4 gap-6 justify-items-center">
        {logos.map((src, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center group"
          >
            <div className="relative w-24 h-12 sm:w-32 sm:h-16 flex items-center justify-center">
              <div className="absolute inset-0 bg-white/5 backdrop-blur rounded-lg border border-white/10 group-hover:border-emerald-400/30 transition-colors duration-300" />
              <Image
                src={src}
                alt={`Partner ${i + 1}`}
                width={120}
                height={60}
                className="relative z-10 w-full h-full object-contain grayscale opacity-70 group-hover:opacity-100 group-hover:grayscale-0 transition-opacity duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}