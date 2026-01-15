import React from 'react';
import { twMerge } from 'tailwind-merge';
import logoUrl from '../../logo.png';

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({ className, alt = 'Note Squared Logo' }) => {
  return (
    <img
      src={logoUrl}
      alt={alt}
      className={twMerge('w-full h-full object-cover rounded-[inherit]', className)}
      loading="lazy"
      decoding="async"
    />
  );
};
