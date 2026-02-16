"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./theme-toggle";

const Navbar = () => {
  const { data: session } = useSession() as any;
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/roadmap-chat", label: "Our Services" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/reports", label: "Reports" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed left-1/2 top-4 z-50 w-full max-w-5xl -translate-x-1/2 px-4 font-sans"
    >
      <div
        className="flex items-center justify-between rounded-2xl border border-white/10 
        bg-gradient-to-r from-gray-900/60 via-gray-800/40 to-gray-900/60 
        dark:from-gray-900/80 dark:via-gray-800/60 dark:to-gray-900/80
        shadow-2xl backdrop-blur-2xl px-4 py-3 transition-all duration-500"
      >
        {/* --- Logo --- */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white dark:text-white hover:opacity-90 transition-opacity z-50"
        >
          <div className="flex items-center gap-1 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white opacity-70"></div>
            <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
          </div>
          <span className="text-lg font-bold tracking-tight bg-white bg-clip-text text-transparent">
            NeuraView.AI
          </span>
        </Link>

        {/* --- Desktop Navigation Links --- */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-sm transition-all duration-300 ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </div>

        {/* --- Desktop Auth Buttons & Theme Toggle --- */}
        <div className="hidden md:flex items-center gap-3">
          {/* <ThemeToggle /> */}
          {session?.user?.id ? (
            <>
              <Link
                href="/create-interview"
                className="rounded-lg px-4 py-2 text-xs font-semibold 
                text-white bg-gradient-to-r from-green-600 to-emerald-500 
                hover:from-green-500 hover:to-emerald-400 transition-all shadow-lg shadow-green-600/20 
                hover:shadow-green-400/40 duration-300"
              >
                Start Interview
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-white/20 px-4 py-2 text-xs 
                font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-400 
                text-xs font-semibold text-black px-4 py-2 shadow-md hover:opacity-90 transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* --- Mobile Menu Button & Theme Toggle --- */}
        <div className="flex md:hidden items-center gap-2 z-50">
          {/* <ThemeToggle /> */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu Dropdown --- */}
      <div
        className={`md:hidden mt-2 rounded-2xl border border-white/10 
        bg-gradient-to-r from-gray-900/95 via-gray-800/90 to-gray-900/95 
        dark:from-gray-900/98 dark:via-gray-800/95 dark:to-gray-900/98
        shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 py-4 space-y-3">
          {/* Mobile Navigation Links */}
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobileMenu}
                className={`block px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}

          {/* Mobile Auth Buttons */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            {session?.user?.id ? (
              <>
                <Link
                  href="/create-interview"
                  onClick={closeMobileMenu}
                  className="block w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-center
                  text-white bg-gradient-to-r from-green-600 to-emerald-500 
                  hover:from-green-500 hover:to-emerald-400 transition-all shadow-lg shadow-green-600/20"
                >
                  Start Interview
                </Link>

                <button
                  onClick={() => {
                    closeMobileMenu();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm 
                  font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={closeMobileMenu}
                  className="block w-full rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-center text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  onClick={closeMobileMenu}
                  className="block w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-400 
                  text-sm font-semibold text-black px-4 py-2.5 text-center shadow-md hover:opacity-90 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
