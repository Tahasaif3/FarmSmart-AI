"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function LargeTestimonial() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl shadow-emerald-900/20"
        >
          {/* Decorative quote */}
          <div className="absolute -top-6 -left-6 text-emerald-400/30 text-8xl font-bold select-none">“</div>

          <div className="relative z-10">
            <blockquote className="text-center text-white text-xl md:text-2xl lg:text-4xl font-medium leading-relaxed md:leading-[1.4] lg:leading-[1.35] max-w-4xl mx-auto">
              FarmSmart AI transformed how we monitor crops. Real-time insights helped us reduce water usage by 35% and increase yield significantly—without adding field staff.
            </blockquote>

            <div className="mt-10 flex justify-center items-center gap-6">
              {/* Glowing avatar */}
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-70 blur transition-opacity duration-300" />
                <Image
                  src="/images/guillermo-rauch.png"
                  alt="Ahmed Khan"
                  width={64}
                  height={64}
                  className="relative w-16 h-16 rounded-full ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="text-left">
                <div className="text-white text-lg font-semibold">Ahmed Khan</div>
                <div className="text-emerald-200/80 text-base font-medium">CEO, Green Fields Farm</div>
              </div>
            </div>
          </div>

          {/* Subtle bottom accent bar */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full opacity-60" />
        </motion.div>
      </div>
    </section>
  );
}