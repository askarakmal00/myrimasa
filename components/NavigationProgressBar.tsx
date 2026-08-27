'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset/complete progress on route change
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Check if internal navigation link
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        targetAttr !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        !href.startsWith('/#') &&
        href !== pathname
      ) {
        setIsNavigating(true);
        setProgress(25);
        setTimeout(() => setProgress(65), 100);
        setTimeout(() => setProgress(85), 400);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!isNavigating && progress === 0) return null;

  return (
    <>
      {/* Top Gradient Progress Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          zIndex: 999999,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #166534 0%, #4ade80 50%, #e11d48 100%)',
            boxShadow: '0 0 12px rgba(74, 222, 128, 0.7), 0 0 4px rgba(225, 29, 72, 0.5)',
            transition: 'width 0.25s ease-out, opacity 0.25s ease-out',
            opacity: progress === 100 ? 0 : 1,
            borderRadius: '0 4px 4px 0',
          }}
        />
      </div>

      {/* Top-right corner floating spinner during page transitions */}
      <div
        style={{
          position: 'fixed',
          top: '12px',
          right: '14px',
          zIndex: 999999,
          pointerEvents: 'none',
          opacity: progress === 100 ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '2.5px solid rgba(22, 101, 52, 0.2)',
            borderTopColor: '#166534',
            animation: 'spin 0.65s linear infinite',
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>
    </>
  );
}
