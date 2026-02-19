
import React, { useRef, useCallback, useState, useEffect } from 'react';

interface Props {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}

const TiltCard: React.FC<Props> = ({ children, className = '', intensity = 8 }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch(window.matchMedia('(hover: none)').matches);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouch || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        cardRef.current.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.02)`;
    }, [isTouch, intensity]);

    const handleMouseLeave = useCallback(() => {
        if (cardRef.current) {
            cardRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
        }
    }, []);

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{
                transition: 'transform 0.3s ease-out',
                willChange: 'transform',
            }}
        >
            {children}
        </div>
    );
};

export default TiltCard;
