"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { Header } from "./headers";
import { StardustButton } from "@/components/ui/StardustButton";
import Link from "next/link";
import { useRouter } from "next/navigation"



export function HeroSection() {
  const router = useRouter()
  return (
    <section className="relative w-full min-h-[800px] md:min-h-[900px] lg:min-h-[1000px] flex flex-col items-center justify-start bg-gradient-to-b from-green-900 via-green-800 to-emerald-900 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <Header />
      </div>

      {/* Animated floating tech orbs (more dynamic) */}
      <div className="absolute inset-0 z-10 opacity-70">
        <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="150" r="80" fill="rgba(74, 222, 128, 0.15)" className="animate-float-slow" />
          <circle cx="1200" cy="300" r="120" fill="rgba(16, 185, 129, 0.2)" className="animate-float" />
          <circle cx="700" cy="600" r="100" fill="rgba(34, 197, 94, 0.1)" className="animate-float-slow delay-1000" />
          <circle cx="400" cy="750" r="60" fill="rgba(134, 239, 172, 0.1)" className="animate-float" />
        </svg>
      </div>

      {/* Hero content */}
      <div className="relative z-20 text-center mt-32 md:mt-40 lg:mt-48 px-6 max-w-3xl">
        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-md">
          Revolutionize Agriculture with <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="mt-6 text-green-100 text-lg md:text-xl lg:text-2xl font-medium leading-relaxed max-w-2xl mx-auto">
          Harness autonomous AI agents to optimize farming, predict yields, and automate workflows—making agriculture smarter, faster, and sustainable.
        </p>

        {/* CTA Buttons */}
<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
  {/* Neon Glowing Gradient Button */}
  <Link href="/login" target="_blank" rel="noopener noreferrer">
    <div className="relative group">
      {/* Animated Neon Glow Background */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-80 blur-2xl animate-gradient-rotation"></div>
      
      {/* Button */}
      {/* <Button className="relative bg-[#0f1f14] text-white px-16 py-5 md:px-20 md:py-6 rounded-full font-bold text-xl md:text-2xl shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 transform
                         group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.8)] active:scale-95">
        Get Started
      </Button> */}
   <StardustButton onClick={() => router.push("/login")}>
        Get Started
      </StardustButton>
      {/* Optional Ripple Effect */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-500 group-active:opacity-10"></span>
    </div>
  </Link>

  {/* Neon Outline Button */}
<Link href="#features-section">
  <button
    className="stardust-button relative group"
    style={{
      '--white': '#e6f3ff',
      '--bg': '#0a1929',
      '--radius': '60px', // slightly smaller radius
      outline: 'none',
      cursor: 'pointer',
      border: 0,
      position: 'relative',
      borderRadius: 'var(--radius)',
      background: 'linear-gradient(135deg, #22c55e, #10b981, #34d399)', // brighter green gradient
      transition: 'all 0.25s ease',
      boxShadow: `
        inset 0 0.2rem 0.5rem rgba(34, 197, 94, 0.35),
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.5),
        0 0 2rem rgba(16, 185, 129, 0.7),
        0 0.3rem 0.7rem rgba(34, 197, 94, 0.9)
      `,
    }}
  >
    <div
      className="wrap"
      style={{
        fontSize: '20px', // slightly smaller font
        fontWeight: 600,
        color: 'rgba(0, 255, 150, 0.95)',
        padding: '14px 32px', // smaller padding for better fit
        borderRadius: 'inherit',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: 0,
          transition: 'all 0.25s ease',
          transform: 'translateY(2%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,255,150,1) 40%, transparent)',
        }}
      >
        <span>✧</span>
        <span>✦</span>
        Learn More
      </p>
    </div>

    <style>{`
      .stardust-button .wrap::before,
      .stardust-button .wrap::after {
        content: "";
        position: absolute;
        transition: all 0.3s ease;
      }

      .stardust-button .wrap::before {
        left: -15%;
        right: -15%;
        bottom: 25%;
        top: -120%;
        border-radius: 50%;
        background-color: rgba(0, 255, 150, 0.18); // brighter neon glow
      }

      .stardust-button .wrap::after {
        left: 6%;
        right: 6%;
        top: 12%;
        bottom: 40%;
        border-radius: 22px 22px 0 0;
        box-shadow: inset 0 10px 8px -8px rgba(0, 255, 150, 0.6);
        background: linear-gradient(
          180deg,
          rgba(0, 255, 150, 0.25) 0%,
          rgba(0, 0, 0, 0) 50%,
          rgba(0, 0, 0, 0) 100%
        );
      }

      .stardust-button:hover .wrap p span:nth-child(1) { display: none; }
      .stardust-button:hover .wrap p span:nth-child(2) { display: inline-block; }

      .stardust-button:hover {
        box-shadow:
          inset 0 0.3rem 0.6rem rgba(0, 255, 150, 0.45),
          inset 0 -0.15rem 0.35rem rgba(0,0,0,0.6),
          0 0 3rem rgba(0,255,150,0.8),
          0 0.5rem 1rem rgba(34, 197, 94, 0.9);
      }

      .stardust-button:hover .wrap::before { transform: translateY(-5%); }
      .stardust-button:hover .wrap::after { opacity: 0.45; transform: translateY(5%); }
      .stardust-button:hover .wrap p { transform: translateY(-4%); }
      .stardust-button:active { transform: translateY(3px); }
    `}</style>
  </button>
</Link>



</div>

      </div>

      {/* Decorative bottom wave gradient */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[1800px] h-[500px] bg-gradient-to-r from-emerald-600/20 via-green-500/10 to-transparent rounded-t-[50%] blur-3xl z-0 animate-pulse-slow"></div>
    </section>
  );
}