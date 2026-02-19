
import React, { useEffect, useRef, useState } from 'react';

interface Props {
    end: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    label: string;
}

const AnimatedCounter: React.FC<Props> = ({ end, suffix = '', prefix = '', duration = 2000, label }) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        const startTime = performance.now();
        let rafId: number;

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic for a satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));

            if (progress < 1) {
                rafId = requestAnimationFrame(animate);
            }
        };

        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [hasStarted, end, duration]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-white">
                {prefix}{count}{suffix}
            </div>
            <p className="text-[10px] sm:text-xs font-mono text-white/30 uppercase tracking-[0.3em] mt-2">{label}</p>
        </div>
    );
};

export default AnimatedCounter;
