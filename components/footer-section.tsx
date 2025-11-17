"use client";

import { Twitter, Github, Linkedin } from "lucide-react";
import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand & Description */}
        <div className="space-y-6">
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              FarmSMart AI
            </div>
            <p className="mt-2 text-emerald-100/80 text-sm leading-relaxed max-w-xs">
              AI-powered insights for smarter, sustainable farming—helping growers feed the future.
            </p>
          </div>
          <div className="flex gap-4">
            <SocialLink href="#" aria-label="Twitter">
              <Twitter className="w-5 h-5 text-emerald-200 hover:text-emerald-100 transition-colors" />
            </SocialLink>
            <SocialLink href="#" aria-label="GitHub">
              <Github className="w-5 h-5 text-emerald-200 hover:text-emerald-100 transition-colors" />
            </SocialLink>
            <SocialLink href="#" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5 text-emerald-200 hover:text-emerald-100 transition-colors" />
            </SocialLink>
          </div>
        </div>

        {/* Solutions */}
        <div>
          <h3 className="text-emerald-200/90 font-semibold text-sm uppercase tracking-wider mb-4">Solutions</h3>
          <FooterLink href="#">Crop Health Monitoring</FooterLink>
          <FooterLink href="#">Smart Irrigation</FooterLink>
          <FooterLink href="#">Soil Analysis</FooterLink>
          <FooterLink href="#">Yield Prediction</FooterLink>
          <FooterLink href="#">Farm Automation</FooterLink>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-emerald-200/90 font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
          <FooterLink href="#">About Us</FooterLink>
          <FooterLink href="#">Our Mission</FooterLink>
          <FooterLink href="#">Careers</FooterLink>
          <FooterLink href="#">Blog</FooterLink>
          <FooterLink href="#">Contact</FooterLink>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-emerald-200/90 font-semibold text-sm uppercase tracking-wider mb-4">Resources</h3>
          <FooterLink href="#">Documentation</FooterLink>
          <FooterLink href="#">API Reference</FooterLink>
          <FooterLink href="#">Help Center</FooterLink>
          <FooterLink href="#">Community</FooterLink>
          <FooterLink href="#">Privacy Policy</FooterLink>
          <FooterLink href="#">Terms of Service</FooterLink>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-16 pt-8 border-t border-white/10 text-center">
        <p className="text-emerald-100/60 text-sm">
          © {new Date().getFullYear()} FarmAgri. All rights reserved. Cultivating intelligence for a greener world.
        </p>
      </div>
    </footer>
  );
}

// --- Reusable Components ---
const SocialLink = ({ children, ...props }: React.ComponentProps<"a">) => (
  <a
    {...props}
    className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-emerald-500/10 transition-colors duration-200"
  >
    {children}
  </a>
);

const FooterLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <Link
    href={href}
    className="block py-1.5 text-emerald-100/80 text-sm hover:text-emerald-100 transition-colors duration-200"
  >
    {children}
  </Link>
);