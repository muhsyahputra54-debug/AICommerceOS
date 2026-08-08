"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";

import MobileSidebar from "./MobileSidebar";
import UserProfile from "./UserProfile";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
        {/* Left Side */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Mobile Menu */}
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex h-10 w-full max-w-md items-center gap-3 rounded-lg border bg-muted/30 px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

              <input
                type="search"
                placeholder="Search..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="ml-3 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            title="Notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <UserProfile />
        </div>
      </header>

      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}