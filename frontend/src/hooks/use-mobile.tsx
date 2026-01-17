import * as React from "react";

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>('desktop');
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    // Detect touch device
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.mobile) {
        setBreakpoint('mobile');
      } else if (width < BREAKPOINTS.tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isTouch,
  };
}

// Legacy hook for backward compatibility
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
