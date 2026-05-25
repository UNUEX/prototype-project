'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  delay?: number;
  threshold?: number;
  className?: string;
}

export default function ScrollAnimation({
  children,
  animation = 'fadeInUp',
  delay = 0,
  threshold = 0.1,
  className = '',
}: ScrollAnimationProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(`animate-${animation}`);
            if (delay > 0) {
              (entry.target as HTMLElement).style.animationDelay = `${delay}s`;
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [animation, delay, threshold]);

  return (
    <div ref={elementRef} className={`scroll-animation-element ${className}`}>
      {children}
    </div>
  );
}