'use client';

import { useEffect, useState } from 'react';

function useWindowHeight() {
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    let timeout: number | undefined;

    const updateViewportHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const vh = height * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setWindowHeight(height);
    };

    const refreshViewportHeight = () => {
      updateViewportHeight();
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(updateViewportHeight, 250);
    };

    refreshViewportHeight();

    const frame = window.requestAnimationFrame(() => {
      refreshViewportHeight();
    });

    window.addEventListener('resize', refreshViewportHeight);
    window.addEventListener('orientationchange', refreshViewportHeight);
    window.addEventListener('focus', refreshViewportHeight);
    window.addEventListener('visibilitychange', refreshViewportHeight);

    return () => {
      window.cancelAnimationFrame(frame);
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
      window.removeEventListener('resize', refreshViewportHeight);
      window.removeEventListener('orientationchange', refreshViewportHeight);
      window.removeEventListener('focus', refreshViewportHeight);
      window.removeEventListener('visibilitychange', refreshViewportHeight);
    };
  }, []);

  return windowHeight;
}

export default useWindowHeight;
