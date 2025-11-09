'use client';

import Link from 'next/link';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userId?: string;
  userRole?: 'provider' | 'patient';
  actionButton?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
  };
  backButton?: {
    label: string;
    href: string;
  };
}

export default function Header({
  title,
  subtitle,
  userName,
  userId,
  userRole,
  actionButton,
  backButton,
}: HeaderProps) {
  return (
    <header className="bg-[#002C5F] text-white p-6 shadow-lg">
      <div className="max-w-7xl mx-auto">
        {backButton && (
          <Link
            href={backButton.href}
            className="text-white/80 hover:text-white mb-2 flex items-center inline-flex"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            {backButton.label}
          </Link>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {title}
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-normal">DEMO MODE</span>
            </h1>
            {subtitle && <p className="text-white/80 mt-1">{subtitle} • Real hospital pricing data</p>}
            {!subtitle && userName && (
              <p className="text-white/80 mt-1">
                Welcome, {userName} • Real hospital pricing data
              </p>
            )}
            {subtitle && userName && (
              <p className="text-white/80 mt-1">
                Welcome, {userName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            {userId && userRole && (
              <NotificationBell userId={userId} userRole={userRole} />
            )}

            {/* Action Button */}
            {actionButton && (
              <Link
                href={actionButton.href}
                className={
                  actionButton.variant === 'secondary'
                    ? 'btn-primary bg-white text-[#002C5F] hover:bg-gray-100'
                    : 'btn-primary'
                }
              >
                {actionButton.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
