'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { LogOut, Menu, X, ChevronDown, Users, Calendar, Image, Loader2 } from 'lucide-react';

const NavBar = () => {
  const { isAdmin, logout, session } = useAuth();
  const { setSelectedCoupleId } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const handleStart = () => setNavigating(true);
    const handleComplete = () => setNavigating(false);

    // Listen to route changes
    return () => {
      setNavigating(false);
    };
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setSelectedCoupleId(null);
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const isGroupActive = (hrefs: string[]) => {
    return hrefs.some((href) => isActive(href));
  };

  const dropdownMenus = [
    {
      id: 'guests',
      label: 'Guests',
      icon: Users,
      items: [
        { href: '/', label: 'Add Guest' },
        { href: '/guests', label: 'Guest List' },
        { href: '/verify', label: 'Verify' },
        { href: '/tags', label: 'Tags' },
        { href: '/seating', label: 'Seating' }
      ]
    },
    {
      id: 'planning',
      label: 'Planning',
      icon: Calendar,
      items: [
        { href: '/events', label: 'Events' },
        { href: '/timeline', label: 'Timeline' },
        { href: '/budget', label: 'Budget' },
        { href: '/registry', label: 'Registry' }
      ]
    },
    {
      id: 'media',
      label: 'Media',
      icon: Image,
      items: [
        { href: '/photos', label: 'Photos' },
        { href: '/messages', label: 'Messages' }
      ]
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Loading Indicator */}
      {navigating && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-pink-500 animate-pulse"></div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block" style={{ letterSpacing: '-0.02em' }}>
                Wedding RSVP
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Dashboard
            </Link>

            {/* Dropdown Menus */}
            {dropdownMenus.map((menu) => {
              const Icon = menu.icon;
              const active = isGroupActive(menu.items.map((item) => item.href));

              return (
                <div
                  key={menu.id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(menu.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => setOpenDropdown(openDropdown === menu.id ? null : menu.id)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {menu.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {openDropdown === menu.id && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                      onMouseEnter={() => setOpenDropdown(menu.id)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {menu.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isActive(item.href)
                              ? 'bg-indigo-50 text-indigo-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Settings */}
            <Link
              href="/settings"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/settings')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Settings
            </Link>

            {/* Admin: Couples */}
            {mounted && isAdmin && (
              <Link
                href="/couples"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/couples')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Couples
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {mounted && session?.couple?.name && (
              <span className="hidden sm:block text-sm text-gray-700 font-medium">
                {session.couple.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Dashboard
            </Link>

            {/* Mobile Dropdown Groups */}
            {dropdownMenus.map((menu) => {
              const Icon = menu.icon;
              return (
                <div key={menu.id} className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {menu.label}
                  </div>
                  {menu.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-6 py-2 rounded-lg text-base font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              );
            })}

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                isActive('/settings')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Settings
            </Link>

            {/* Admin: Couples */}
            {mounted && isAdmin && (
              <Link
                href="/couples"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                  isActive('/couples')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Couples
              </Link>
            )}

            {mounted && session?.couple?.name && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200 mt-2 pt-2">
                {session.couple.name}
              </div>
            )}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
