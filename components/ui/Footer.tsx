import React, { useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import gsap from 'gsap';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const lineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!lineRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { opacity: 0.4, scaleX: 0.85 },
        {
          opacity: 0.75,
          scaleX: 1,
          duration: 2.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }
      );

      gsap.to(lineRef.current, {
        backgroundPosition: '200% 50%',
        duration: 6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, lineRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className={twMerge('mt-10 pb-6', className)}>
      <div className="max-w-3xl mx-auto px-4">
        <div
          ref={lineRef}
          className="h-px w-3/5 max-w-md mx-auto rounded-full bg-gradient-to-r from-transparent via-slate-300/60 to-transparent dark:via-slate-600/60 origin-center"
          style={{ backgroundSize: '200% 100%', backgroundPosition: '0% 50%' }}
          aria-hidden="true"
        />
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          © 2026 BlueLabs
        </p>
      </div>
    </footer>
  );
};
