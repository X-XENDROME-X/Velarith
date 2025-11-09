'use client';

import { useEffect, useState } from 'react';

function useWindowHeight() {
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    function handleResize() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setWindowHeight(window.innerHeight);
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowHeight;
}

export default useWindowHeight;
