"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const pricingPlans = [
    {
      name: "Starter",
      monthlyPrice: "$0",
      annualPrice: "$0",
      description: "Ideal for small farms getting started with AI.",
      features: [
        "Basic crop monitoring",
        "Weather alerts",
        "Soil analysis reports",
        "Up to 2 AI farm agents",
        "Mobile app access",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
    },
    {
      name: "Professional",
      monthlyPrice: "$50",
      annualPrice: "$40",
      description: "Perfect for growing farms looking to optimize yield.",
      features: [
        "Advanced crop and soil analysis",
        "Multiple farm integration",
        "Up to 10 AI farm agents",
        "Automated irrigation recommendations",
        "Priority support",
      ],
      buttonText: "Join Now",
      buttonVariant: "default",
      popular: true,
    },
    {
      name: "Enterprise",
      monthlyPrice: "$500",
      annualPrice: "$400",
      description: "Tailored solutions for large agricultural businesses.",
      features: [
        "Custom farm dashboards",
        "Unlimited AI agents",
        "Full API & IoT integration",
        "Enterprise-grade security",
        "Dedicated account manager",
      ],
      buttonText: "Talk to Sales",
      buttonVariant: "secondary",
    },
  ];

  return (
    <section className="w-full py-16 md:py-24 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Pricing built for every <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">Farmer</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-emerald-100/80 text-lg font-medium">
            From individual growers to agribusinesses—scale your farm with AI that fits your needs.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="relative flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1 w-fit">
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                isAnnual
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              Annually <span className="hidden md:inline"> (Save 20%)</span>
            </button>
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                !isAnnual
                  ? "bg-white/10 text-white"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 flex flex-col h-full transition-all duration-500 ${
                plan.popular
                  ? "bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/30 shadow-xl shadow-emerald-500/10 scale-[1.03] md:scale-105"
                  : "bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="relative px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg shadow-emerald-500/30 animate-pulse-slow">
                    <span className="text-xs font-bold text-emerald-900 tracking-wide">
                      MOST POPULAR
                    </span>
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-20" />
                  </div>
                </div>
              )}

              <div className="flex flex-col flex-grow">
                {/* Plan Name */}
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? "text-emerald-100" : "text-white"}`}>
                  {plan.name}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-6 ${plan.popular ? "text-emerald-100/80" : "text-emerald-100/60"}`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-2">
                    <span className="relative block text-4xl md:text-5xl font-bold text-white">
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className={`text-emerald-200/70 ${plan.popular ? "text-emerald-100/70" : ""}`}>
                      /month
                    </span>
                  </div>
                  {isAnnual && plan.monthlyPrice !== "$0" && (
                    <p className="text-emerald-300/70 text-sm mt-1">
                      billed annually (${plan.monthlyPrice}/mo equivalent)
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <div className="mt-auto pt-4">
                  <Button
                    variant={plan.buttonVariant as any}
                    className={`w-full rounded-full font-semibold py-5 text-base transition-transform hover:scale-[1.02] ${
                      plan.popular
                        ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-900 shadow-lg shadow-emerald-500/30"
                        : plan.buttonVariant === "outline"
                        ? "border-white/20 text-white hover:bg-white/10"
                        : ""
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 ${
                          plan.popular ? "text-emerald-400" : "text-emerald-300"
                        }`}
                        strokeWidth={2.5}
                      />
                      <span className={plan.popular ? "text-emerald-100" : "text-emerald-100/80"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}