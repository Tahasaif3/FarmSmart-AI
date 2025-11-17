"use client";

import type React from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    question: "What is FarmSmart and who is it for?",
    answer:
      "FarmSmart is an AI-powered farm management platform designed for farmers, agronomists, and agricultural businesses. It helps monitor crops, optimize irrigation, predict yields, and make data-driven decisions to improve productivity.",
  },
  {
    question: "How does FarmSmart monitor crop health?",
    answer:
      "Our AI analyzes soil data, weather patterns, and crop images in real-time. It identifies nutrient deficiencies, pest infestations, and potential diseases, providing actionable recommendations to keep crops healthy.",
  },
  {
    question: "Can I integrate FarmSmart with existing farm equipment?",
    answer:
      "Yes! FarmSmart offers easy integration with irrigation systems, sensors, drones, and other agricultural tools, allowing seamless data collection and automated farm management.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      "The free plan includes crop monitoring, basic soil analysis, limited sensor integrations, and real-time farm alerts. It’s perfect for small-scale farmers getting started with AI-driven agriculture.",
  },
  {
    question: "How do parallel AI agents help farms?",
    answer:
      "Parallel AI agents can analyze different fields or crops simultaneously, providing faster insights and optimizing multiple operations like irrigation, fertilization, and pest control at the same time.",
  },
  {
    question: "Is my farm data secure with FarmSmart?",
    answer:
      "Absolutely. We use enterprise-grade security with end-to-end encryption and secure cloud storage. Your farm data is private and never shared without your consent, and we also offer on-premises solutions for large enterprises.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  return (
    <div
      className={`group w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 ease-out cursor-pointer overflow-hidden hover:border-emerald-400/30 ${
        isOpen ? "border-emerald-400/50 shadow-lg shadow-emerald-500/10" : ""
      }`}
      onClick={onToggle}
      aria-expanded={isOpen}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
    >
      <div className="flex items-center justify-between p-5 md:p-6">
        <span
          className={`text-base md:text-lg font-medium text-left transition-colors duration-200 ${
            isOpen ? "text-emerald-100" : "text-white group-hover:text-emerald-50"
          }`}
        >
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-emerald-300 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden="true"
        />
      </div>

      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden px-5 pb-6 md:px-6 md:pb-7">
          <p className="text-emerald-100/80 text-sm md:text-base leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="w-full py-16 md:py-24 px-4 relative overflow-hidden">
      {/* Subtle animated background blob */}
      <div
        className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-l from-emerald-500/10 via-transparent to-teal-400/5 rounded-full blur-3xl opacity-20"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-emerald-100/80 text-base md:text-lg max-w-2xl mx-auto">
            Everything you need to know about FarmSmart and how it can transform your farm operations.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              {...faq}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}