import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

export function useDevice(): DeviceType {
  const [device, setDevice] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth < 768 ? 'mobile' : 'desktop';
  });

  useEffect(() => {
    const check = () => {
      setDevice(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };

    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return device;
}
