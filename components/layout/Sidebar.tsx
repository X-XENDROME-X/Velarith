"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  FlaskConical,
  X,
  Menu,
} from "lucide-react";

// M5: /analytics renamed to /research. Markets detail lives at /markets/[slug].
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Markets", href: "/markets", icon: TrendingUp },
  { name: "Research", href: "/research", icon: FlaskConical },
  { name: "Assistant", href: "/assistant", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileOpen]);

  const sidebarPositionClass = isMobile
    ? "top-16 left-0 sidebar-mobile-height"
    : "top-0 h-full lg:left-0";

  return (
    <>
      {/* Mobile/Tablet top bar */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] h-16 bg-[#0B1120]/98 backdrop-blur-2xl border-b border-white/10 shadow-xl pt-[env(safe-area-inset-top,0px)]">
          <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-6">
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2.5"
              aria-label="Go to dashboard"
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full" />
                <Image
                  src="/images/tlogo.png"
                  alt="Velarith logo"
                  width={32}
                  height={32}
                  className="relative z-10 h-8 w-8 object-contain drop-shadow-lg sm:h-9 sm:w-9"
                />
              </div>
              <span className="truncate text-base font-semibold gradient-text sm:text-lg">
                Velarith
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Backdrop overlay for mobile */}
      {isMobileOpen && isMobile && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={cn(
          "flex flex-col fixed bg-[#0B1120]/98 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-out z-50",
          // Positioning
          sidebarPositionClass,
          // Desktop: hover expand behavior
          isHovered && !isMobile ? "lg:w-72" : "lg:w-20",
          // Mobile: slide in from left
          isMobile
            ? isMobileOpen
              ? "w-[300px] translate-x-0 shadow-2xl"
              : "-translate-x-full w-[300px]"
            : "translate-x-0",
          // Smooth width transition on desktop
          "will-change-[width,transform]"
        )}
      >
        {/* Logo / Header */}
        <div
          className={cn(
            "border-b border-white/5 px-5",
            isMobile ? "h-16 hidden" : "flex h-20 lg:h-24 items-center justify-center"
          )}
        >
          {!isMobile && (
            <Link href="/dashboard" className="flex items-center gap-3" aria-label="Go to dashboard">
              <div className="flex-shrink-0 relative group">
                <div className="absolute inset-0 bg-cyan-500/30 blur-2xl rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse delay-75" />
                <Image
                  src="/images/tlogo.png"
                  alt="Velarith Logo"
                  width={48}
                  height={48}
                  className="object-contain relative z-10 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
                />
              </div>
              {(isHovered || isMobileOpen) && (
                <span className="text-xl lg:text-2xl font-bold gradient-text whitespace-nowrap tracking-wide animate-in slide-in-from-left-3 duration-500 ease-out">
                  Velarith
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent sidebar-safe-padding">
          {navigation.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const showLabel = isHovered || isMobileOpen || isMobile;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300 relative group min-w-0",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/10",
                  !showLabel && "justify-center"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Animated background for active state */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30 blur-lg animate-pulse" />
                )}
                
                {/* Icon */}
                <div className={cn(
                  "relative z-10 flex-shrink-0 transition-transform duration-300",
                  isActive && "scale-110",
                  !isActive && "group-hover:scale-110"
                )}>
                  <item.icon className="h-5 w-5 drop-shadow-lg" />
                </div>
                
                {/* Label */}
                {showLabel && (
                  <span className="relative z-10 font-semibold leading-snug">
                    {item.name}
                  </span>
                )}
                
                {/* Active indicator */}
                {isActive && showLabel && (
                  <div className="ml-auto relative z-10 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-white/70 animate-pulse delay-150" />
                  </div>
                )}
                
                {/* Hover glow */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Disclaimer */}
        {(isHovered || isMobileOpen) && (
          <div className="border-t border-white/5 px-5 py-4">
            <p className="text-[10px] leading-relaxed text-white/25">
              For informational and research purposes only. Nothing on this platform constitutes financial advice. Always consult a qualified financial professional before making any investment or trading decisions.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
