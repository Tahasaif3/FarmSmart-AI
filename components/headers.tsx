"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";

export function Header() {
  const navItems = [
    { name: "Features", href: "#features-section" },
    { name: "Pricing", href: "#pricing-section" },
    { name: "Testimonials", href: "#testimonials-section" },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Close mobile menu if open
      const sheetCloseButtons = document.querySelectorAll('[data-state="open"] button');
      sheetCloseButtons.forEach((btn) => (btn as HTMLElement).click?.());

      // Scroll smoothly
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Account for fixed header height
        behavior: "smooth",
      });

      // Update URL hash without page reload
      history.pushState(null, "", href);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                FarmSmart AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className="px-4 py-2 text-emerald-100/80 hover:text-emerald-100 font-medium rounded-lg transition-colors duration-200 hover:bg-white/5"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link href="/login" passHref>
              <Button
                variant="default"
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-900 font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-emerald-500/20 cursor-pointer transition-all duration-200"
              >
                Try for Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="top"
                className="bg-background border-b border-white/10 p-6 pt-16 backdrop-blur-md"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(e) => handleScroll(e, item.href)}
                      className="text-emerald-100/90 hover:text-emerald-100 text-lg font-medium py-2"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 mt-4 border-t border-white/10">
                    <Link href="/login" passHref>
                    <Button
  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-900 font-semibold py-5 rounded-full cursor-pointer"
  onClick={() => {
    const closeBtn = document.querySelector('[data-state="open"] [data-close]');
    (closeBtn as HTMLElement | null)?.click?.();
  }}
>
  Try for Free
</Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}