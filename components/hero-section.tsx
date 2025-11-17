import React from "react";
import { Button } from "@/components/ui/button";
import { Header } from "./headers";
import Link from "next/link";

export function HeroSection() {
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
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Glowing Animated Gradient Button */}
         <Link href="/login" target="_blank" rel="noopener noreferrer">
  <div className="relative group">
    {/* Animated gradient border */}
    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 opacity-75 blur-xl animate-gradient-rotation"></div>
    
    {/* Button */}
    <Button className="relative bg-primary text-primary-foreground px-10 py-4 rounded-full font-semibold text-lg shadow-xl shadow-emerald-500/30 transition-all duration-300 transform 
                       group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-teal-500/40 active:scale-95">
      Get Started
    </Button>

    {/* Optional ripple effect */}
    <span className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-500 group-active:opacity-10"></span>
  </div>
</Link>


          <Link href="#features-section">
            <Button
              variant="outline"
              className="bg-transparent border border-white/30 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-medium text-lg transition-all backdrop-blur-sm"
            >
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Decorative bottom wave gradient */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[1800px] h-[500px] bg-gradient-to-r from-emerald-600/20 via-green-500/10 to-transparent rounded-t-[50%] blur-3xl z-0 animate-pulse-slow"></div>
    </section>
  );
}