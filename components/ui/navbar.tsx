'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

const NavBar = () => {
  const { isAdmin, logout, session } = useAuth();
  const { setSelectedCoupleId } = useSettings();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setSelectedCoupleId(null);
    router.push('/login');
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="flex justify-between items-center">
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="text-white hover:text-gray-300">Add Guest</Link>
          </li>
          <li>
            <Link href="/guests" className="text-white hover:text-gray-300">Guest List</Link>
          </li>
          <li>
            <Link href="/verify" className="text-white hover:text-gray-300">Verify Guest</Link>
          </li>
          <li>
            <Link href="/users/tags" className="text-white hover:text-gray-300">Assign Tags</Link>
          </li>
          <li>
            <Link href="/settings" className="text-white hover:text-gray-300">Settings</Link>
          </li>
          {isAdmin && (
            <li>
              <Link href="/couples" className="text-white hover:text-gray-300">Couples</Link>
            </li>
          )}
        </ul>
        <div className="flex items-center space-x-4 text-white">
          {session?.couple?.name && <span>{session.couple.name}</span>}
          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
