import React from 'react';
import { motion } from 'framer-motion';
import ERPDashboard from './ERPDashboard';
import CRMDashboard from './CRMDashboard';
import MobileMockup from './MobileMockup';

const Scrollytelling: React.FC = () => {
    return (
        <section className="bg-transparent w-full border-t border-white/5 relative overflow-hidden">

            
            <div className="container mx-auto px-4 sm:px-6 relative z-20 space-y-32 py-32">
                
                {/* 1. ERP Section (Text Left, Visual Right) */}
                <div className="w-full grid lg:grid-cols-2 gap-2 lg:gap-10 items-center min-h-[60vh]">
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col justify-center relative"
                    >
                        <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen -z-10" />
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-[800] leading-[1.05] tracking-tight text-white mb-6 uppercase">
                            ERP <span className="text-[#6b7280] font-light italic">Systems</span>.
                        </h2>
                        <p className="text-[#9CA3AF] text-lg sm:text-xl max-w-[500px] leading-relaxed mb-8">
                            Streamline operations and gain insights across finance, inventory, and analytics modules. Precision engineering for enterprise scale.
                        </p>
                        <div className="flex flex-wrap gap-4 max-w-[500px]">
                            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300">
                                Get Started
                            </button>
                            <button className="px-6 py-3 border border-gray-600 text-white hover:border-gray-400 hover:bg-white/5 font-semibold rounded-lg transition-colors duration-300">
                                Learn More
                            </button>
                        </div>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center justify-center lg:justify-end hidden md:flex"
                    >
                        <ERPDashboard />
                    </motion.div>
                </div>

                {/* 2. CRM Section (Visual Left, Text Right) - DIFFERENT LAYOUT */}
                <div className="w-full grid lg:grid-cols-2 gap-10 lg:gap-20 items-center min-h-[60vh]">
                    {/* Visual is first in DOM order for desktop, but text first on mobile usually? We'll use order classes */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center justify-center lg:justify-start hidden md:flex order-2 lg:order-1"
                    >
                        <CRMDashboard />
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col justify-center relative order-1 lg:order-2 lg:items-end lg:text-right"
                    >
                        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full mix-blend-screen -z-10" />
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-[800] leading-[1.05] tracking-tight text-white mb-6 uppercase">
                            CRM <span className="text-[#6b7280] font-light italic">Systems</span>.
                        </h2>
                        <p className="text-[#9CA3AF] text-lg sm:text-xl max-w-[500px] leading-relaxed">
                            Automate workflows, manage client data, and boost sales efficiency with intelligently integrated pipeline solutions.
                        </p>
                    </motion.div>
                </div>

                {/* 3. Mobile Apps (Text Left, Visual Right) */}
                <div className="w-full grid lg:grid-cols-2 gap-10 lg:gap-20 items-center min-h-[60vh]">
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col justify-center relative"
                    >
                        <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full mix-blend-screen -z-10" />
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-[800] leading-[1.05] tracking-tight text-white mb-6 uppercase">
                            Mobile <span className="text-[#6b7280] font-light italic">Apps</span>.
                        </h2>
                        <p className="text-[#9CA3AF] text-lg sm:text-xl max-w-[500px] leading-relaxed">
                            We create intuitive, high-performance mobile experiences tailored for your users, engineered for raw growth and retention.
                        </p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center justify-center lg:justify-end hidden md:flex"
                    >
                        <MobileMockup />
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default Scrollytelling;
