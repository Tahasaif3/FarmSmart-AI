"use client";

import Image from "next/image";

const testimonials = [
  {
    quote:
      "FarmSmart helped us optimize our crop yield predictions. The AI insights allowed us to plan irrigation and fertilizers efficiently, saving both time and resources.",
    name: "Sara Khan",
    company: "Green Fields Farm",
    avatar: "/images/avatars/annette-black.png",
    type: "large-teal",
  },
  {
    quote:
      "Integrating FarmSmart into our supply chain made tracking harvests effortless. Real-time updates reduced wastage and improved delivery accuracy.",
    name: "Ali Raza",
    company: "AgriLogistics Co.",
    avatar: "/images/avatars/dianne-russell.png",
    type: "small-dark",
  },
  {
    quote:
      "The soil analysis feature of FarmSmart is a game-changer. We can now detect nutrient deficiencies early and adjust treatments before crops are affected.",
    name: "Hina Sheikh",
    company: "Sunrise Organic Farms",
    avatar: "/images/avatars/cameron-williamson.png",
    type: "small-dark",
  },
  {
    quote:
      "FarmSmart's AI recommendations helped us optimize planting schedules across multiple fields. Our productivity increased by 20% in the first season.",
    name: "Omar Farooq",
    company: "AgriTech Solutions",
    avatar: "/images/avatars/robert-fox.png",
    type: "small-dark",
  },
  {
    quote:
      "We started with a trial and quickly realized FarmSmart was indispensable. Its predictive analytics transformed our farm management decisions.",
    name: "Zoya Ali",
    company: "Fresh Harvest Farms",
    avatar: "/images/avatars/darlene-robertson.png",
    type: "small-dark",
  },
  {
    quote:
      "FarmSmart's mobile alerts and monitoring tools allow our team to react to environmental changes immediately. Crop losses due to weather have reduced drastically.",
    name: "Bilal Hussain",
    company: "GreenLeaf Ventures",
    avatar: "/images/avatars/cody-fisher.png",
    type: "small-dark",
  },
  {
    quote:
      "Deploying FarmSmart across our multiple farm locations was seamless. Now, we can make data-driven decisions in real time without visiting each site physically.",
    name: "Farah Iqbal",
    company: "AgroGlobal Farms",
    avatar: "/images/avatars/albert-flores.png",
    type: "large-light",
  },
];

//@ts-expect-error: error
const TestimonialCard = ({ quote, name, company, avatar, type }) => {
  const isLargeCard = type.startsWith("large");
  const avatarSize = isLargeCard ? 48 : 36;
  const padding = isLargeCard ? "p-6" : "p-5";

  // Base classes
  let cardClasses = `relative flex flex-col justify-between overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg ${padding}`;
  let quoteClasses = "font-medium";
  let nameClasses = "font-semibold";
  let companyClasses = "font-medium";

  if (type === "large-teal") {
    cardClasses += " bg-gradient-to-br from-emerald-900/60 to-teal-900/40 border border-emerald-500/30 shadow-lg";
    quoteClasses += " text-emerald-100 text-xl md:text-2xl leading-relaxed";
    nameClasses += " text-emerald-100 text-base";
    companyClasses += " text-emerald-200/70 text-sm";
  } else if (type === "large-light") {
    cardClasses += " bg-white/5 backdrop-blur-sm border border-white/10";
    quoteClasses += " text-white text-xl md:text-2xl leading-relaxed";
    nameClasses += " text-white text-base";
    companyClasses += " text-emerald-100/70 text-sm";
  } else {
    cardClasses += " bg-white/5 backdrop-blur border border-white/10 hover:border-emerald-400/30";
    quoteClasses += " text-emerald-100/90 text-sm md:text-base leading-relaxed";
    nameClasses += " text-white text-sm";
    companyClasses += " text-emerald-100/60 text-xs";
  }

  return (
    <div className={cardClasses}>
      <blockquote className={quoteClasses}>{quote}</blockquote>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Image
            src={avatar || "/placeholder.svg"}
            alt={`${name} avatar`}
            width={avatarSize}
            height={avatarSize}
            className="rounded-full ring-1 ring-white/20"
          />
          {isLargeCard && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-900" />
          )}
        </div>
        <div>
          <div className={nameClasses}>{name}</div>
          <div className={companyClasses}>{company}</div>
        </div>
      </div>
    </div>
  );
};

export function TestimonialGridSection() {
  return (
    <section className="w-full py-12 md:py-20 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
          Farming Made Effortless
        </h2>
        <p className="mt-4 text-emerald-100/80 text-lg max-w-3xl mx-auto">
          Hear from farmers and agribusinesses who transformed their operations with FarmSmart AI.
        </p>
      </div>

      {/* Same 3-column masonry layout, enhanced */}
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <TestimonialCard {...testimonials[0]} />
          <TestimonialCard {...testimonials[1]} />
        </div>
        <div className="space-y-6">
          <TestimonialCard {...testimonials[2]} />
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
        </div>
        <div className="space-y-6">
          <TestimonialCard {...testimonials[5]} />
          <TestimonialCard {...testimonials[6]} />
        </div>
      </div>
    </section>
  );
}