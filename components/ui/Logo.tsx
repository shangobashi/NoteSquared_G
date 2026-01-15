import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={twMerge("w-full h-full", className)}
      aria-label="Note² Logo"
    >
      <defs>
        <linearGradient id="logo_bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" /> {/* Indigo 400 */}
          <stop offset="100%" stopColor="#4338ca" /> {/* Indigo 700 */}
        </linearGradient>
        <filter id="sparkle-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded Background */}
      <rect width="512" height="512" rx="110" fill="url(#logo_bg)" />

      {/* Music Note Group */}
      <g fill="white">
        {/* Note Heads */}
        <circle cx="165" cy="360" r="55" />
        <circle cx="365" cy="300" r="55" />

        {/* Stems and Beam 
            Calculated for tangent alignment with 55px radius note heads.
            Stem width approx 35px.
        */}
        <path d="
          M 185 360
          L 185 150
          L 420 90
          L 420 300
          L 385 300
          L 385 138
          L 220 180
          L 220 360
          Z
        " />
      </g>

      {/* Sparkles */}
      <g fill="#fde047" filter="url(#sparkle-glow)"> {/* Yellow-300 */}
        {/* Top Right Sparkle */}
        <path d="M430 80 Q440 100 460 110 Q440 120 430 140 Q420 120 400 110 Q420 100 430 80 Z" />
        
        {/* Bottom Left Sparkle */}
        <path d="M90 380 Q100 395 115 400 Q100 405 90 420 Q80 405 65 400 Q80 395 90 380 Z" />
        
        {/* Subtle accent star */}
        <circle cx="300" cy="80" r="5" fill="#fde047" opacity="0.6" />
      </g>
    </svg>
  );
};