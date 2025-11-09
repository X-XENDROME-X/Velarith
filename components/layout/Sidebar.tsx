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
  BarChart3,
  Settings,
  LogIn,
  X,
  Menu,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Markets", href: "/markets", icon: TrendingUp },
  { name: "AI Assistant", href: "/assistant", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isSettingsActive = pathname?.startsWith("/settings") ?? false;
  const isLoginActive = pathname?.startsWith("/login") ?? false;

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

  return (
    <>
      {/* Mobile/Tablet top bar */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] h-16 bg-[#0B1120]/98 backdrop-blur-2xl border-b border-white/10 shadow-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full" />
                <Image
                  src="/images/tlogo.png"
                  alt="Velarith logo"
                  width={36}
                  height={36}
                  className="relative z-10 object-contain drop-shadow-lg"
                />
              </div>
              <span className="text-lg font-semibold gradient-text">Velarith</span>
            </div>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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
          isMobile ? "top-16 left-0 h-[calc(100vh-4rem)]" : "top-0 h-full lg:left-0",
          // Desktop: hover expand behavior
          isHovered && !isMobile ? "lg:w-72" : "lg:w-20",
          // Mobile: slide in from left
          isMobile ? (isMobileOpen ? "w-[280px] translate-x-0 shadow-2xl" : "-translate-x-full w-[280px]") : "translate-x-0",
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
            <div className="flex items-center gap-3">
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
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            const showLabel = isHovered || isMobileOpen || isMobile;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300 relative group overflow-hidden",
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
                  <span className="relative z-10 font-semibold truncate">
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

        {/* Settings & Login */}
        <div className="border-t border-white/5 px-3 py-4 space-y-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300 relative group overflow-hidden",
              isSettingsActive
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/10",
              !(isHovered || isMobileOpen || isMobile) && "justify-center"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex-shrink-0 transition-all duration-500",
                isSettingsActive ? "scale-110" : "group-hover:rotate-90 group-hover:scale-110"
              )}
            >
              <Settings className="h-5 w-5 drop-shadow-lg" />
            </div>

            {/* Label */}
            {(isHovered || isMobileOpen || isMobile) && (
              <span className="relative z-10 font-semibold truncate">
                Settings
              </span>
            )}

            {/* Active indicator */}
            {isSettingsActive && (isHovered || isMobileOpen || isMobile) && (
              <div className="ml-auto relative z-10 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-white/70 animate-pulse delay-150" />
              </div>
            )}

            {/* Hover glow */}
            {!isSettingsActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/0 via-gray-400/10 to-gray-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </Link>

          <Link
            href="/login"
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300 relative group overflow-hidden",
              isLoginActive
                ? "bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/10",
              !(isHovered || isMobileOpen || isMobile) && "justify-center"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex-shrink-0 transition-transform duration-300",
                isLoginActive ? "scale-110" : "group-hover:scale-110"
              )}
            >
              <LogIn className="h-5 w-5 drop-shadow-lg" />
            </div>

            {/* Label */}
            {(isHovered || isMobileOpen || isMobile) && (
              <span className="relative z-10 font-semibold truncate">
                Log in
              </span>
            )}

            {/* Active indicator */}
            {isLoginActive && (isHovered || isMobileOpen || isMobile) && (
              <div className="ml-auto relative z-10 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-white/70 animate-pulse delay-150" />
              </div>
            )}

            {/* Hover glow */}
            {!isLoginActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
