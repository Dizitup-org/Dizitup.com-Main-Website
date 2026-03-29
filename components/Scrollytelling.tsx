import React from 'react';
import { motion } from 'framer-motion';
import ERPDashboard from './ERPDashboard';
import CRMDashboard from './CRMDashboard';
import MobileMockup from './MobileMockup';

const Scrollytelling: React.FC = () => {
    return (
        <section className="bg-transparent w-full border-t border-white/5 relative overflow-hidden">

            <div className="container mx-auto px-4 sm:px-6 relative z-20 space-y-24 sm:space-y-32 py-20 sm:py-32">
                
                {/* 1. ERP Section (Text Left, Visual Right) */}
                <div className="w-full flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col justify-center relative"
                    >
                        <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-[350px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen -z-10" />
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-[800] leading-[1.05] tracking-tight text-white mb-6 uppercase">
                            ERP <span className="text-[#6b7280] font-light italic">Systems</span>.
                        </h2>
                        <p className="text-[#9CA3AF] text-base sm:text-xl leading-relaxed max-w-[480px]">
                            Streamline operations and gain insights across finance, inventory, and analytics modules. Precision engineering for enterprise scale.
                        </p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center justify-center lg:justify-end w-full overflow-hidden"
                    >
                        <div className="scale-[0.62] sm:scale-75 lg:scale-100 origin-top">
                            <ERPDashboard />
                        </div>
                    </motion.div>
                </div>

                {/* 2. CRM Section (Visual Left, Text Right) */}
                <div className="w-full flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col justify-center relative lg:order-2 lg:items-end lg:text-right lg:ml-auto"
                    >
                        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full mix-blend-screen -z-10" />
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-[800] leading-[1.05] tracking-tight text-white mb-6 uppercase ml-auto">
                            CRM <span className="text-[#6b7280] font-light italic">Systems</span>.
                        </h2>
                        <p className="text-[#9CA3AF] text-base sm:text-xl leading-relaxed max-w-[480px] ml-auto">
                            Automate workflows, manage client data, and boost sales efficiency with intelligently integrated pipeline solutions.
                        </p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center justify-center lg:justify-start lg:order-1 w-full overflow-hidden"
                    >
                        <div className="scale-[0.62] sm:scale-75 lg:scale-100 origin-top">
                            <CRMDashboard />
                        </div>
                    </motion.div>
                </div>

                {/* 3. Mobile Apps (Text Left, Visual Right) */}
                <div className="w-full flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
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
                        <p className="text-[#9CA3AF] text-base sm:text-xl leading-relaxed max-w-[480px]">
                            We create intuitive, high-performance mobile experiences tailored for your users, engineered for raw growth and retention.
                        </p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center justify-center lg:justify-end w-full overflow-hidden"
                    >
                        <div className="scale-[0.62] sm:scale-75 lg:scale-100 origin-top">
                            <MobileMockup />
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default Scrollytelling;

