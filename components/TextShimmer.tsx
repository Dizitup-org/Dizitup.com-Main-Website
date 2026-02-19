
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const TextShimmer: React.FC<Props> = ({ children, className = '' }) => {
    return (
        <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className={`text-shimmer ${className}`}
        >
            {children}
        </motion.span>
    );
};

export default TextShimmer;
